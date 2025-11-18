from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from typing import List, Optional
from datetime import datetime

# ==================================================
# 5. AI Character System (신규 - 의존성 때문에 상단 선언)
# ==================================================
# AiCharacter 스키마는 User, GuideProfile 등에서 참조되므로 먼저 정의합니다.

class AiCharacter(BaseModel):
    """AI 캐릭터 (대분류) 응답 스키마"""
    id: int
    name: str
    description: Optional[str] = None
    
    # --- ▼ [수정] 캐릭터 이미지 URL 필드 추가 ▼ ---
    image_url: Optional[str] = Field(None, description="캐릭터 대표 이미지 URL")
    # --- ▲ [수정] ▲ ---

    model_config = ConfigDict(from_attributes=True)

# ==================================================
# 1. Content 관련 스키마 (기존과 동일)
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

    model_config = ConfigDict(from_attributes=True)

# ContentList 무한 스크롤용 응답 스키마
class ContentListResponse(BaseModel):
    contents: List[ContentListSchema] = Field(..., description="현재 페이지의 콘텐츠 목록")
    total_count: int = Field(..., description="조건에 맞는 전체 콘텐츠 개수")

    model_config = ConfigDict(from_attributes=True)


# --- Tag 스키마 (Detail Page용) ---
class TagSchema(BaseModel):
    """
    Tag 모델을 위한 Pydantic 스키마
    """
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


# DetailPage의 'ReviewList' 컴포넌트용 스키마
class ReviewSchema(BaseModel):
    id: int
    reviewer_nickname: str = Field(..., alias="user", description="리뷰 작성자 닉네임")
    rating: float # Pydantic v2는 float 사용을 권장
    text: str = Field(..., description="리뷰 본문")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True) # V2 스타일 alias 설정


# DetailPage의 'RelatedContentList' 컴포넌트용 스키마
class RelatedContentSchema(BaseModel):
    id: int
    title: str
    time: Optional[str] = Field(None, description="소요 시간 (예: 3시간 소요)")
    price: Optional[str] = Field(None, description="가격 (문자열, 예: 60,000)")
    rating: Optional[float] = Field(None, description="평점 (예: 4.2)")
    imageUrl: Optional[str] = Field(None, description="관련 콘텐츠 이미지 URL")

    model_config = ConfigDict(from_attributes=True)

# Content 상세 정보 조회 시 응답 스키마 (DetailPage용)
class ContentDetailSchema(ContentListSchema):
    guide_name: Optional[str] = Field(None, description="가이드 이름 (DetailPage용)")
    guide_avg_rating: Optional[float] = Field(None, description="가이드 평균 평점")
    created_at: Optional[datetime] = None
    status: Optional[str] = None
    rating: Optional[float] = Field(None, description="콘텐츠 평균 평점")
    review_count: Optional[int] = Field(None, description="콘텐츠의 '전체' 리뷰 총 개수")
    
    tags: List[TagSchema] = Field(default_factory=list, description="콘텐츠 태그 목록")
    
    reviews: List[ReviewSchema] = Field(default_factory=list, description="현재 페이지의 콘텐츠 리뷰 목록")
    related_contents: List[RelatedContentSchema] = Field(default_factory=list, description="현재 페이지의 관련 콘텐츠 목록")
    total_related_count: Optional[int] = Field(None, description="전체 관련 콘텐츠 개수")

    model_config = ConfigDict(from_attributes=True)


# --- 지도 마커 + 사이드바용 스키마 ---
class MapContentSchema(BaseModel):
    """
    지도 마커 및 사이드바 표시에 필요한 콘텐츠 정보 스키마
    (GET /api/contents/map-data 응답용)
    """
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


# ==================================================
# 2. Auth & User 관련 스키마
# ==================================================
class LoginRequest(BaseModel):
    email: str = Field(..., description="사용자 이메일")
    password: str = Field(..., description="사용자 비밀번호")

class LoginResponse(BaseModel):
    access_token: str = Field(..., description="JWT 액세스 토큰")
    token_type: str = Field("bearer", description="토큰 타입 (고정값 'bearer')")


# --- ▼ [신규] GuideProfile 응답 스키마 (User 스키마에 포함될) ---
class GuideProfileSchema(BaseModel):
    """가이드 프로필 정보 응답 스키마"""
    users_id: int
    bio: Optional[str] = None
    license_status: str
    avg_rating: float
    manner_score: int
    
    # --- ▼ [신규] '대표 캐릭터' (가이드로서) 필드 ▼ ---
    ai_character_id_as_guide: Optional[int] = Field(None, description="ES 검색용 대표 캐릭터 ID")
    ai_character_as_guide: Optional[AiCharacter] = Field(None, description="대표 캐릭터 상세 정보")
    # --- ▲ [신규] ▲ ---

    model_config = ConfigDict(from_attributes=True)
# --- ▲ [신규] ▲ ---


# --- ▼ [수정] 회원가입(Signup) 관련 스키마 (AI 필드 추가) ▼ ---
class UserPublic(BaseModel):
    """(기존) /users/me 또는 다른 유저 정보 응답 시 사용"""
    id: int
    email: EmailStr
    nickname: str = Field(..., description="프론트엔드의 'username'에 해당")
    user_type: str
    
    # --- ▼ [수정] '대표 캐릭터' (여행자로서) 필드 추가 ▼ ---
    ai_character_id_as_traveler: Optional[int] = Field(None, description="ES 검색용 대표 캐릭터 ID")
    ai_character_as_traveler: Optional[AiCharacter] = Field(None, description="대표 캐릭터 상세 정보")
    # --- ▲ [수정] ▲ ---
    
    # --- ▼ [신규] 가이드 프로필 정보 (가이드일 경우) ▼ ---
    guide_profile: Optional[GuideProfileSchema] = Field(None, description="가이드 유저일 경우 포함되는 프로필")
    # --- ▲ [신규] ▲ ---

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
# --- ▲ [수정] 완료 ---


# ==================================================
# 3. Booking 관련 스키마 (기존과 동일)
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

# ==================================================
# 4. Review 관련 스키마 (수정 및 추가)
# ==================================================
class ReviewBase(BaseModel):
    rating: float = Field(..., ge=0.5, le=5.0, description="별점 (0.5 ~ 5.0 사이)")
    comment: str = Field(..., description="리뷰 코멘트") 

# --- (여행자 -> 상품) ---
class ContentReviewCreate(ReviewBase):
    booking_id: int = Field(..., description="리뷰를 작성할 예약(Booking) ID")

class ContentReviewResponse(BaseModel):
    id: int
    reviewer_id: int
    rating: float
    text: str # models.py에 text로 되어있으므로 comment가 아님
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- (여행자 -> 가이드) ---
class GuideReviewCreate(ReviewBase):
    booking_id: int = Field(..., description="리뷰를 작성할 예약(Booking) ID")

class GuideReviewResponse(BaseModel):
    id: int
    reviewer_id: int
    guide_id: int
    rating: float
    text: str # models.py에 text로 되어있으므로 comment가 아님
    created_at: datetime
    
    # --- ▼ [수정] '리뷰별 캐릭터' 및 'AI 증거' 필드 추가 ▼ ---
    ai_character_id: Optional[int] = Field(None, description="% 계산 원본용 캐릭터 ID")
    ai_character: Optional[AiCharacter] = Field(None, description="리뷰별 캐릭터 상세 정보")
    guide_review_tags: List['GuideReviewTag'] = Field(default_factory=list, description="AI가 추출한 증거 태그 목록")
    # --- ▲ [수정] ▲ ---
    
    model_config = ConfigDict(from_attributes=True)

# --- ▼ [신규] (가이드 -> 여행자) 스키마 ▼ ---
class TravelerReviewCreate(ReviewBase):
    booking_id: int = Field(..., description="리뷰를 작성할 예약(Booking) ID")

class TravelerReviewResponse(BaseModel):
    id: int
    guide_id: int # 리뷰어(가이드)
    traveler_id: int # 피리뷰어(여행자)
    rating: float
    text: str
    created_at: datetime
    
    # --- ▼ [신규] '리뷰별 캐릭터' 및 'AI 증거' 필드 ▼ ---
    ai_character_id: Optional[int] = Field(None, description="% 계산 원본용 캐릭터 ID")
    ai_character: Optional[AiCharacter] = Field(None, description="리뷰별 캐릭터 상세 정보")
    traveler_review_tags: List['TravelerReviewTag'] = Field(default_factory=list, description="AI가 추출한 증거 태그 목록")
    # --- ▲ [신규] ▲ ---
    
    model_config = ConfigDict(from_attributes=True)
# --- ▲ [신규] ▲ ---


# ==================================================
# 5. AI Character System (신규 - 본체)
# ==================================================

# --- ▼ [신규] 1. 'AI 규칙' (정의 태그 매핑) ▼ ---
class AiCharacterDefinitionTag(BaseModel):
    """AI 규칙서(캐릭터-태그) 응답 스키마"""
    id: int
    ai_character_id: int
    tag_id: int
    
    model_config = ConfigDict(from_attributes=True)

class AiCharacterWithTags(AiCharacter):
    """RAG 지식(규칙서) 로드용 스키마 (캐릭터 + 태그 이름)"""
    definition_tags: List[TagSchema] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

# --- ▼ [신규] 2. 'AI 증거' (가이드 리뷰 태그) ▼ ---
class GuideReviewTag(BaseModel):
    """(여행자->가이드) 리뷰에서 추출된 AI 증거 태그 응답 스키마"""
    id: int
    guide_review_id: int
    tag: TagSchema # 태그 상세 정보 포함

    model_config = ConfigDict(from_attributes=True)

# --- ▼ [신규] 2. 'AI 증거' (여행자 리뷰 태그) ▼ ---
class TravelerReviewTag(BaseModel):
    """(가이드->여행자) 리뷰에서 추출된 AI 증거 태그 응답 스키마"""
    id: int
    traveler_review_id: int
    tag: TagSchema # 태그 상세 정보 포함

    model_config = ConfigDict(from_attributes=True)

# --- ▼ [신규] Pydantic V2 순환 참조 문제 해결 ▼ ---
# FastAPI가 시작될 때 AiCharacter -> GuideReviewResponse -> GuideReviewTag -> Tag
# 같은 순환 참조를 해결하기 위해 수동으로 rebuild(rebuild)가 필요할 수 있습니다.
# FastAPI 앱의 메인 파일 (예: main.py) 최하단에 다음 두 줄을 추가하는 것을 권장합니다.
# GuideReviewResponse.model_rebuild()
# TravelerReviewResponse.model_rebuild()