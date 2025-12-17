from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from typing import List, Optional
from datetime import datetime

class AiCharacter(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = Field(None, description="캐릭터 대표 이미지 URL")
    model_config = ConfigDict(from_attributes=True)

class ContentListSchema(BaseModel):
    id: int = Field(..., description="콘텐츠 고유 ID")
    title: str = Field(..., description="콘텐츠 제목")
    description: str = Field(..., description="콘텐츠 짧은 설명")
    price: int = Field(..., description="콘텐츠 가격 (원)")
    location: str = Field(..., description="지역 코드 (예: SEO)")
    guide_nickname: str = Field(..., description="가이드 닉네임")
    main_image_url: Optional[str] = Field(None, description="메인 이미지 URL")
    guide_id: int = Field(..., description="콘텐츠 작성자(가이드)의 User ID")
    rating: float = Field(0.0, description="평점 평균 (없으면 0.0)")
    review_count: int = Field(0, description="리뷰 개수 (없으면 0)")
    model_config = ConfigDict(from_attributes=True)

class ContentListResponse(BaseModel):
    contents: List[ContentListSchema] = Field(..., description="현재 페이지의 콘텐츠 목록")
    total_count: int = Field(..., description="조건에 맞는 전체 콘텐츠 개수")
    model_config = ConfigDict(from_attributes=True)

class TagSchema(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class ReviewSchema(BaseModel):
    id: int
    reviewer_nickname: str = Field(..., alias="user", description="리뷰 작성자 닉네임")
    rating: float
    text: str = Field(..., description="리뷰 본문")
    created_at: datetime
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class RelatedContentSchema(BaseModel):
    id: int
    title: str
    time: Optional[str] = Field(None, description="소요 시간 (예: 3시간 소요)")
    price: Optional[str] = Field(None, description="가격 (문자열, 예: 60,000)")
    rating: Optional[float] = Field(None, description="평점 (예: 4.2)")
    imageUrl: Optional[str] = Field(None, description="관련 콘텐츠 이미지 URL")
    model_config = ConfigDict(from_attributes=True)

class ContentDetailSchema(ContentListSchema):
    guide_name: Optional[str] = Field(None, description="가이드 이름 (DetailPage용)")
    guide_avg_rating: Optional[float] = Field(None, description="가이드 평균 평점")
    created_at: Optional[datetime] = None
    status: Optional[str] = None
    tags: List[TagSchema] = Field(default_factory=list, description="콘텐츠 태그 목록")
    reviews: List[ReviewSchema] = Field(default_factory=list, description="현재 페이지의 콘텐츠 리뷰 목록")
    related_contents: List[RelatedContentSchema] = Field(default_factory=list, description="현재 페이지의 관련 콘텐츠 목록")
    total_related_count: Optional[int] = Field(None, description="전체 관련 콘텐츠 개수")
    model_config = ConfigDict(from_attributes=True)

class MapContentSchema(BaseModel):
    id: int = Field(..., description="콘텐츠 ID")
    title: str = Field(..., description="콘텐츠 제목")
    location: str = Field(..., description="지역명 (예: 해운대구)")
    latitude: Optional[float] = Field(None, description="위도 (lat)")
    longitude: Optional[float] = Field(None, description="경도 (lng)")
    main_image_url: Optional[str] = Field(None, description="메인 이미지 URL (사이드바 카드용)")
    description: Optional[str] = Field(None, description="콘텐츠 설명 (사이드바 상세용)")
    price: Optional[int] = Field(None, description="콘텐츠 가격 (사이드바용)")
    rating: Optional[float] = Field(None, description="콘텐츠 평점 (RelatedContentCard가 사용)")
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    email: str = Field(..., description="사용자 이메일")
    password: str = Field(..., description="사용자 비밀번호")

class LoginResponse(BaseModel):
    access_token: str = Field(..., description="JWT 액세스 토큰")
    token_type: str = Field("bearer", description="토큰 타입 (고정값 'bearer')")

class GuideProfileSchema(BaseModel):
    users_id: int
    bio: Optional[str] = None
    license_status: str
    avg_rating: float
    manner_score: int
    ai_character_id_as_guide: Optional[int] = Field(None, description="ES 검색용 대표 캐릭터 ID")
    ai_character_as_guide: Optional[AiCharacter] = Field(None, description="대표 캐릭터 상세 정보")
    model_config = ConfigDict(from_attributes=True)

class UserPublic(BaseModel):
    id: int
    email: EmailStr
    nickname: str = Field(..., description="프론트엔드의 'username'에 해당")
    user_type: str
    ai_character_id_as_traveler: Optional[int] = Field(None, description="ES 검색용 대표 캐릭터 ID")
    ai_character_as_traveler: Optional[AiCharacter] = Field(None, description="대표 캐릭터 상세 정보")
    guide_profile: Optional[GuideProfileSchema] = Field(None, description="가이드 유저일 경우 포함되는 프로필")
    model_config = ConfigDict(from_attributes=True)

class SignupRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50, description="사용자 닉네임 (프론트엔드 필드명)")
    email: EmailStr = Field(..., description="사용자 이메일 (로그인 ID)")
    password: str = Field(..., min_length=8, description="비밀번호 (8자 이상)")
    user_type: str = Field("traveler", description="사용자 유형 ('traveler' 또는 'guide')")
    @field_validator('user_type')
    def validate_user_type(cls, v):
        if v not in ['traveler', 'guide']:
            raise ValueError("user_type은 'traveler' 또는 'guide' 여야 합니다.")
        return v

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
    model_config = ConfigDict(from_attributes=True)

class MyBookingSchema(BaseModel):
    booking_id: int = Field(..., description="예약 고유 ID")
    content_id: int = Field(..., description="콘텐츠 ID (상세보기 링크용)")
    content_title: str = Field(..., description="콘텐츠 제목")
    content_main_image_url: Optional[str] = Field(None, description="콘텐츠 메인 이미지 URL")
    booking_date: datetime = Field(..., description="예약 날짜 및 시간")
    personnel: int = Field(..., description="예약 인원")
    status: str = Field(..., description="예약 상태 (예: Pending, Confirmed)")
    is_reviewed: bool = Field(False, description="리뷰 작성 완료 여부 (상품 or 가이드)")
    model_config = ConfigDict(from_attributes=True)

class UserInfoSchema(BaseModel):
    nickname: str = Field(..., description="고객 닉네임")
    email: EmailStr = Field(..., description="고객 이메일 (연락용)")
    model_config = ConfigDict(from_attributes=True)

class GuideBookingSchema(BaseModel):
    booking_id: int = Field(..., description="예약 고유 ID")
    content_id: int = Field(..., description="콘텐츠 ID")
    content_title: str = Field(..., description="콘텐츠 제목")
    content_main_image_url: Optional[str] = Field(None, description="콘텐츠 메인 이미지 URL")
    booking_date: datetime = Field(..., description="예약 날짜 및 시간")
    personnel: int = Field(..., description="예약 인원")
    status: str = Field(..., description="예약 상태 (예: Pending, Confirmed, Completed)")
    traveler: UserInfoSchema = Field(..., description="예약 고객 정보")
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)

class GuideReviewCreate(ReviewBase):
    booking_id: int = Field(..., description="리뷰를 작성할 예약(Booking) ID")

class GuideReviewResponse(BaseModel):
    id: int
    reviewer_id: int
    guide_id: int
    rating: float
    text: str
    created_at: datetime
    ai_character_id: Optional[int] = Field(None, description="% 계산 원본용 캐릭터 ID")
    ai_character: Optional[AiCharacter] = Field(None, description="리뷰별 캐릭터 상세 정보")
    guide_review_tags: List['GuideReviewTag'] = Field(default_factory=list, description="AI가 추출한 증거 태그 목록")
    model_config = ConfigDict(from_attributes=True)

class TravelerReviewCreate(ReviewBase):
    booking_id: int = Field(..., description="리뷰를 작성할 예약(Booking) ID")

class TravelerReviewResponse(BaseModel):
    id: int
    guide_id: int
    traveler_id: int
    rating: float
    text: str
    created_at: datetime
    ai_character_id: Optional[int] = Field(None, description="% 계산 원본용 캐릭터 ID")
    ai_character: Optional[AiCharacter] = Field(None, description="리뷰별 캐릭터 상세 정보")
    traveler_review_tags: List['TravelerReviewTag'] = Field(default_factory=list, description="AI가 추출한 증거 태그 목록")
    model_config = ConfigDict(from_attributes=True)

class AiCharacterDefinitionTag(BaseModel):
    id: int
    ai_character_id: int
    tag_id: int
    model_config = ConfigDict(from_attributes=True)

class AiCharacterWithTags(AiCharacter):
    definition_tags: List[TagSchema] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)

class GuideReviewTag(BaseModel):
    id: int
    guide_review_id: int
    tag: TagSchema
    model_config = ConfigDict(from_attributes=True)

class TravelerReviewTag(BaseModel):
    id: int
    traveler_review_id: int
    tag: TagSchema
    model_config = ConfigDict(from_attributes=True)
