from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

# ==================================================
# 1. Content 관련 스키마
# ==================================================

# Content 목록 조회 시 응답 스키마 (MainPage용)
class ContentListSchema(BaseModel):
    id: int = Field(..., description="콘텐츠 고유 ID")
    title: str = Field(..., description="콘텐츠 제목")
    description: str = Field(..., description="콘텐츠 짧은 설명")
    price: int = Field(..., description="콘텐츠 가격 (원)")
    location: str = Field(..., description="지역 코드 (예: SEO)")

    # 조인해서 가져오는 필드
    guide_nickname: str = Field(..., description="가이드 닉네임")
    main_image_url: Optional[str] = Field(None, description="메인 이미지 URL")
    
    # ▼▼▼ [수정] BookingBox 비교를 위해 guide_id 추가 ▼▼▼
    guide_id: int = Field(..., description="콘텐츠 작성자(가이드)의 User ID")
    # ▲▲▲ [수정 완료] ▲▲▲

    class Config:
        from_attributes = True

# DetailPage의 'ReviewList' 컴포넌트용 스키마
class ReviewSchema(BaseModel):
    id: int
    user: str = Field(..., description="리뷰 작성자 닉네임")
    profileAge: str = Field(..., description="리뷰 작성자 프로필 (예: 가입 1년)")
    rating: int = Field(..., description="별점 (1~5)")
    text: str = Field(..., description="리뷰 본문")

    class Config:
        from_attributes = True

# DetailPage의 'RelatedContentList' 컴포넌트용 스키마
class RelatedContentSchema(BaseModel):
    id: int
    title: str
    time: Optional[str] = Field(None, description="소요 시간 (예: 3시간 소요)")
    price: Optional[str] = Field(None, description="가격 (문자열, 예: 60,000)")
    rating: Optional[float] = Field(None, description="평점 (예: 4.2)")
    imageUrl: Optional[str] = Field(None, description="관련 콘텐츠 이미지 URL")

    class Config:
        from_attributes = True

# Content 상세 정보 조회 시 응답 스키마 (DetailPage용)
# [참고] ContentListSchema를 상속받았으므로,
# ContentDetailSchema도 이제 'guide_id' 필드를 갖게 됩니다.
class ContentDetailSchema(ContentListSchema):
    guide_name: Optional[str] = Field(None, description="가이드 이름 (DetailPage용)")
    created_at: Optional[datetime] = None
    status: Optional[str] = None
    # 
    rating: Optional[float] = Field(None, description="콘텐츠 평균 평점")
    review_count: Optional[int] = Field(None, description="콘텐츠 리뷰 총 개수")
    tags: List[str] = Field(default_factory=list, description="콘텐츠 태그 목록")

    reviews: List[ReviewSchema] = Field(default_factory=list, description="콘텐츠 리뷰 목록")
    related_contents: List[RelatedContentSchema] = Field(default_factory=list, description="관련 콘텐츠 목록")

    class Config:
        from_attributes = True


# ==================================================
# 2. Auth 관련 스키마
# ==================================================

# POST /auth/login 요청 시 사용
class LoginRequest(BaseModel):
    email: str = Field(..., description="사용자 이메일")
    password: str = Field(..., description="사용자 비밀번호")

# --- ▼ [수정] 로그인 응답 스키마 (JWT 토큰 반환) ▼ ---
class LoginResponse(BaseModel):
    access_token: str = Field(..., description="JWT 액세스 토큰")
    token_type: str = Field("bearer", description="토큰 타입 (고정값 'bearer')")
# --- ▲ 수정 완료 ▲ ---


# ==================================================
# 3. Booking 관련 스키마
# ==================================================

# POST /bookings 요청 시 프론트엔드가 보내는 데이터 구조
class BookingCreateRequest(BaseModel):
    content_id: int = Field(..., description="예약할 콘텐츠 ID")
    booking_date: datetime = Field(..., description="예약 날짜 및 시간")
    personnel: int = Field(..., gt=0, description="예약 인원 (1 이상)")

# POST /bookings 성공 시 백엔드가 응답하는 데이터 구조
class BookingCreateResponse(BaseModel):
    booking_id: int = Field(..., description="생성된 예약 ID")
    content_title: str = Field(..., description="예약된 콘텐츠 제목")
    booking_date: datetime = Field(..., description="확정된 예약 날짜")
    personnel: int = Field(..., description="확정된 예약 인원")
    status: str = Field(..., description="예약 상태 (예: Pending)")
    message: str = Field("예약 요청이 성공적으로 접수되었습니다.", description="결과 메시지")

    class Config:
        from_attributes = True


# --- ▼ [신규 추가] MyPage "내 예약 목록" 조회용 스키마 ▼ ---
class MyBookingSchema(BaseModel):
    booking_id: int = Field(..., description="예약 고유 ID")
    content_id: int = Field(..., description="콘텐츠 ID (상세보기 링크용)")
    content_title: str = Field(..., description="콘텐츠 제목")
    content_main_image_url: Optional[str] = Field(None, description="콘텐츠 메인 이미지 URL")
    booking_date: datetime = Field(..., description="예약 날짜 및 시간")
    personnel: int = Field(..., description="예약 인원")
    status: str = Field(..., description="예약 상태 (예: Pending, Confirmed)")
    
    class Config:
        from_attributes = True
# --- ▲ 신규 추가 완료 ▲ ---


# --- ▼ [수정] 가이드가 예약 내역을 볼 때 필요한 '고객 정보' 스키마 ▼ ---
class UserInfoSchema(BaseModel):
    nickname: str = Field(..., description="고객 닉네임") # [수정] 'username' -> 'nickname'
    email: EmailStr = Field(..., description="고객 이메일 (연락용)")
    # 필요시 phone: Optional[str] = None 등 추가

    class Config:
        from_attributes = True

# --- ▼ [신규 추가] 가이드 대시보드 "접수된 예약" 조회용 스키마 ▼ ---
class GuideBookingSchema(BaseModel):
    booking_id: int = Field(..., description="예약 고유 ID")
    content_id: int = Field(..., description="콘텐츠 ID")
    content_title: str = Field(..., description="콘텐츠 제목")
    content_main_image_url: Optional[str] = Field(None, description="콘텐츠 메인 이미지 URL")
    booking_date: datetime = Field(..., description="예약 날짜 및 시간")
    personnel: int = Field(..., description="예약 인원")
    status: str = Field(..., description="예약 상태 (예: Pending, Confirmed, Completed)")
    
    # [핵심] 이 예약을 신청한 고객(traveler) 정보
    traveler: UserInfoSchema = Field(..., description="예약 고객 정보")
    
    class Config:
        from_attributes = True
# --- ▲ 신규 추가 완료 ▲ ---