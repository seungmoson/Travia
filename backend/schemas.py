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
    guide_nickname: str = Field(..., description="가이드 닉네임")
    main_image_url: Optional[str] = Field(None, description="메인 이미지 URL")
    guide_id: int = Field(..., description="콘텐츠 작성자(가이드)의 User ID")

    class Config:
        from_attributes = True

# --- ▼ [신규 추가] ContentList 무한 스크롤용 응답 스키마 ▼ ---
class ContentListResponse(BaseModel):
    """
    콘텐츠 목록 API (/content/list)의 페이지네이션 응답 스키마
    """
    contents: List[ContentListSchema] = Field(..., description="현재 페이지의 콘텐츠 목록")
    total_count: int = Field(..., description="조건에 맞는 전체 콘텐츠 개수")
# --- ▲ [신규 추가 완료] ▲ ---


# DetailPage의 'ReviewList' 컴포넌트용 스키마
class ReviewSchema(BaseModel):
    id: int
    reviewer_nickname: str = Field(..., alias="user", description="리뷰 작성자 닉네임") 
    rating: float 
    text: str = Field(..., description="리뷰 본문")
    created_at: datetime 

    class Config:
        from_attributes = True
        # --- ▼ [수정] Pydantic V2 스타일에 맞는 alias 설정 ▼ ---
        populate_by_name = True # allow_population_by_field_name -> V2 키로 변경
        # --- ▲ [수정 완료] ▲ ---

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
class ContentDetailSchema(ContentListSchema):
    guide_name: Optional[str] = Field(None, description="가이드 이름 (DetailPage용)")
    guide_avg_rating: Optional[float] = Field(None, description="가이드 평균 평점")
    created_at: Optional[datetime] = None
    status: Optional[str] = None
    rating: Optional[float] = Field(None, description="콘텐츠 평균 평점")
    review_count: Optional[int] = Field(None, description="콘텐츠의 '전체' 리뷰 총 개수")
    tags: List[str] = Field(default_factory=list, description="콘텐츠 태그 목록")
    reviews: List[ReviewSchema] = Field(default_factory=list, description="현재 페이지의 콘텐츠 리뷰 목록")
    related_contents: List[RelatedContentSchema] = Field(default_factory=list, description="현재 페이지의 관련 콘텐츠 목록")
    total_related_count: Optional[int] = Field(None, description="전체 관련 콘텐츠 개수")

    class Config:
        from_attributes = True


# ==================================================
# 2. Auth 관련 스키마
# ==================================================
class LoginRequest(BaseModel):
    email: str = Field(..., description="사용자 이메일")
    password: str = Field(..., description="사용자 비밀번호")

class LoginResponse(BaseModel):
    access_token: str = Field(..., description="JWT 액세스 토큰")
    token_type: str = Field("bearer", description="토큰 타입 (고정값 'bearer')")


# ==================================================
# 3. Booking 관련 스키마
# ==================================================
class BookingCreateRequest(BaseModel):
    content_id: int = Field(..., description="예약할 콘텐츠 ID")
    booking_date: datetime = Field(..., description="예약 날짜 및 시간")
    personnel: int = Field(..., gt=0, description="예약 인원 (1 이상)")

class BookingCreateResponse(BaseModel):
    booking_id: int = Field(..., description="생성된 예약 ID")
    content_title: str = Field(..., description="예약된 콘텐츠 제목")
    booking_date: datetime = Field(..., description="확정된 예약 날짜")
    personnel: int = Field(..., description="확정된 예약 인원")
    status: str = Field(..., description="예약 상태 (예: Pending)")
    message: str = Field("예약 요청이 성공적으로 접수되었습니다.", description="결과 메시지")
    class Config: from_attributes = True

class MyBookingSchema(BaseModel):
    booking_id: int = Field(..., description="예약 고유 ID")
    content_id: int = Field(..., description="콘텐츠 ID (상세보기 링크용)")
    content_title: str = Field(..., description="콘텐츠 제목")
    content_main_image_url: Optional[str] = Field(None, description="콘텐츠 메인 이미지 URL")
    booking_date: datetime = Field(..., description="예약 날짜 및 시간")
    personnel: int = Field(..., description="예약 인원")
    status: str = Field(..., description="예약 상태 (예: Pending, Confirmed)")
    is_reviewed: bool = Field(False, description="리뷰 작성 완료 여부 (상품 or 가이드)")
    class Config: from_attributes = True

class UserInfoSchema(BaseModel):
    nickname: str = Field(..., description="고객 닉네임")
    email: EmailStr = Field(..., description="고객 이메일 (연락용)")
    class Config: from_attributes = True

class GuideBookingSchema(BaseModel):
    booking_id: int = Field(..., description="예약 고유 ID")
    content_id: int = Field(..., description="콘텐츠 ID")
    content_title: str = Field(..., description="콘텐츠 제목")
    content_main_image_url: Optional[str] = Field(None, description="콘텐츠 메인 이미지 URL")
    booking_date: datetime = Field(..., description="예약 날짜 및 시간")
    personnel: int = Field(..., description="예약 인원")
    status: str = Field(..., description="예약 상태 (예: Pending, Confirmed, Completed)")
    traveler: UserInfoSchema = Field(..., description="예약 고객 정보")
    class Config: from_attributes = True

# ==================================================
# 4. Review 관련 스키마
# ==================================================
class ReviewBase(BaseModel):
    rating: float = Field(..., ge=0.5, le=5.0, description="별점 (0.5 ~ 5.0 사이)")
    comment: str = Field(..., description="리뷰 코멘트") 

class ContentReviewCreate(ReviewBase):
    booking_id: int = Field(..., description="리뷰를 작성할 예약(Booking) ID")

class ContentReviewResponse(BaseModel):
    id: int
    reviewer_id: int
    rating: float
    text: str
    created_at: datetime
    class Config: from_attributes = True

class GuideReviewCreate(ReviewBase):
    booking_id: int = Field(..., description="리뷰를 작성할 예약(Booking) ID")

class GuideReviewResponse(BaseModel):
    id: int
    reviewer_id: int
    guide_id: int
    rating: float
    text: str
    created_at: datetime
    class Config: from_attributes = True

