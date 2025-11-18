from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
# --- ▼  평균 계산을 위한 func 임포트 ▼ ---
from sqlalchemy import func
from typing import List
#  auth.py와 동일한 절대 경로 방식으로 변경
from database import get_db 
import models      
import schemas     
#  auth.py는 review.py와 같은 routers 폴더에 있으므로 상대 경로(.)로 import
from .auth import get_current_user 

# 라우터 설정
router = APIRouter(
    prefix="/reviews",  # 이 파일의 모든 API는 /reviews로 시작
    tags=["Reviews"],   # FastAPI Docs 태그
)

# 1. 상품(Content) 리뷰 작성 API
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
        # 'content_id' 제거 (models.Review에 없음)
        reviewer_id=current_user.id, 
        booking_id=review_data.booking_id,
        rating=int(review_data.rating), 
        text=review_data.comment # 스키마(comment) -> 모델(text) 매핑
    )

    # 7. DB에 저장
    try:
        db.add(new_review)
        db.commit()
        db.refresh(new_review)
        
        # --- ▼  상품(Content) 평점 업데이트 로직 ▼ ---
        # (Content 평점은 ContentDetail에서 계산하므로 여기서는 생략, 필요시 추가)
        
        
        return new_review
    except Exception as e:
        db.rollback()
        #  에러 로그 추가
        print(f"Error creating content review: {e}") 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the review: {e}"
        )

# 2. 가이드(Guide) 리뷰 작성 API
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
    **리뷰 저장 후 가이드 프로필의 평균 평점(avg_rating)을 업데이트합니다.**
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
        text=review_data.comment # 스키마(comment) -> 모델(text) 매핑
    )

    # 8. DB에 저장
    try:
        db.add(new_guide_review)
        db.commit()
        db.refresh(new_guide_review)
        
        # --- ▼  가이드 평균 평점 업데이트 로직 ▼ ---
        # 8-1. 해당 가이드의 모든 리뷰 평점 평균 계산
        #      func.avg는 결과가 Decimal일 수 있으므로 float으로 변환
        avg_rating_result = db.query(
            func.avg(models.GuideReview.rating).label("avg_rating")
        ).filter(
            models.GuideReview.guide_id == target_guide_id
        ).scalar() # 단일 값(평균)만 가져옴
        
        new_avg_rating = float(avg_rating_result) if avg_rating_result is not None else 0.0

        # 8-2. 해당 가이드 프로필 조회
        guide_profile = db.query(models.GuideProfile).filter(
            models.GuideProfile.users_id == target_guide_id
        ).first()

        # 8-3. 가이드 프로필이 존재하면 평균 평점 업데이트 및 저장
        if guide_profile:
            guide_profile.avg_rating = new_avg_rating
            db.commit() # 가이드 프로필 변경사항 저장
        else:
            # 혹시 모를 에러 상황 로깅 (리뷰는 있는데 프로필이 없는 경우)
            print(f"Warning: GuideProfile not found for guide_id {target_guide_id} while updating avg_rating.")
        return new_guide_review # 생성된 리뷰 객체 반환
        
    except Exception as e:
        db.rollback()
        #  에러 로그 추가
        print(f"Error creating guide review or updating guide avg_rating: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the review: {e}"
        )