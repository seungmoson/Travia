from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import List

from database import get_db
from models import Booking, Content, User, ContentImage
# [수정] GuideBookingSchema, UserInfoSchema 임포트 추가
from schemas import (
    BookingCreateRequest, 
    BookingCreateResponse, 
    MyBookingSchema,
    GuideBookingSchema,  # 가이드용 스키마
    UserInfoSchema     # 고객 정보 스키마
)
from routers.auth import get_current_user 

# 1. APIRouter 인스턴스 생성
router = APIRouter(
    # (prefix는 main.py에서 app.include_router를 통해 관리합니다)
    tags=["Bookings"]    # Swagger UI 그룹 태그
)

# --- ▼ [신규] 헬퍼 함수: Booking -> GuideBookingSchema 변환 ▼ ---
def _build_guide_booking_schema(booking: Booking) -> GuideBookingSchema:
    """Booking 객체를 GuideBookingSchema Pydantic 모델로 변환합니다."""
    
    main_image_url = None
    if booking.content and booking.content.images:
        for img in booking.content.images:
            if img.is_main:
                main_image_url = img.image_url
                break
        if not main_image_url and len(booking.content.images) > 0:
            main_image_url = booking.content.images[0].image_url
    
    # "Completed" 상태 동적 처리
    display_status = booking.status
    if booking.status == "Confirmed" and booking.booking_date < datetime.now():
        display_status = "Completed"
    
    # 고객 정보가 로드되었는지 확인
    if not booking.traveler:
        traveler_info = UserInfoSchema(username="Unknown", email="unknown@example.com")
    else:
        traveler_info = UserInfoSchema.model_validate(booking.traveler)

    return GuideBookingSchema(
        booking_id=booking.id,
        content_id=booking.content_id,
        content_title=booking.content.title if booking.content else "삭제된 콘텐츠",
        content_main_image_url=main_image_url,
        booking_date=booking.booking_date,
        personnel=booking.personnel,
        status=display_status,
        traveler=traveler_info
    )
# --- ▲ 헬퍼 함수 종료 ▲ ---


# 2. POST / (예약 생성)
@router.post("/", response_model=BookingCreateResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    request: BookingCreateRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ... (기존 코드와 동일) ...
    content = db.query(Content).filter(Content.id == request.content_id, Content.status == "Active").first()
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"ID {request.content_id}에 해당하는 활성 콘텐츠를 찾을 수 없습니다.")
    new_booking = Booking(
        traveler_id=current_user.id,
        content_id=request.content_id,
        booking_date=request.booking_date,
        personnel=request.personnel, 
        status="Pending",
        created_at=datetime.now()
    )
    try:
        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)
    except Exception as e:
        db.rollback()
        print(f"Booking creation failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="예약 생성 중 서버 오류가 발생했습니다.")
    return BookingCreateResponse(
        booking_id=new_booking.id,
        content_title=content.title,
        booking_date=new_booking.booking_date,
        personnel=new_booking.personnel,
        status=new_booking.status,
        message="예약 요청이 성공적으로 접수되었습니다."
    )


# 3. GET /me (내 예약 목록 조회)
@router.get("/me", response_model=List[MyBookingSchema])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ... (기존 코드와 동일) ...
    bookings = db.query(Booking).options(joinedload(Booking.content).joinedload(Content.images)).filter(Booking.traveler_id == current_user.id, Booking.status != "Canceled").order_by(Booking.booking_date.desc()).all()
    response_data: List[MyBookingSchema] = []
    if not bookings:
        return response_data
    for booking in bookings:
        main_image_url = None
        if booking.content and booking.content.images:
            for img in booking.content.images:
                if img.is_main:
                    main_image_url = img.image_url
                    break
            if not main_image_url and len(booking.content.images) > 0:
                main_image_url = booking.content.images[0].image_url
        display_status = booking.status
        if booking.status == "Confirmed" and booking.booking_date < datetime.now():
            display_status = "Completed"
        response_data.append(
            MyBookingSchema(
                booking_id=booking.id,
                content_id=booking.content_id,
                content_title=booking.content.title if booking.content else "삭제된 콘텐츠",
                content_main_image_url=main_image_url,
                booking_date=booking.booking_date,
                personnel=booking.personnel,
                status=display_status
            )
        )
    return response_data


# 4. GET /guide/received (가이드가 접수된 예약 목록 조회)
@router.get("/guide/received") 
def get_guide_received_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    현재 로그인한 가이드가 '자신이 등록한 콘텐츠'에 대해
    접수된 모든 예약 목록을 조회합니다. (가이드 대시보드용)
    """
    bookings = db.query(Booking).\
        join(Content, Booking.content_id == Content.id).\
        filter(Content.guide_id == current_user.id).\
        options(
            joinedload(Booking.traveler), 
            joinedload(Booking.content).joinedload(Content.images) 
        ).\
        order_by(Booking.status.asc(), Booking.booking_date.asc()).\
        all()

    response_data: List[GuideBookingSchema] = []
    if not bookings:
        return {"bookings": response_data}

    for booking in bookings:
        # [수정] 헬퍼 함수를 사용하여 스키마 변환
        response_data.append(_build_guide_booking_schema(booking))
        
    return {"bookings": response_data}


# --- ▼ 5. [신규] 가이드 예약 승인 (Approve) ▼ ---
@router.patch("/approve/{booking_id}", response_model=GuideBookingSchema)
def approve_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    가이드가 'Pending' 상태의 예약을 'Confirmed'로 승인합니다.
    """
    # 1. 예약 조회 (보안: 이 가이드의 콘텐츠가 맞는지 확인)
    #    프론트엔드 반환을 위해 필요한 모든 정보를 joinedload 합니다.
    booking = db.query(Booking).\
        join(Content, Booking.content_id == Content.id).\
        filter(
            Booking.id == booking_id,
            Content.guide_id == current_user.id
        ).\
        options(
            joinedload(Booking.traveler), 
            joinedload(Booking.content).joinedload(Content.images) 
        ).\
        first()

    # 2. 예약이 없거나, 내 예약이 아닌 경우
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없거나 승인할 권한이 없습니다."
        )

    # 3. 'Pending' 상태가 아닌 경우
    if booking.status != "Pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"이미 처리된(상태: {booking.status}) 예약입니다."
        )

    # 4. 상태 변경 및 저장
    booking.status = "Confirmed"
    try:
        db.commit()
        db.refresh(booking)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"예약 승인 중 오류 발생: {e}"
        )

    # 5. 갱신된 예약 정보를 스키마에 맞춰 반환 (헬퍼 함수 사용)
    return _build_guide_booking_schema(booking)


# --- ▼ 6. [신규] 가이드 예약 거절 (Reject) ▼ ---
@router.patch("/reject/{booking_id}", response_model=GuideBookingSchema)
def reject_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    가이드가 'Pending' 상태의 예약을 'Rejected'로 거절합니다.
    """
    # 1. 예약 조회 (보안: 이 가이드의 콘텐츠가 맞는지 확인)
    booking = db.query(Booking).\
        join(Content, Booking.content_id == Content.id).\
        filter(
            Booking.id == booking_id,
            Content.guide_id == current_user.id
        ).\
        options(
            joinedload(Booking.traveler), 
            joinedload(Booking.content).joinedload(Content.images) 
        ).\
        first()

    # 2. 예약이 없거나, 내 예약이 아닌 경우
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없거나 거절할 권한이 없습니다."
        )

    # 3. 'Pending' 상태가 아닌 경우
    if booking.status != "Pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"이미 처리된(상태: {booking.status}) 예약입니다."
        )

    # 4. 상태 변경 및 저장
    booking.status = "Rejected"
    try:
        db.commit()
        db.refresh(booking)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"예약 거절 중 오류 발생: {e}"
        )

    # 5. 갱신된 예약 정보를 스키마에 맞춰 반환 (헬퍼 함수 사용)
    return _build_guide_booking_schema(booking)
# --- ▲ 신규 API 추가 완료 ▲ ---


# 7. DELETE /{booking_id} (예약 취소 - 여행자용)
@router.delete("/{booking_id}", response_model=MyBookingSchema)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ... (기존 코드와 동일) ...
    booking = db.query(Booking).options(joinedload(Booking.content).joinedload(Content.images)).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_44_NOT_FOUND, detail="예약을 찾을 수 없습니다.")
    if booking.traveler_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 예약을 취소할 권한이 없습니다.")
    if booking.status == "Canceled":
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="이미 취소된 예약입니다.")
    booking.status = "Canceled"
    try:
        db.commit() 
        db.refresh(booking) 
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="예약 취소 중 서버 오류가 발생했습니다.")
    main_image_url = None
    if booking.content and booking.content.images:
        for img in booking.content.images:
            if img.is_main:
                main_image_url = img.image_url
                break
        if not main_image_url and len(booking.content.images) > 0:
            main_image_url = booking.content.images[0].image_url
    return MyBookingSchema(
        booking_id=booking.id,
        content_id=booking.content_id,
        content_title=booking.content.title if booking.content else "삭제된 콘텐츠",
        content_main_image_url=main_image_url,
        booking_date=booking.booking_date,
        personnel=booking.personnel,
        status=booking.status
    )