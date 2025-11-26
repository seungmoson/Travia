from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base # database.py에서 정의한 Base 임포트

# 모든 테이블의 __table_args__에 스키마 이름을 명시하여 사용합니다.
SCHEMA_NAME = 'travel_project'

# ==================================================
# 1. User & Profile
# ==================================================

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'schema': SCHEMA_NAME}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(100), unique=True, nullable=False)
    nickname = Column(String(50), nullable=False)
    password = Column(String(255), nullable=False)
    user_type = Column(String(10), nullable=False) # 'traveler', 'guide'
    profile_image_url = Column(String(255))
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # --- ▼ [수정] '대표 캐릭터' (여행자로서) 컬럼 추가 ▼ ---
    # ES 검색 및 프로필 요약에 사용 (배치 작업으로 업데이트)
    ai_character_id_as_traveler = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.ai_characters.id'), nullable=True)
    # --- ▲ [수정] ▲ ---
    
    # 관계 정의
    guide_profile = relationship("GuideProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings_as_traveler = relationship("Booking", back_populates="traveler")
    reviews_as_reviewer = relationship("Review", back_populates="reviewer")
    traveler_reviews_as_traveler = relationship("TravelerReview", back_populates="traveler")

    # --- ▼ [신규] 대표 캐릭터 관계 정의 ▼ ---
    ai_character_as_traveler = relationship("AiCharacter", foreign_keys=[ai_character_id_as_traveler])
    # --- ▲ [신규] ▲ ---

class GuideProfile(Base):
    __tablename__ = "guide_profiles"
    __table_args__ = {'schema': SCHEMA_NAME}

    # users_id가 Primary Key이자 Foreign Key
    users_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.users.id', ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    bio = Column(Text)
    license_status = Column(String(20), nullable=False) # 'Pending', 'Licensed'
    avg_rating = Column(Float, default=0.0, nullable=False)
    manner_score = Column(Integer, default=100, nullable=False)
    
    # --- ▼ [수정] '대표 캐릭터' (가이드로서) 컬럼 추가 ▼ ---
    # ES 검색 및 프로필 요약에 사용 (배치 작업으로 업데이트)
    ai_character_id_as_guide = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.ai_characters.id'), nullable=True)
    # --- ▲ [수정] ▲ ---
    
    # 관계 정의
    user = relationship("User", back_populates="guide_profile")
    contents = relationship("Content", back_populates="guide", cascade="all, delete-orphan")
    guide_reviews = relationship("GuideReview", back_populates="guide")
    traveler_reviews_as_guide = relationship("TravelerReview", back_populates="guide_reviewer")

    # --- ▼ [신규] 대표 캐릭터 관계 정의 ▼ ---
    ai_character_as_guide = relationship("AiCharacter", foreign_keys=[ai_character_id_as_guide])
    # --- ▲ [신규] ▲ ---


# ==================================================
# 2. Content (투어 상품)
# ==================================================

class Content(Base):
    __tablename__ = "contents"
    __table_args__ = {'schema': SCHEMA_NAME}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    guide_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.guide_profiles.users_id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Integer, nullable=False)
    location = Column(String(15), nullable=False) # 지역 코드 (예: SEO, ROM)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(10), nullable=False) # 'Draft', 'Active', 'Archived'
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # 관계 정의
    guide = relationship("GuideProfile", back_populates="contents")
    bookings = relationship("Booking", back_populates="content")
    images = relationship("ContentImage", back_populates="content", cascade="all, delete-orphan")
    videos = relationship("ContentVideo", back_populates="content", cascade="all, delete-orphan")
    content_tags = relationship("ContentTag", back_populates="content", cascade="all, delete-orphan")

class ContentImage(Base):
    __tablename__ = "content_image"
    __table_args__ = {'schema': SCHEMA_NAME}

    id = Column(Integer, primary_key=True, autoincrement=True)
    contents_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.contents.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    image_url = Column(String(255), nullable=False)
    sort_order = Column(Integer, nullable=False)
    is_main = Column(Boolean, nullable=False)
    
    content = relationship("Content", back_populates="images")

class ContentVideo(Base):
    __tablename__ = "content_video"
    __table_args__ = {'schema': SCHEMA_NAME}

    id = Column(Integer, primary_key=True, autoincrement=True)
    contents_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.contents.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    video_url = Column(String(255), nullable=False)
    sort_order = Column(Integer, nullable=False)
    is_main = Column(Boolean, nullable=False)
    
    content = relationship("Content", back_populates="videos")


# ==================================================
# 3. Booking & Review
# ==================================================

class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = {'schema': SCHEMA_NAME}

    id = Column(Integer, primary_key=True, autoincrement=True)
    traveler_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.users.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    content_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.contents.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    booking_date = Column(DateTime, nullable=False)
    personnel = Column(Integer, nullable=False, default=1)
    status = Column(String(20), nullable=False) # 'Pending', 'Confirmed', 'Completed', 'Canceled'
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # 관계 정의
    traveler = relationship("User", back_populates="bookings_as_traveler")
    content = relationship("Content", back_populates="bookings")
    review = relationship("Review", back_populates="booking", uselist=False)
    guide_review = relationship("GuideReview", back_populates="booking", uselist=False)
    traveler_review = relationship("TravelerReview", back_populates="booking", uselist=False)


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = {'schema': SCHEMA_NAME}

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.bookings.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, unique=True)
    reviewer_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.users.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False) # 상품 품질 평점 (1-5)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # 관계 정의
    booking = relationship("Booking", back_populates="review")
    reviewer = relationship("User", back_populates="reviews_as_reviewer")
    review_tags = relationship("ReviewTag", back_populates="review", cascade="all, delete-orphan")


class GuideReview(Base):
    __tablename__ = "guide_reviews"
    __table_args__ = {'schema': SCHEMA_NAME}

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.bookings.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, unique=True)
    guide_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.guide_profiles.users_id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.users.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False) # 가이드 매너/서비스 평점 (1-5)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # --- ▼ [수정] '리뷰별 캐릭터' 컬럼 추가 ▼ ---
    # 리뷰 작성 시 AI가 실시간 판단하여 저장 (% 계산의 원본 데이터)
    ai_character_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.ai_characters.id'), nullable=True)
    # --- ▲ [수정] ▲ ---

    # 관계 정의
    booking = relationship("Booking", back_populates="guide_review")
    guide = relationship("GuideProfile", back_populates="guide_reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id]) # 충돌 방지를 위해 foreign_keys 지정
    
    # --- ▼ [신규] 'AI 증거' 및 '리뷰별 캐릭터' 관계 정의 ▼ ---
    guide_review_tags = relationship("GuideReviewTag", back_populates="guide_review", cascade="all, delete-orphan")
    ai_character = relationship("AiCharacter", foreign_keys=[ai_character_id])
    # --- ▲ [신규] ▲ ---


class TravelerReview(Base):
    __tablename__ = "traveler_reviews"
    __table_args__ = {'schema': SCHEMA_NAME}

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.bookings.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, unique=True)
    guide_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.guide_profiles.users_id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    traveler_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.users.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False) # 고객 매너 평점 (1-5)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # --- ▼ [수정] '리뷰별 캐릭터' 컬럼 추가 ▼ ---
    # 리뷰 작성 시 AI가 실시간 판단하여 저장 (% 계산의 원본 데이터)
    ai_character_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.ai_characters.id'), nullable=True)
    # --- ▲ [수정] ▲ ---
    
    # 관계 정의
    booking = relationship("Booking", back_populates="traveler_review")
    guide_reviewer = relationship("GuideProfile", back_populates="traveler_reviews_as_guide")
    traveler = relationship("User", back_populates="traveler_reviews_as_traveler")

    # --- ▼ [신규] 'AI 증거' 및 '리뷰별 캐릭터' 관계 정의 ▼ ---
    traveler_review_tags = relationship("TravelerReviewTag", back_populates="traveler_review", cascade="all, delete-orphan")
    ai_character = relationship("AiCharacter", foreign_keys=[ai_character_id])
    # --- ▲ [신규] ▲ ---


# ==================================================
# 4. Tagging
# ==================================================

class Tag(Base):
    __tablename__ = "tags"
    __table_args__ = {'schema': SCHEMA_NAME}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    tag_type = Column(String(255), nullable=False) # 'Location', 'Activity', 'AI_Sentiment'
    
    # 관계 정의
    content_tags = relationship("ContentTag", back_populates="tag")
    review_tags = relationship("ReviewTag", back_populates="tag")

    # --- ▼ [신규] 'AI 시스템' 관계 정의 ▼ ---
    ai_character_definitions = relationship("AiCharacterDefinitionTag", back_populates="tag")
    guide_review_tags = relationship("GuideReviewTag", back_populates="tag")
    traveler_review_tags = relationship("TravelerReviewTag", back_populates="tag")
    # --- ▲ [신규] ▲ ---


class ContentTag(Base):
    __tablename__ = "content_tags"
    __table_args__ = (
        UniqueConstraint('contents_id', 'tag_id', name='ux_content_tag'),
        {'schema': SCHEMA_NAME}
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    contents_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.contents.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.tags.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    is_ai_extracted = Column(Boolean, nullable=False)
    
    # 관계 정의
    content = relationship("Content", back_populates="content_tags")
    tag = relationship("Tag", back_populates="content_tags")


class ReviewTag(Base):
    __tablename__ = "review_tags"
    __table_args__ = (
        UniqueConstraint('review_id', 'tag_id', name='ux_review_tag'),
        {'schema': SCHEMA_NAME}
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    review_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.reviews.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.tags.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    is_ai_extracted = Column(Boolean, nullable=False)
    
    # 관계 정의
    review = relationship("Review", back_populates="review_tags")
    tag = relationship("Tag", back_populates="review_tags")

# ==================================================
# 5. AI Character System
# ==================================================

class AiCharacter(Base):
    __tablename__ = "ai_characters"
    __table_args__ = {'schema': SCHEMA_NAME}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)   # 예: 위대한 개츠비, 쿠폰 든 나폴레옹
    catchphrase = Column(String(255), nullable=True)          # 예: "내 파티에 오차는 없어. 샴페인, 폭죽, 음악 큐!"
    description = Column(Text, nullable=True)                 # 상세 설명 (성격, 행동 양식 등)
    image_url = Column(String(255), nullable=True)

    definition_tags = relationship("AiCharacterDefinitionTag", back_populates="ai_character", cascade="all, delete-orphan")


# --- ▼ [신규] 1. 📖 'AI 규칙' 정의 테이블 (매핑) ▼ ---
class AiCharacterDefinitionTag(Base):
    __tablename__ = "ai_character_definition_tags"
    __table_args__ = (
        UniqueConstraint('ai_character_id', 'tag_id', name='ux_ai_character_definition_tag'),
        {'schema': SCHEMA_NAME}
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    ai_character_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.ai_characters.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.tags.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)

    # 관계 정의
    ai_character = relationship("AiCharacter", back_populates="definition_tags")
    tag = relationship("Tag", back_populates="ai_character_definitions")


# --- ▼ [신규] 2. 🏷️ 'AI 증거' 저장 테이블 (가이드 리뷰) ▼ ---
class GuideReviewTag(Base):
    __tablename__ = "guide_review_tags"
    __table_args__ = (
        UniqueConstraint('guide_review_id', 'tag_id', name='ux_guide_review_tag'),
        {'schema': SCHEMA_NAME}
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    guide_review_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.guide_reviews.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.tags.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    
    # 관계 정의
    guide_review = relationship("GuideReview", back_populates="guide_review_tags")
    tag = relationship("Tag", back_populates="guide_review_tags")

# --- ▼ [신규] 2. 🏷️ 'AI 증거' 저장 테이블 (여행자 리뷰) ▼ ---
class TravelerReviewTag(Base):
    __tablename__ = "traveler_review_tags"
    __table_args__ = (
        UniqueConstraint('traveler_review_id', 'tag_id', name='ux_traveler_review_tag'),
        {'schema': SCHEMA_NAME}
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    traveler_review_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.traveler_reviews.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.tags.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    
    # 관계 정의
    traveler_review = relationship("TravelerReview", back_populates="traveler_review_tags")
    tag = relationship("Tag", back_populates="traveler_review_tags")