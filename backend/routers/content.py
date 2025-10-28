# app/routers/content.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime 
import random 

from database import get_db
from models import Content, GuideProfile, User, ContentImage, Booking, Review, Tag, ContentTag
# [수정] schemas import 수정 (이전 답변에서 schemas.py를 수정했으므로)
from schemas import ContentListSchema, ContentDetailSchema, ReviewSchema, RelatedContentSchema

# 1. APIRouter 인스턴스 생성
router = APIRouter()

# 2. GET /list 엔드포인트 정의 (MainPage용)
# [참고] response_model 검증을 다시 활성화하는 것이 좋습니다.
# @router.get("/list", response_model=List[ContentListSchema])
@router.get("/list") # 👈 일단은 response_model 제거된 상태 유지
def get_content_list(db: Session = Depends(get_db)):
    """
    상태가 'Active'인 모든 콘텐츠의 목록을 조회하고
    가이드 닉네임 및 메인 이미지 URL을 포함하여 반환합니다.
    """
    # [수정] ContentListSchema에 guide_id가 추가되었으므로 쿼리에도 추가
    results = db.query(
        Content.id,
        Content.title,
        Content.description,
        Content.price,
        Content.location,
        User.nickname.label("guide_nickname"),
        ContentImage.image_url.label("main_image_url"),
        Content.guide_id # 👈 [추가] guide_id 쿼리
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
                guide_id=row.guide_id # 👈 [추가] guide_id 매핑
            )
            content_list.append(schema_instance)
        except Exception as e:
            print(f"Error converting content ID {row.id} to schema: {e}")
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
    guide_name = "공식 가이드" # 기본값
    guide_nickname = "정보 없음" # 기본값 (ContentListSchema에서 상속받은 필드용)
    if content.guide and content.guide.user:
        guide_name = content.guide.user.nickname # DetailSchema용
        guide_nickname = content.guide.user.nickname # ListSchema용

    # 4. 메인 이미지 
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
            rating=round(random.uniform(4.0, 5.0), 1), # 임시 평점
            time="2시간 소요", # 임시 시간
            imageUrl=r.imageUrl
        ) for r in related_results
    ]

    # 7. 실제 태그 쿼리
    tag_results = db.query(Tag).join(
        ContentTag, Tag.id == ContentTag.tag_id
    ).filter(
        ContentTag.contents_id == content_id
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
        guide_name=guide_name, # DetailSchema 필드
        guide_nickname=guide_nickname, # ListSchema 상속 필드
        
        # ▼▼▼ [수정] guide_id 필드 추가 ▼▼▼
        guide_id=content.guide_id, 
        # ▲▲▲ [수정 완료] ▲▲▲

        reviews=reviews_data,
        related_contents=related_contents_data,

        # 추가된 필드들
        tags=tags_data,
        rating=round(rating_stats.avg_rating, 1) if rating_stats and rating_stats.avg_rating else 4.0, # 기본값 4.0
        review_count=rating_stats.review_count if rating_stats and rating_stats.review_count else 0 # 기본값 0
    )