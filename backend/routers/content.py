# app/routers/content.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from datetime import datetime
import random

from database import get_db
from models import Content, GuideProfile, User, ContentImage, Booking, Review, Tag, ContentTag
# --- ▼ [수정] ContentListResponse 스키마 임포트 ▼ ---
from schemas import (
    ContentListSchema, ContentDetailSchema, ReviewSchema, RelatedContentSchema,
    ContentListResponse
)
# --- ▲ [수정 완료] ▲ ---

# 1. APIRouter 인스턴스 생성
router = APIRouter()

# 2. GET /list 엔드포인트 정의 (MainPage용)
# --- ▼ [수정] 페이지네이션 적용 및 반환 스키마 변경 ▼ ---
@router.get("/list", response_model=ContentListResponse)
def get_content_list(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="페이지 번호"),
    per_page: int = Query(9, ge=1, le=50, description="페이지당 콘텐츠 개수 (기본 9개)")
):
    """
    상태가 'Active'인 모든 콘텐츠의 목록을 **페이지네이션**하여 조회하고
    가이드 닉네임, 메인 이미지 URL, **전체 개수**를 포함하여 반환합니다.
    """
    
    # 1. 전체 개수 쿼리 (페이지네이션 전에)
    total_count_query = db.query(func.count(Content.id)).filter(Content.status == "Active")
    total_count = total_count_query.scalar() or 0

    # 2. 실제 목록 쿼리 (페이지네이션 적용)
    results = db.query(
        Content.id,
        Content.title,
        Content.description,
        Content.price,
        Content.location,
        User.nickname.label("guide_nickname"),
        ContentImage.image_url.label("main_image_url"),
        Content.guide_id
    ).join(
        GuideProfile, Content.guide_id == GuideProfile.users_id
    ).join(
        User, GuideProfile.users_id == User.id
    ).outerjoin(
        ContentImage, (Content.id == ContentImage.contents_id) & (ContentImage.is_main == True)
    ).filter(
        Content.status == "Active"
    ).order_by( # [추가] 정렬 기준 (예: 최신순)
        Content.created_at.desc()
    ).offset( # 페이지네이션
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

    # 4. 최종 응답 반환 (ContentListResponse 객체 사용)
    return ContentListResponse(
        contents=content_list,
        total_count=total_count
    )
# --- ▲ [수정 완료] ▲ ---


# 3. GET /{content_id} 상세 조회 엔드포인트 (DetailPage용)
@router.get("/{content_id}", response_model=ContentDetailSchema)
def get_content_detail(
    content_id: int,
    # 리뷰 페이지네이션 쿼리 파라미터
    reviews_page: int = Query(1, ge=1, description="리뷰 목록 페이지 번호"),
    reviews_per_page: int = Query(5, ge=1, le=50, description="페이지당 리뷰 개수"),
    # 관련 콘텐츠 페이지네이션 쿼리 파라미터
    related_page: int = Query(1, ge=1, description="관련 콘텐츠 목록 페이지 번호"),
    related_per_page: int = Query(4, ge=1, le=20, description="페이지당 관련 콘텐츠 개수"),
    db: Session = Depends(get_db)
):
    """
    특정 ID의 콘텐츠 상세 정보를 실제 DB에서 쿼리하여 반환합니다.
    **리뷰 목록 및 관련 콘텐츠 목록은 페이지네이션 처리됩니다.**
    """

    # 1. 기본 콘텐츠 상세 정보 조회 (가이드 정보 즉시 로드)
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
    avg_content_rating = round(float(content_rating_stats.avg_rating), 1) if content_rating_stats and content_rating_stats.avg_rating is not None else 4.0

    # 5-2. 요청된 페이지의 리뷰 목록 쿼리
    review_results = db.query(Review).options(
        joinedload(Review.reviewer) # Review.reviewer (User) 관계 로드
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
            # model_validate 대신 수동으로 생성 (alias 'user' 사용)
            reviews_data.append(ReviewSchema(
                id=review.id,
                # schemas.py의 `ReviewSchema`는 'user'라는 alias를 사용
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
        Content.location == content.location, 
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
        Content.location == content.location,
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
            related_contents_data.append(RelatedContentSchema(
                id=r.id,
                title=r.title,
                price=f"{r.price:,}" if r.price is not None else "문의",
                rating=round(random.uniform(4.0, 5.0), 1), # 임시 평점
                time="2시간 소요", # 임시 시간
                imageUrl=r.imageUrl
            ))
         except Exception as e:
            print(f"Error converting related content ID {r.id} to schema: {e}")

    # 7. 실제 태그 쿼리
    tag_results = db.query(Tag).join(
        ContentTag, Tag.id == ContentTag.tag_id
    ).filter(
        ContentTag.contents_id == content_id
    ).all()
    tags_data = [tag.name for tag in tag_results]

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
            reviews=reviews_data,               # 현재 페이지 리뷰
            related_contents=related_contents_data, # 현재 페이지 관련 콘텐츠
            tags=tags_data,
            rating=avg_content_rating,          # 전체 평균 평점
            review_count=total_reviews_count,   # 전체 리뷰 개수
            total_related_count=total_related_count # 전체 관련 콘텐츠 개수
        )
    except Exception as e:
        print(f"Error creating ContentDetailSchema for content ID {content_id}: {e}")
        raise HTTPException(status_code=500, detail="데이터 변환 중 오류가 발생했습니다.")

