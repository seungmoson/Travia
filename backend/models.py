from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

SCHEMA_NAME = 'travel_project'

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'schema': SCHEMA_NAME}
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(100), unique=True, nullable=False)
    nickname = Column(String(50), nullable=False)
    password = Column(String(255), nullable=False)
    user_type = Column(String(10), nullable=False)
    profile_image_url = Column(String(255))
    created_at = Column(DateTime, default=func.now(), nullable=False)
    ai_character_id_as_traveler = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.ai_characters.id'), nullable=True)
    guide_profile = relationship("GuideProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings_as_traveler = relationship("Booking", back_populates="traveler")
    reviews_as_reviewer = relationship("Review", back_populates="reviewer")
    traveler_reviews_as_traveler = relationship("TravelerReview", back_populates="traveler")
    ai_character_as_traveler = relationship("AiCharacter", foreign_keys=[ai_character_id_as_traveler])

class GuideProfile(Base):
    __tablename__ = "guide_profiles"
    __table_args__ = {'schema': SCHEMA_NAME}
    users_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.users.id', ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    bio = Column(Text)
    license_status = Column(String(20), nullable=False)
    avg_rating = Column(Float, default=0.0, nullable=False)
    manner_score = Column(Integer, default=100, nullable=False)
    ai_character_id_as_guide = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.ai_characters.id'), nullable=True)
    user = relationship("User", back_populates="guide_profile")
    contents = relationship("Content", back_populates="guide", cascade="all, delete-orphan")
    guide_reviews = relationship("GuideReview", back_populates="guide")
    traveler_reviews_as_guide = relationship("TravelerReview", back_populates="guide_reviewer")
    ai_character_as_guide = relationship("AiCharacter", foreign_keys=[ai_character_id_as_guide])

class Content(Base):
    __tablename__ = "contents"
    __table_args__ = {'schema': SCHEMA_NAME}
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    guide_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.guide_profiles.users_id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Integer, nullable=False)
    location = Column(String(15), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
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

class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = {'schema': SCHEMA_NAME}
    id = Column(Integer, primary_key=True, autoincrement=True)
    traveler_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.users.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    content_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.contents.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    booking_date = Column(DateTime, nullable=False)
    personnel = Column(Integer, nullable=False, default=1)
    status = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
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
    rating = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
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
    rating = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    ai_character_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.ai_characters.id'), nullable=True)
    booking = relationship("Booking", back_populates="guide_review")
    guide = relationship("GuideProfile", back_populates="guide_reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    guide_review_tags = relationship("GuideReviewTag", back_populates="guide_review", cascade="all, delete-orphan")
    ai_character = relationship("AiCharacter", foreign_keys=[ai_character_id])

class TravelerReview(Base):
    __tablename__ = "traveler_reviews"
    __table_args__ = {'schema': SCHEMA_NAME}
    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.bookings.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, unique=True)
    guide_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.guide_profiles.users_id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    traveler_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.users.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    ai_character_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.ai_characters.id'), nullable=True)
    booking = relationship("Booking", back_populates="traveler_review")
    guide_reviewer = relationship("GuideProfile", back_populates="traveler_reviews_as_guide")
    traveler = relationship("User", back_populates="traveler_reviews_as_traveler")
    traveler_review_tags = relationship("TravelerReviewTag", back_populates="traveler_review", cascade="all, delete-orphan")
    ai_character = relationship("AiCharacter", foreign_keys=[ai_character_id])

class Tag(Base):
    __tablename__ = "tags"
    __table_args__ = {'schema': SCHEMA_NAME}
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    tag_type = Column(String(255), nullable=False)
    content_tags = relationship("ContentTag", back_populates="tag")
    review_tags = relationship("ReviewTag", back_populates="tag")
    ai_character_definitions = relationship("AiCharacterDefinitionTag", back_populates="tag")
    guide_review_tags = relationship("GuideReviewTag", back_populates="tag")
    traveler_review_tags = relationship("TravelerReviewTag", back_populates="tag")

class ContentTag(Base):
    __tablename__ = "content_tags"
    __table_args__ = (UniqueConstraint('contents_id', 'tag_id', name='ux_content_tag'),{'schema': SCHEMA_NAME})
    id = Column(Integer, primary_key=True, autoincrement=True)
    contents_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.contents.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.tags.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    is_ai_extracted = Column(Boolean, nullable=False)
    content = relationship("Content", back_populates="content_tags")
    tag = relationship("Tag", back_populates="content_tags")

class ReviewTag(Base):
    __tablename__ = "review_tags"
    __table_args__ = (UniqueConstraint('review_id', 'tag_id', name='ux_review_tag'),{'schema': SCHEMA_NAME})
    id = Column(Integer, primary_key=True, autoincrement=True)
    review_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.reviews.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.tags.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    is_ai_extracted = Column(Boolean, nullable=False)
    review = relationship("Review", back_populates="review_tags")
    tag = relationship("Tag", back_populates="review_tags")

class AiCharacter(Base):
    __tablename__ = "ai_characters"
    __table_args__ = {'schema': SCHEMA_NAME}
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    catchphrase = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    definition_tags = relationship("AiCharacterDefinitionTag", back_populates="ai_character", cascade="all, delete-orphan")

class AiCharacterDefinitionTag(Base):
    __tablename__ = "ai_character_definition_tags"
    __table_args__ = (UniqueConstraint('ai_character_id', 'tag_id', name='ux_ai_character_definition_tag'),{'schema': SCHEMA_NAME})
    id = Column(Integer, primary_key=True, autoincrement=True)
    ai_character_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.ai_characters.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.tags.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    ai_character = relationship("AiCharacter", back_populates="definition_tags")
    tag = relationship("Tag", back_populates="ai_character_definitions")

class GuideReviewTag(Base):
    __tablename__ = "guide_review_tags"
    __table_args__ = (UniqueConstraint('guide_review_id', 'tag_id', name='ux_guide_review_tag'),{'schema': SCHEMA_NAME})
    id = Column(Integer, primary_key=True, autoincrement=True)
    guide_review_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.guide_reviews.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.tags.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    guide_review = relationship("GuideReview", back_populates="guide_review_tags")
    tag = relationship("Tag", back_populates="guide_review_tags")

class TravelerReviewTag(Base):
    __tablename__ = "traveler_review_tags"
    __table_args__ = (UniqueConstraint('traveler_review_id', 'tag_id', name='ux_traveler_review_tag'),{'schema': SCHEMA_NAME})
    id = Column(Integer, primary_key=True, autoincrement=True)
    traveler_review_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.traveler_reviews.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey(f'{SCHEMA_NAME}.tags.id', ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    traveler_review = relationship("TravelerReview", back_populates="traveler_review_tags")
    tag = relationship("Tag", back_populates="traveler_review_tags")
