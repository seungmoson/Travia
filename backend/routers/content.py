# app/routers/content.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime # 👈 datetime 모듈 import
import random               # 👈 random 모듈 import

from database import get_db
from models import Content, GuideProfile, User, ContentImage, Booking, Review, Tag, ContentTag
from schemas import ContentListSchema, ContentDetailSchema, ReviewSchema, RelatedContentSchema

# 1. APIRouter 인스턴스 생성
router = APIRouter()

# 2. GET /list 엔드포인트 정의 (MainPage용)
# --- ▼ [임시 수정] response_model 부분을 주석 처리하여 검증 비활성화 ---
# @router.get("/list", response_model=List[ContentListSchema])
@router.get("/list") # 👈 response_model 제거
# --- 수정 끝 ---
def get_content_list(db: Session = Depends(get_db)):
    """
    상태가 'Active'인 모든 콘텐츠의 목록을 조회하고
    가이드 닉네임 및 메인 이미지 URL을 포함하여 반환합니다.
    """

    results = db.query(
        Content.id,
        Content.title,
        Content.description,
        Content.price,
        Content.location,
        User.nickname.label("guide_nickname"),
        ContentImage.image_url.label("main_image_url")
    ).join(
        GuideProfile, Content.guide_id == GuideProfile.users_id
    ).join(
        User, GuideProfile.users_id == User.id
    ).outerjoin(
        ContentImage, (Content.id == ContentImage.contents_id) & (ContentImage.is_main == True)
    ).filter(
        Content.status == "Active"
    ).all()

    content_list = []
    # 
    for row in results:
        # Pydantic 모델로 변환 (오류 발생 가능성 확인)
        try:
            schema_instance = ContentListSchema(
                id=row.id,
                title=row.title,
                description=row.description if row.description else "설명 없음", # None 방지
                price=row.price if row.price is not None else 0, # None 방지
                location=row.location if row.location else "미정", # None 방지
                guide_nickname=row.guide_nickname if row.guide_nickname else "정보 없음", # None 방지
                main_image_url=row.main_image_url # Optional이므로 None 가능
            )
            content_list.append(schema_instance)
        except Exception as e:
            # 개별 항목 변환 중 오류 발생 시 로깅 (디버깅용)
            print(f"Error converting content ID {row.id} to schema: {e}")
            # 오류 발생 시 해당 항목은 건너뛰거나 기본값으로 처리 가능
            # 여기서는 건너뛰도록 pass 사용 (또는 기본값 append)
            pass 

    return content_list


# 3. GET /{content_id} 상세 조회 엔드포인트 (DetailPage용)
@router.get("/{content_id}", response_model=ContentDetailSchema)
def get_content_detail(content_id: int, db: Session = Depends(get_db)):
    """
    특정 ID의 콘텐츠 상세 정보를 실제 DB에서 쿼리하여 반환합니다.
    """

    # 1. 기본 콘텐츠 상세 정보 조회
    content = db.query(Content).filter(
        Content.id == content_id,
        Content.status == "Active"
    ).first()

    # 2. 콘텐츠가 없으면 404
    if not content:
        raise HTTPException(status_code=404, detail="해당 ID의 콘텐츠를 찾을 수 없습니다.")

    # 3. 가이드 정보 (Lazy Loading 사용)
    guide_name = "공식 가이드"
    if content.guide and content.guide.user:
        guide_name = content.guide.user.nickname

    # 4. 메인 이미지 (models.py: contents_id)
    main_image_url = db.query(ContentImage.image_url).filter(
        ContentImage.contents_id == content_id,
        ContentImage.is_main == True
    ).scalar()

    # 5. 실제 리뷰 데이터 쿼리
    review_results = db.query(Review).join(
        Booking, Review.booking_id == Booking.id
    ).join(
        User, Review.reviewer_id == User.id
    ).filter(
        Booking.content_id == content_id
    ).order_by(
        Review.created_at.desc()
    ).limit(5).all()

    # ReviewSchema에 맞게 변환
    reviews_data = []
    for review in review_results:
        profile_age_str = "정보 없음"
        if review.reviewer and review.reviewer.created_at:
             delta_days = (datetime.now() - review.reviewer.created_at).days
             if delta_days < 30:
                 profile_age_str = f"가입 {delta_days}일차"
             else:
                 profile_age_str = f"가입 {delta_days // 30}개월차"

        reviews_data.append(ReviewSchema(
            id=review.id,
            user=review.reviewer.nickname if review.reviewer else "알 수 없음",
            profileAge=profile_age_str,
            rating=review.rating,
            text=review.text
        ))

    # 6. 실제 관련 콘텐츠 쿼리
    related_results = db.query(
        Content.id,
        Content.title,
        Content.price,
        ContentImage.image_url.label("imageUrl")
    ).outerjoin(
        ContentImage, (Content.id == ContentImage.contents_id) & (ContentImage.is_main == True)
    ).filter(
        Content.location == content.location,
        Content.id != content_id
    ).limit(4).all()

    # RelatedContentSchema에 맞게 변환
    related_contents_data = [
        RelatedContentSchema(
            id=r.id,
            title=r.title,
            price=f"{r.price:,}" if r.price is not None else "문의",
            rating=round(random.uniform(4.0, 5.0), 1),
            time="2시간 소요", # 임시
            imageUrl=r.imageUrl
        ) for r in related_results
    ]

    # 7. 실제 태그 쿼리
    tag_results = db.query(Tag).join(
        ContentTag, Tag.id == ContentTag.tag_id
    ).filter(
        ContentTag.contents_id == content_id # models.py 확인 필요
    ).all()
    
    tags_data = [tag.name for tag in tag_results]

    # 8. 리뷰 평점 및 개수 쿼리
    rating_stats = db.query(
        func.avg(Review.rating).label("avg_rating"),
        func.count(Review.id).label("review_count")
    ).join(
        Booking, Review.booking_id == Booking.id
    ).filter(
        Booking.content_id == content_id
    ).first()

    # 9. 최종 데이터 조합
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
        guide_nickname=guide_name, # ContentListSchema가 상속받았으므로 필요

        reviews=reviews_data,
        related_contents=related_contents_data,

        # 추가된 필드들
        tags=tags_data,
        rating=round(rating_stats.avg_rating, 1) if rating_stats and rating_stats.avg_rating else 4.0,
        review_count=rating_stats.review_count if rating_stats and rating_stats.review_count else 0
    )