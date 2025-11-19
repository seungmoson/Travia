from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, distinct
from typing import List, Optional

# Elasticsearch 설정
from elasticsearch import Elasticsearch

from database import get_db
from models import (
    Content, GuideProfile, User, ContentImage, Booking, Review, Tag, ContentTag,
    AiCharacter, AiCharacterDefinitionTag, GuideReview
)
from schemas import (
    ContentListSchema, ContentDetailSchema, ReviewSchema, RelatedContentSchema,
    ContentListResponse, MapContentSchema
)

# Elasticsearch 연결 시도
try:
    es = Elasticsearch("http://localhost:9200")
    es.info()
    print("Elasticsearch 클라이언트 연결 성공")
except Exception as e:
    print(f"Elasticsearch 연결 실패 (DB 검색만 사용됩니다): {e}")
    es = None

router = APIRouter(tags=["content"])

# 1. [지역 목록 조회]
@router.get("/locations", summary="등록된 컨텐츠들의 지역 목록 조회")
def get_locations(db: Session = Depends(get_db)):
    try:
        locations = db.query(distinct(Content.location))\
                      .filter(Content.status == 'Active')\
                      .all()
        result = [loc[0] for loc in locations if loc[0]]
        return result
    except Exception as e:
        print(f"Error fetching locations: {e}")
        return []


# 2. [콘텐츠 목록 조회] - (최적화됨)
@router.get("/list", response_model=ContentListResponse)
def get_content_list(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="페이지 번호"),
    per_page: int = Query(9, ge=1, le=50, description="페이지당 콘텐츠 개수"),
    search_terms: Optional[List[str]] = Query(None, alias="q", description="텍스트 검색어"),
    location: Optional[str] = Query(None, description="지역 필터"),
    tags: Optional[str] = Query(None, description="태그 필터"),
    style: Optional[str] = Query(None, description="캐릭터 스타일 (예: 모험가)")
):
    # --- A. Elasticsearch 검색 (텍스트 검색어 q가 있을 때만) ---
    if search_terms and es:
        try:
            query_string = " ".join(search_terms)
            es_query = {
                "query": {
                    "bool": {
                        "should": [
                            { "match": { "title": { "query": query_string, "boost": 3 } } },
                            { "terms": { "all_tags": search_terms, "boost": 2 } },
                            { "match": { "all_reviews_text": { "query": query_string, "boost": 1.5 } } },
                            { "match": { "description": { "query": query_string, "boost": 1 } } }
                        ],
                        "minimum_should_match": 1
                    }
                },
                "from": (page - 1) * per_page,
                "size": per_page
            }
            
            response = es.search(index="contents", body=es_query)
            total_count = response['hits']['total']['value']
            
            if total_count > 0:
                hits = response['hits']['hits']
                content_list = []
                for hit in hits:
                    source = hit['_source']
                    content_list.append(ContentListSchema(
                        id=source.get('id'),
                        title=source.get('title'),
                        description=source.get('description', '설명 없음'),
                        price=source.get('price', 0),
                        location=source.get('location', '미정'),
                        guide_nickname=source.get('guide_nickname', '정보 없음'),
                        main_image_url=source.get('image_url') or source.get('main_image_url'),
                        guide_id=source.get('guide_id')
                    ))
                return ContentListResponse(contents=content_list, total_count=total_count)
        except Exception as e:
            print(f"ES Search Error: {e}")
            # ES 실패 시 DB 조회로 넘어감

    # --- B. DB 조회 (필터링 적용) ---
    # 1. 기본 쿼리 구성 (Content + GuideProfile + User + Image)
    results_query = db.query(
        Content.id,
        Content.title,
        Content.description,
        Content.price,
        Content.location,
        User.nickname.label("guide_nickname"),
        ContentImage.image_url.label("main_image_url"),
        Content.guide_id,
        Content.created_at
    ).join(
        GuideProfile, Content.guide_id == GuideProfile.users_id
    ).join(
        User, GuideProfile.users_id == User.id
    ).outerjoin(
        ContentImage, (Content.id == ContentImage.contents_id) & (ContentImage.is_main == True)
    ).filter(
        Content.status == "Active"
    )

    # 2. [지역 필터]
    if location:
        results_query = results_query.filter(Content.location.like(f"%{location}%"))

    # 3. [캐릭터/스타일 필터] - (최적화 완료)
    if style:
        # GuideProfile에 미리 저장된 '대표 캐릭터(ai_character_id_as_guide)'를 바로 조인합니다.
        # 성능이 매우 빠르고 로직이 단순합니다.
        results_query = results_query.join(
            AiCharacter, GuideProfile.ai_character_id_as_guide == AiCharacter.id
        ).filter(
            AiCharacter.name == style
        )

    # 4. [태그 필터]
    if tags:
        tag_list = tags.split(',')
        results_query = results_query.join(ContentTag).join(Tag).filter(
            Tag.name.in_([t.strip() for t in tag_list])
        )

    # 5. 결과 조회
    results_query = results_query.distinct()
    total_count = results_query.count()
    
    results = results_query.order_by(Content.created_at.desc())\
                           .offset((page - 1) * per_page)\
                           .limit(per_page)\
                           .all()

    # 6. 변환
    content_list = []
    for row in results:
        content_list.append(ContentListSchema(
            id=row.id,
            title=row.title,
            description=row.description if row.description else "설명 없음",
            price=row.price if row.price is not None else 0,
            location=row.location if row.location else "미정",
            guide_nickname=row.guide_nickname if row.guide_nickname else "정보 없음",
            main_image_url=row.main_image_url,
            guide_id=row.guide_id
        ))

    return ContentListResponse(
        contents=content_list,
        total_count=total_count
    )


# 3. [지도 데이터 조회]
@router.get("/map-data", response_model=List[MapContentSchema])
def get_map_content_by_area(
    area: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    avg_rating_subquery = db.query(
        Booking.content_id,
        func.avg(Review.rating).label("avg_rating")
    ).join(Review, Booking.id == Review.booking_id).group_by(Booking.content_id).subquery()

    query = db.query(
        Content.id,
        Content.title,
        Content.location,
        Content.latitude,
        Content.longitude,
        Content.description,
        Content.price,
        ContentImage.image_url.label("main_image_url"),
        avg_rating_subquery.c.avg_rating.label("rating")
    ).outerjoin(
        ContentImage, (Content.id == ContentImage.contents_id) & (ContentImage.is_main == True)
    ).outerjoin(
        avg_rating_subquery, Content.id == avg_rating_subquery.c.content_id
    ).filter(
        Content.status == "Active",
        Content.latitude.isnot(None),
        Content.longitude.isnot(None)
    )
    
    if area:
        query = query.filter(Content.location == area)
    
    results = query.all()
    
    map_contents = []
    for row in results:
        calculated_rating = float(row.rating) if row.rating is not None else 0.0
        map_contents.append(MapContentSchema(
            id=row.id,
            title=row.title,
            location=row.location,
            latitude=row.latitude,
            longitude=row.longitude,
            main_image_url=row.main_image_url,
            description=row.description,
            price=row.price,
            rating=calculated_rating
        ))
    return map_contents


# 4. [인기 태그 조회]
@router.get("/tags", response_model=List[str])
def get_popular_tags(db: Session = Depends(get_db)):
    query = db.query(Tag.name).join(ContentTag, Tag.id == ContentTag.tag_id)\
              .group_by(Tag.id, Tag.name).order_by(func.count(ContentTag.contents_id).desc())
    results = query.all()
    return [row[0] for row in results]


# 5. [상세 조회]
@router.get("/{content_id}", response_model=ContentDetailSchema)
def get_content_detail(
    content_id: int,
    reviews_page: int = Query(1, ge=1),
    reviews_per_page: int = Query(5, ge=1),
    related_page: int = Query(1, ge=1),
    related_per_page: int = Query(4, ge=1),
    db: Session = Depends(get_db)
):
    content = db.query(Content).options(
        joinedload(Content.guide).joinedload(GuideProfile.user)
    ).filter(
        Content.id == content_id,
        Content.status == "Active"
    ).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    guide_name = "공식 가이드"
    guide_nickname = "정보 없음"
    guide_avg_rating = None
    if content.guide and content.guide.user:
        guide_name = content.guide.user.nickname
        guide_nickname = content.guide.user.nickname
        guide_avg_rating = content.guide.avg_rating

    main_image_url = db.query(ContentImage.image_url).filter(
        ContentImage.contents_id == content_id,
        ContentImage.is_main == True
    ).scalar()

    content_rating_stats = db.query(
        func.avg(Review.rating).label("avg_rating"),
        func.count(Review.id).label("total_reviews_count")
    ).join(Booking, Review.booking_id == Booking.id).filter(Booking.content_id == content_id).first()

    total_reviews_count = content_rating_stats.total_reviews_count if content_rating_stats else 0
    avg_content_rating = round(float(content_rating_stats.avg_rating), 1) if content_rating_stats and content_rating_stats.avg_rating else 0.0

    review_results = db.query(Review).options(joinedload(Review.reviewer))\
        .join(Booking, Review.booking_id == Booking.id)\
        .filter(Booking.content_id == content_id)\
        .order_by(Review.created_at.desc())\
        .offset((reviews_page - 1) * reviews_per_page).limit(reviews_per_page).all()

    reviews_data = []
    for review in review_results:
        reviews_data.append(ReviewSchema(
            id=review.id,
            user=review.reviewer.nickname if review.reviewer else "알 수 없음",
            rating=float(review.rating),
            text=review.text,
            created_at=review.created_at
        ))

    total_related_count = db.query(func.count(Content.id)).filter(
        Content.id != content_id, Content.status == "Active"
    ).scalar() or 0

    related_results = db.query(Content.id, Content.title, Content.price, ContentImage.image_url.label("imageUrl"))\
        .outerjoin(ContentImage, (Content.id == ContentImage.contents_id) & (ContentImage.is_main == True))\
        .filter(Content.id != content_id, Content.status == "Active")\
        .order_by(Content.created_at.desc())\
        .offset((related_page - 1) * related_per_page).limit(related_per_page).all()

    related_contents_data = []
    for r in related_results:
        related_contents_data.append(RelatedContentSchema(
            id=r.id, title=r.title, price=f"{r.price:,}" if r.price else "문의",
            rating=0.0, time="2시간 소요", imageUrl=r.imageUrl
        ))

    tags_data = db.query(Tag).join(ContentTag, Tag.id == ContentTag.tag_id).filter(ContentTag.contents_id == content_id).all()

    return ContentDetailSchema(
        id=content.id, title=content.title, description=content.description,
        price=content.price if content.price else 0, location=content.location if content.location else "미정",
        created_at=content.created_at, status=content.status,
        main_image_url=main_image_url, guide_name=guide_name, guide_nickname=guide_nickname,
        guide_avg_rating=guide_avg_rating, guide_id=content.guide_id,
        reviews=reviews_data, related_contents=related_contents_data, tags=tags_data,
        rating=avg_content_rating, review_count=total_reviews_count, total_related_count=total_related_count
    )