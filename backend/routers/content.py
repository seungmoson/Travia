from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, distinct
from typing import List, Optional
from datetime import datetime
import random

from database import get_db
from models import Content, GuideProfile, User, ContentImage, Booking, Review, Tag, ContentTag
from schemas import (
    ContentListSchema, ContentDetailSchema, ReviewSchema, RelatedContentSchema,
    ContentListResponse,
    MapContentSchema 
)

# 1. APIRouter 인스턴스 생성
router = APIRouter(
    tags=["content"]
)

# 2. GET /list 엔드포인트 정의 (MainPage용)
@router.get("/list", response_model=ContentListResponse)
def get_content_list(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="페이지 번호"),
    per_page: int = Query(9, ge=1, le=50, description="페이지당 콘텐츠 개수 (기본 9개)"),
    search_terms: Optional[List[str]] = Query(None, alias="q", description="검색어 목록 (제목 또는 태그)")
):
    """
    상태가 'Active'인 모든 콘텐츠의 목록을 페이지네이션하여 조회합니다.
    검색어(q=)가 있으면 각 단어를 제목 또는 태그와 '부분 일치(OR)'하여 필터링합니다.
    """
    
    common_search_filter = None
    if search_terms:
        search_conditions = []
        for term in search_terms:
            if term.strip():
                term_filter = f"%{term}%"
                search_conditions.append(Content.title.ilike(term_filter))
                search_conditions.append(Tag.name.ilike(term_filter))
        
        if search_conditions:
            common_search_filter = or_(*search_conditions)

    
    # 1. 전체 개수 쿼리
    total_count_query = db.query(func.count(distinct(Content.id))).filter(Content.status == "Active")

    if common_search_filter is not None:
        total_count_query = total_count_query.join(
            ContentTag, Content.id == ContentTag.contents_id
        ).join(
            Tag, ContentTag.tag_id == Tag.id
        ).filter(common_search_filter)
    
    total_count = total_count_query.scalar() or 0

    if total_count == 0:
        return ContentListResponse(contents=[], total_count=0)

    # 2. 실제 목록 쿼리
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

    if common_search_filter is not None:
        results_query = results_query.join(
            ContentTag, Content.id == ContentTag.contents_id
        ).join(
            Tag, ContentTag.tag_id == Tag.id
        ).filter(common_search_filter)

    results = results_query.distinct().order_by(
        Content.created_at.desc()
    ).offset(
        (page - 1) * per_page
    ).limit(
        per_page
    ).all()


    # 3. 스키마 변환
    content_list = []
    for row in results:
        try:
            schema_instance = ContentListSchema(
                id=row.id,
                title=row.title,
                description=row.description if row.description else "설명 없음",
                price=row.price if row.price is not None else 0,
                location=row.location if row.location else "미정",
                guide_nickname=row.guide_nickname if row.guide_nickname else "정보 없음",
                main_image_url=row.main_image_url,
                guide_id=row.guide_id
            )
            content_list.append(schema_instance)
        except Exception as e:
            print(f"Error converting content ID {row.id} to schema: {e}")

    # 4. 최종 응답 반환
    return ContentListResponse(
        contents=content_list,
        total_count=total_count
    )


# --- ▼ [수정] 지도 데이터용 엔드포인트 (평균 별점 계산 포함) ▼ ---
@router.get("/map-data", response_model=List[MapContentSchema])
def get_map_content_by_area(
    area: Optional[str] = Query(None, description="GeoJSON의 'sggnm' (예: 해운대구). 생략 시 전체 반환"),
    db: Session = Depends(get_db)
):
    """
    [지도 전용] 특정 지역(area) 또는 '전체' 콘텐츠 목록을 지도 마커 및 사이드바용으로 반환합니다.
    - main_image_url, description, price 등 사이드바에 필요한 데이터를 포함합니다.
    - [수정] N+1 문제를 피하면서 평균 별점(rating)을 계산합니다.
    """
    
    # 1. 기본 쿼리: [수정] 평균 별점(avg_rating)을 계산하는 서브쿼리 JOIN
    
    # 1-1. [신규] 콘텐츠별 평균 별점을 계산하는 서브쿼리 생성
    # (ContentDetail의 로직을 가져와서 서브쿼리 형태로 변경)
    avg_rating_subquery = db.query(
        Booking.content_id,
        func.avg(Review.rating).label("avg_rating")
    ).join(
        Review, Booking.id == Review.booking_id
    ).group_by(
        Booking.content_id
    ).subquery() # 👈 서브쿼리로 만듭니다.

    # 1-2. 메인 쿼리 (Content)
    query = db.query(
        Content.id,
        Content.title,
        Content.location,
        Content.latitude,
        Content.longitude,
        Content.description,
        Content.price,
        ContentImage.image_url.label("main_image_url"),
        # [신규] 서브쿼리에서 계산된 avg_rating 값을 'rating' 컬럼으로 선택
        avg_rating_subquery.c.avg_rating.label("rating") 
    ).outerjoin(
        # [신규] 메인 이미지 조인
        ContentImage, (Content.id == ContentImage.contents_id) & (ContentImage.is_main == True)
    ).outerjoin(
        # [신규] 평균 별점 서브쿼리 조인
        avg_rating_subquery, Content.id == avg_rating_subquery.c.content_id
    ).filter(
        Content.status == "Active",
        Content.latitude.isnot(None),
        Content.longitude.isnot(None)
    )
    
    # 2. area 파라미터가 '주어진 경우에만' 위치 필터링을 추가
    if area:
        query = query.filter(Content.location == area) 
    
    # 3. 쿼리 실행
    results = query.all()
    
    if not results:
        return []
    
    # 4. [수정] 스키마 수동 변환
    # 쿼리 결과(Row 객체 리스트)를 MapContentSchema 리스트로 변환
    map_contents = []
    for row in results:
        try:
            # [수정] row.rating (서브쿼리 결과)이 None일 경우 0.0으로 처리
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
                rating=calculated_rating # 👈 [수정] 계산된 별점 값을 할당
            ))
        except Exception as e:
            print(f"Error converting map content ID {row.id} to schema: {e}")
            
    return map_contents
# --- ▲ [수정 완료] ▲ ---


# --- ▼ 인기 태그 목록 엔드포인트 (변경 없음) ▼ ---
@router.get("/tags", response_model=List[str])
def get_popular_tags(
    db: Session = Depends(get_db) 
):
    """
    [수정] 가장 많이 사용된 태그(Popular Tags) '전체' 목록을 반환합니다.
    (limit 파라미터 제거)
    """
    query = db.query(
        Tag.name 
    ).join(
        ContentTag, Tag.id == ContentTag.tag_id
    ).group_by(
        Tag.id, Tag.name
    ).order_by(
        func.count(ContentTag.contents_id).desc()
    )
    
    results = query.all() 
    tags = [row[0] for row in results]
    return tags
# --- ▲ 엔드포인트 완료 ▲ ---


# 3. GET /{content_id} 상세 조회 엔드포인트 (DetailPage용, 변경 없음)
@router.get("/{content_id}", response_model=ContentDetailSchema)
def get_content_detail(
    content_id: int,
    reviews_page: int = Query(1, ge=1, description="리뷰 목록 페이지 번호"),
    reviews_per_page: int = Query(5, ge=1, le=50, description="페이지당 리뷰 개수"),
    related_page: int = Query(1, ge=1, description="관련 콘텐츠 목록 페이지 번호"),
    related_per_page: int = Query(4, ge=1, le=20, description="페이지당 관련 콘텐츠 개수"),
    db: Session = Depends(get_db)
):
    """
    특정 ID의 콘텐츠 상세 정보를 실제 DB에서 쿼리하여 반환합니다.
    **리뷰 목록 및 관련 콘텐츠 목록은 페이지네이션 처리됩니다.**
    """

    # 1. 기본 콘텐츠 상세 정보 조회
    content = db.query(Content).options(
        joinedload(Content.guide).joinedload(GuideProfile.user)
    ).filter(
        Content.id == content_id,
        Content.status == "Active"
    ).first()

    # 2. 콘텐츠가 없으면 404
    if not content:
        raise HTTPException(status_code=404, detail="해당 ID의 콘텐츠를 찾을 수 없습니다.")

    # 3. 가이드 정보 추출
    guide_name = "공식 가이드"
    guide_nickname = "정보 없음"
    guide_avg_rating = None
    if content.guide and content.guide.user:
        guide_name = content.guide.user.nickname
        guide_nickname = content.guide.user.nickname
        guide_avg_rating = content.guide.avg_rating

    # 4. 메인 이미지
    main_image_url = db.query(ContentImage.image_url).filter(
        ContentImage.contents_id == content_id,
        ContentImage.is_main == True
    ).scalar()

    # 5. 리뷰 쿼리 (페이지네이션 적용)
    # 5-1. 전체 리뷰 개수 및 평균 평점 계산
    content_rating_stats = db.query(
        func.avg(Review.rating).label("avg_rating"),
        func.count(Review.id).label("total_reviews_count")
    ).join(
        Booking, Review.booking_id == Booking.id
    ).filter(
        Booking.content_id == content_id
    ).first()

    total_reviews_count = content_rating_stats.total_reviews_count if content_rating_stats else 0
    avg_content_rating = round(float(content_rating_stats.avg_rating), 1) if content_rating_stats and content_rating_stats.avg_rating is not None else 0.0 # [수정] 4.0 -> 0.0

    # 5-2. 요청된 페이지의 리뷰 목록 쿼리
    review_results = db.query(Review).options(
        joinedload(Review.reviewer)
    ).join(
        Booking, Review.booking_id == Booking.id
    ).filter(
        Booking.content_id == content_id
    ).order_by(
        Review.created_at.desc()
    ).offset(
        (reviews_page - 1) * reviews_per_page
    ).limit(
        reviews_per_page
    ).all()

    # ReviewSchema 변환
    reviews_data = []
    for review in review_results:
        try:
            reviews_data.append(ReviewSchema(
                id=review.id,
                user=review.reviewer.nickname if review.reviewer else "알 수 없음", 
                rating=float(review.rating),
                text=review.text,
                created_at=review.created_at
            ))
        except Exception as e:
            print(f"Error converting review ID {review.id} to schema: {e}")

    # 6. 관련 콘텐츠 쿼리 (페이지네이션 적용)
    # 6-1. 전체 관련 콘텐츠 개수 계산
    total_related_count = db.query(func.count(Content.id)).filter(
        Content.id != content_id,
        Content.status == "Active"
    ).scalar() or 0

    # 6-2. 요청된 페이지의 관련 콘텐츠 목록 쿼리
    related_results = db.query(
        Content.id,
        Content.title,
        Content.price,
        ContentImage.image_url.label("imageUrl")
    ).outerjoin(
        ContentImage, (Content.id == ContentImage.contents_id) & (ContentImage.is_main == True)
    ).filter(
        Content.id != content_id,
        Content.status == "Active"
    ).order_by(
        Content.created_at.desc()
    ).offset(
        (related_page - 1) * related_per_page
    ).limit(
        related_per_page
    ).all()

    # RelatedContentSchema 변환
    related_contents_data = []
    for r in related_results:
        try:
            # [수정] 관련 콘텐츠도 임시 평점 대신, 실제 평점을 계산해야 하지만
            # N+1 문제가 심각하므로, 여기서는 0점으로 처리 (또는 임시 평점 유지)
            related_contents_data.append(RelatedContentSchema(
                id=r.id,
                title=r.title,
                price=f"{r.price:,}" if r.price is not None else "문의",
                rating=0.0, # [수정] 임시 평점 -> 0.0
                time="2시간 소요", # 임시 시간
                imageUrl=r.imageUrl
            ))
        except Exception as e:
            print(f"Error converting related content ID {r.id} to schema: {e}")

    # 7. 실제 태그 쿼리 (Tags가 없는 경우를 대비)
    tag_results = db.query(Tag).join(
        ContentTag, Tag.id == ContentTag.tag_id
    ).filter(
        ContentTag.contents_id == content_id
    ).all()
    
    tags_data = tag_results

    # 9. 최종 데이터 조합
    try:
        return ContentDetailSchema(
            id=content.id,
            title=content.title,
            description=content.description if content.description else "설명 없음",
            price=content.price if content.price is not None else 0,
            location=content.location if content.location else "미정",
            created_at=content.created_at,
            status=content.status,
            main_image_url=main_image_url,
            guide_name=guide_name,
            guide_nickname=guide_nickname,
            guide_avg_rating=guide_avg_rating,
            guide_id=content.guide_id,
            reviews=reviews_data,
            related_contents=related_contents_data,
            tags=tags_data,
            rating=avg_content_rating,
            review_count=total_reviews_count,
            total_related_count=total_related_count
        )
    except Exception as e:
        print(f"Error creating ContentDetailSchema for content ID {content_id}: {e}")
        raise HTTPException(status_code=500, detail="데이터 변환 중 오류가 발생했습니다.")