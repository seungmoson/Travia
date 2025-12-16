from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from typing import List, Optional
from datetime import datetime

# ==================================================
# 0. AI Service Schemas (신규 - OpenAI Structured Outputs용)
# ==================================================
# 이 스키마들은 DB에 저장하기 전, AI의 출력을 안전하게 파싱하고 검증하는 용도입니다.

class ProductReviewExtraction(BaseModel):
    """[Track A] 상품 리뷰 분석 결과: 3가지 카테고리로 태그 분류"""
    locations: List[str] = Field(default_factory=list, description="리뷰에 언급된 구체적인 장소, 관광지, 도시 이름")
    activities: List[str] = Field(default_factory=list, description="리뷰에 언급된 구체적인 활동, 체험 (동사형 제외)")
    foods_objects: List[str] = Field(default_factory=list, description="리뷰에 언급된 음식, 메뉴, 특산품 또는 물건")

    # [Safety] DB 컬럼(VARCHAR 50) 초과 방지를 위한 자동 절삭
    @field_validator('locations', 'activities', 'foods_objects', check_fields=False)
    @classmethod
    def truncate_long_tags(cls, v: List[str]) -> List[str]:
        # 빈 문자열 제거 및 50자 제한
        return [tag[:50] for tag in v if tag and tag.strip()]

class CharacterAnalysisResult(BaseModel):
    """[Track B] 성향 분석 결과: One-Shot 분류 데이터"""
    chain_of_thought: str = Field(..., description="이 캐릭터로 판단하게 된 논리적인 추론 과정 (한국어 서술)")
    character_id: int = Field(..., description="가장 적합한 캐릭터의 ID 숫자 (1~9 사이)")
    extracted_keywords: List[str] = Field(..., description="판단의 근거가 된 핵심 키워드 3~5개")

    # [Safety] 키워드 길이 제한
    @field_validator('extracted_keywords')
    @classmethod
    def truncate_keywords(cls, v: List[str]) -> List[str]:
        return [tag[:50] for tag in v if tag and tag.strip()]


# ==================================================
# 5. AI Character System (의존성 때문에 상단 선언)
# ==================================================

class AiCharacter(BaseModel):
    """AI 캐릭터 (대분류) 응답 스키마"""
    id: int
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = Field(None, description="캐릭터 대표 이미지 URL")

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 1. Content 관련 스키마
# ==================================================

class ContentListSchema(BaseModel):
    """MainPage 목록 조회용"""
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
    """Detail Page 태그 표시용"""
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

class ReviewSchema(BaseModel):
    """Detail Page 리뷰 목록용"""
    id: int
    reviewer_nickname: str = Field(..., alias="user", description="리뷰 작성자 닉네임")
    rating: float
    text: str = Field(..., description="리뷰 본문")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class RelatedContentSchema(BaseModel):
    id: int
    title: str
    time: Optional[str] = Field(None, description="소요 시간")
    price: Optional[str] = Field(None, description="가격")
    rating: Optional[float] = Field(None, description="평점")
    imageUrl: Optional[str] = Field(None, description="관련 콘텐츠 이미지 URL")

    model_config = ConfigDict(from_attributes=True)

class ContentDetailSchema(ContentListSchema):
    """Detail Page 상세 조회용"""
    guide_name: Optional[str] = Field(None, description="가이드 이름")
    guide_avg_rating: Optional[float] = Field(None, description="가이드 평균 평점")
    created_at: Optional[datetime] = None
    status: Optional[str] = None
    
    tags: List[TagSchema] = Field(default_factory=list, description="콘텐츠 태그 목록")
    reviews: List[ReviewSchema] = Field(default_factory=list, description="콘텐츠 리뷰 목록")
    related_contents: List[RelatedContentSchema] = Field(default_factory=list, description="관련 콘텐츠 목록")
    total_related_count: Optional[int] = Field(None, description="전체 관련 콘텐츠 개수")

    model_config = ConfigDict(from_attributes=True)

class MapContentSchema(BaseModel):
    """지도 마커용"""
    id: int = Field(..., description="콘텐츠 ID")
    title: str = Field(..., description="콘텐츠 제목")
    location: str = Field(..., description="지역명")
    latitude: Optional[float] = Field(None, description="위도")
    longitude: Optional[float] = Field(None, description="경도")
    main_image_url: Optional[str] = Field(None, description="메인 이미지 URL")
    description: Optional[str] = Field(None, description="콘텐츠 설명")
    price: Optional[int] = Field(None, description="콘텐츠 가격")
    rating: Optional[float] = Field(None, description="콘텐츠 평점")

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 2. Auth & User 관련 스키마
# ==================================================

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class GuideProfileSchema(BaseModel):
    users_id: int
    bio: Optional[str] = None
    license_status: str
    avg_rating: float
    manner_score: int
    
    ai_character_id_as_guide: Optional[int] = Field(None, description="대표 캐릭터 ID")
    ai_character_as_guide: Optional[AiCharacter] = Field(None, description="대표 캐릭터 상세")

    model_config = ConfigDict(from_attributes=True)

class UserPublic(BaseModel):
    id: int
    email: EmailStr
    nickname: str
    user_type: str
    
    ai_character_id_as_traveler: Optional[int] = Field(None, description="대표 캐릭터 ID")
    ai_character_as_traveler: Optional[AiCharacter] = Field(None, description="대표 캐릭터 상세")
    
    guide_profile: Optional[GuideProfileSchema] = Field(None, description="가이드 프로필")

    model_config = ConfigDict(from_attributes=True)

class SignupRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    user_type: str = "traveler"

    @field_validator('user_type')
    @classmethod
    def validate_user_type(cls, v):
        if v not in ['traveler', 'guide']:
            raise ValueError("user_type은 'traveler' 또는 'guide' 여야 합니다.")
        return v


# ==================================================
# 3. Booking 관련 스키마
# ==================================================

class BookingCreateRequest(BaseModel):
    content_id: int
    booking_date: datetime
    personnel: int = Field(..., gt=0)

class BookingCreateResponse(BaseModel):
    booking_id: int
    content_title: str
    booking_date: datetime
    personnel: int
    status: str
    message: str = "예약 요청이 성공적으로 접수되었습니다."
    model_config = ConfigDict(from_attributes=True)

class MyBookingSchema(BaseModel):
    booking_id: int
    content_id: int
    content_title: str
    content_main_image_url: Optional[str] = None
    booking_date: datetime
    personnel: int
    status: str
    is_reviewed: bool = False
    model_config = ConfigDict(from_attributes=True)

class UserInfoSchema(BaseModel):
    nickname: str
    email: EmailStr
    model_config = ConfigDict(from_attributes=True)

class GuideBookingSchema(BaseModel):
    booking_id: int
    content_id: int
    content_title: str
    content_main_image_url: Optional[str] = None
    booking_date: datetime
    personnel: int
    status: str
    traveler: UserInfoSchema
    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 4. Review 관련 스키마
# ==================================================

class ReviewBase(BaseModel):
    rating: float = Field(..., ge=0.5, le=5.0)
    comment: str

class ContentReviewCreate(ReviewBase):
    booking_id: int

class ContentReviewResponse(BaseModel):
    id: int
    reviewer_id: int
    rating: float
    text: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class GuideReviewCreate(ReviewBase):
    booking_id: int

class GuideReviewResponse(BaseModel):
    id: int
    reviewer_id: int
    guide_id: int
    rating: float
    text: str
    created_at: datetime
    
    ai_character_id: Optional[int] = None
    ai_character: Optional[AiCharacter] = None
    
    # [수정] AI 판단 근거 필드 추가 (DB models.py와 동기화)
    ai_reasoning: Optional[str] = Field(None, description="AI 판단 근거 (Chain of Thought)")
    
    # Forward Reference
    guide_review_tags: List['GuideReviewTag'] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)

class TravelerReviewCreate(ReviewBase):
    booking_id: int

class TravelerReviewResponse(BaseModel):
    id: int
    guide_id: int
    traveler_id: int
    rating: float
    text: str
    created_at: datetime
    
    ai_character_id: Optional[int] = None
    ai_character: Optional[AiCharacter] = None

    # [수정] AI 판단 근거 필드 추가
    ai_reasoning: Optional[str] = Field(None, description="AI 판단 근거 (Chain of Thought)")
    
    traveler_review_tags: List['TravelerReviewTag'] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 5. AI Character System (본체)
# ==================================================

class AiCharacterDefinitionTag(BaseModel):
    id: int
    ai_character_id: int
    tag_id: int
    model_config = ConfigDict(from_attributes=True)

class AiCharacterWithTags(AiCharacter):
    definition_tags: List[TagSchema] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)

class GuideReviewTag(BaseModel):
    """(여행자->가이드) 리뷰 AI 증거 태그"""
    id: int
    guide_review_id: int
    tag: TagSchema
    model_config = ConfigDict(from_attributes=True)

class TravelerReviewTag(BaseModel):
    """(가이드->여행자) 리뷰 AI 증거 태그"""
    id: int
    traveler_review_id: int
    tag: TagSchema
    model_config = ConfigDict(from_attributes=True)

# 순환 참조 해결 (Rebuild)
# 실제 런타임에 모델이 로드될 때 참조 관계를 확정합니다.
# (FastAPI 실행 시점에서 자동으로 처리되기도 하지만, 명시적으로 호출하는 것이 안전합니다)
# GuideReviewResponse.model_rebuild()
# TravelerReviewResponse.model_rebuild()