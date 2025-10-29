from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

# --- ▼▼▼ [수정된 부분] ▼▼▼ ---
# from ..database import get_db 
# from .. import models      
# from .. import schemas     
# from ..auth.utils import get_current_user 

# [수정] auth.py와 동일한 절대 경로 방식으로 변경
from database import get_db 
import models      
import schemas     
# [수정] auth.py는 review.py와 같은 routers 폴더에 있으므로 상대 경로(.)로 import
from .auth import get_current_user 
# --- ▲▲▲ [수정 완료] ▲▲▲ ---


# 라우터 설정
router = APIRouter(
    prefix="/reviews",  # 이 파일의 모든 API는 /reviews로 시작
    tags=["Reviews"],   # FastAPI Docs 태그
)

# ================================================================
# 1. 상품(Content) 리뷰 작성 API
# ================================================================
@router.post(
    "/content", 
    response_model=schemas.ContentReviewResponse,
    summary="상품(Content) 리뷰 작성",
    status_code=status.HTTP_201_CREATED
)
def create_content_review(
    review_data: schemas.ContentReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    여행자가 'Completed' 상태의 예약에 대해 **상품(Content)** 리뷰를 작성합니다.
    """
    
    # 1. 예약(Booking) 정보 조회
    booking = db.query(models.Booking).filter(
        models.Booking.id == review_data.booking_id
    ).first()

    # 2. [검증 1] 예약 존재 여부
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found."
        )

    # 3. [검증 2] 예약자 본인 확인 (소유권)
    if booking.traveler_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to review this booking."
        )

    # 4. [검증 3] 예약 상태 확인 (Completed)
    if booking.status != "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot review. Booking status is '{booking.status}', not 'Completed'."
        )

    # 5. [검증 4] 이미 해당 예약에 대한 상품 리뷰가 있는지 확인 (중복 방지)
    existing_review = db.query(models.Review).filter(
        models.Review.booking_id == review_data.booking_id
    ).first()

    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content review already submitted for this booking."
        )

    # 6. 검증 통과 -> 리뷰 생성
    new_review = models.Review(
        # --- ▼ [수정] 'content_id'는 Review 모델에 없는 필드이므로 제거 ▼ ---
        # content_id=booking.content_id, 
        # --- ▲ [수정 완료] ▲ ---
        reviewer_id=current_user.id, 
        booking_id=review_data.booking_id,
        rating=int(review_data.rating), 
        
        # --- ▼ [수정] 'comment' -> 'text' (models.py 정의 기준) ▼ ---
        text=review_data.comment 
        # --- ▲ [수정 완료] ▲ ---
    )

    # 7. DB에 저장
    try:
        db.add(new_review)
        db.commit()
        db.refresh(new_review)
        return new_review
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the review: {e}"
        )


# ================================================================
# 2. 가이드(Guide) 리뷰 작성 API
# ================================================================
@router.post(
    "/guide", 
    response_model=schemas.GuideReviewResponse,
    summary="가이드(Guide) 리뷰 작성",
    status_code=status.HTTP_201_CREATED
)
def create_guide_review(
    review_data: schemas.GuideReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    여행자가 'Completed' 상태의 예약에 대해 **가이드(Guide)** 리뷰를 작성합니다.
    """
    
    # 1. 예약(Booking) 정보 조회 (이때 content > guide_id가 필요하므로 joinedload 사용)
    booking = db.query(models.Booking).options(
        joinedload(models.Booking.content)  # Booking.content 관계를 즉시 로드
    ).filter(
        models.Booking.id == review_data.booking_id
    ).first()

    # 2. [검증 1] 예약 존재 여부
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found."
        )

    # 3. [검증 2] 예약자 본인 확인 (소유권)
    if booking.traveler_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to review this booking."
        )

    # 4. [검증 3] 예약 상태 확인 (Completed)
    if booking.status != "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot review. Booking status is '{booking.status}', not 'Completed'."
        )

    # 5. [검증 4] 이미 해당 예약에 대한 가이드 리뷰가 있는지 확인 (중복 방지)
    existing_review = db.query(models.GuideReview).filter(
        models.GuideReview.booking_id == review_data.booking_id
    ).first()

    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Guide review already submitted for this booking."
        )

    # 6. [검증 5] 가이드 정보 (guide_id) 추출
    if not booking.content or not booking.content.guide_id:
        # booking.content 관계가 없거나, content에 guide_id가 없는 비정상 상황
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guide information not found for this booking's content."
        )
    
    target_guide_id = booking.content.guide_id

    # 7. 검증 통과 -> 리뷰 생성
    new_guide_review = models.GuideReview(
        guide_id=target_guide_id,
        reviewer_id=current_user.id,
        booking_id=review_data.booking_id,
        rating=int(review_data.rating),

        # --- ▼ [수정] 'comment' -> 'text' (models.py 정의 기준) ▼ ---
        text=review_data.comment
        # --- ▲ [수정 완료] ▲ ---
    )

    # 8. DB에 저장
    try:
        db.add(new_guide_review)
        db.commit()
        db.refresh(new_guide_review)
        return new_guide_review
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the review: {e}"
        )


