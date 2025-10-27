-- ==================================================
-- Travia Project Database DDL Script
-- 1. 스키마 생성
-- 2. 테이블 정의 (DDL)
-- * Seed Data (INSERT 쿼리)는 seeddata.py 파일로 분리됨
-- ==================================================

-- 스키마 생성
CREATE SCHEMA IF NOT EXISTS travel_project;
USE travel_project;

-- --------------------------------------------------
-- 2. 테이블 정의 (DDL)
-- --------------------------------------------------

-- users 테이블 (모든 사용자 기본 정보)
CREATE TABLE travel_project.users (
id INT NOT NULL AUTO_INCREMENT,
email VARCHAR(100) NOT NULL UNIQUE,
nickname VARCHAR(50) NOT NULL,
password VARCHAR(255) NOT NULL,
user_type VARCHAR(10) NOT NULL, -- 'traveler', 'guide'
profile_image_url VARCHAR(255),
created_at DATETIME NOT NULL,
PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- guide_profiles 테이블 (가이드 전용 프로필 정보)
CREATE TABLE travel_project.guide_profiles (
users_id INT NOT NULL,
bio TEXT,
license_status VARCHAR(20) NOT NULL, -- 'Pending', 'Licensed'
avg_rating FLOAT NOT NULL DEFAULT 0.0,
manner_score INT NOT NULL DEFAULT 100,
PRIMARY KEY (users_id),
FOREIGN KEY (users_id) REFERENCES travel_project.users (id)
ON DELETE CASCADE -- users 삭제 시 프로필도 삭제
ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- contents 테이블 (투어 상품/콘텐츠 정보)
CREATE TABLE travel_project.contents (
id INT NOT NULL AUTO_INCREMENT,
guide_id INT NOT NULL,
title VARCHAR(200) NOT NULL,
description TEXT NOT NULL,
price INT NOT NULL,
location VARCHAR(10) NOT NULL, -- 지역 코드 (예: SEO, BAR, ROM)
status VARCHAR(10) NOT NULL, -- 'Draft', 'Active', 'Archived'
created_at DATETIME NOT NULL,
PRIMARY KEY (id),
FOREIGN KEY (guide_id) REFERENCES travel_project.guide_profiles (users_id)
ON DELETE RESTRICT -- 가이드가 삭제되려면 모든 콘텐츠가 먼저 삭제되어야 함
ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- bookings 테이블 (실제 예약 거래 기록)
CREATE TABLE travel_project.bookings (
id INT NOT NULL AUTO_INCREMENT,
traveler_id INT NOT NULL,
content_id INT NOT NULL,
booking_date DATETIME NOT NULL,
status VARCHAR(20) NOT NULL, -- 'Pending', 'Confirmed', 'Completed', 'Canceled'
created_at DATETIME NOT NULL,
PRIMARY KEY (id),
FOREIGN KEY (traveler_id) REFERENCES travel_project.users (id)
ON DELETE RESTRICT
ON UPDATE CASCADE,
FOREIGN KEY (content_id) REFERENCES travel_project.contents (id)
ON DELETE RESTRICT
ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- content_image 테이블 (상품 이미지 파일)
CREATE TABLE travel_project.content_image (
id INT NOT NULL AUTO_INCREMENT,
contents_id INT NOT NULL,
image_url VARCHAR(255) NOT NULL,
sort_order INT NOT NULL,
is_main BOOLEAN NOT NULL,
PRIMARY KEY (id),
FOREIGN KEY (contents_id) REFERENCES travel_project.contents (id)
ON DELETE CASCADE
ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- content_video 테이블 (상품 동영상 파일)
CREATE TABLE travel_project.content_video (
id INT NOT NULL AUTO_INCREMENT,
contents_id INT NOT NULL,
video_url VARCHAR(255) NOT NULL,
sort_order INT NOT NULL,
is_main BOOLEAN NOT NULL,
PRIMARY KEY (id),
FOREIGN KEY (contents_id) REFERENCES travel_project.contents (id)
ON DELETE CASCADE
ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- reviews 테이블 (상품/콘텐츠 후기 - booking을 통해 연결)
CREATE TABLE travel_project.reviews (
id INT NOT NULL AUTO_INCREMENT,
booking_id INT NOT NULL UNIQUE, -- 예약 당 하나의 상품 리뷰만 허용
reviewer_id INT NOT NULL,
rating INT NOT NULL, -- 상품 품질 평점 (1-5)
text TEXT NOT NULL,
created_at DATETIME NOT NULL,
PRIMARY KEY (id),
FOREIGN KEY (booking_id) REFERENCES travel_project.bookings (id)
ON DELETE RESTRICT
ON UPDATE CASCADE,
FOREIGN KEY (reviewer_id) REFERENCES travel_project.users (id)
ON DELETE RESTRICT
ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- tags 테이블 (AI/수동 등록 태그 마스터 목록)
CREATE TABLE travel_project.tags (
id INT NOT NULL AUTO_INCREMENT,
name VARCHAR(50) NOT NULL UNIQUE,
tag_type VARCHAR(255) NOT NULL, -- 'Location', 'Activity', 'AI_Sentiment'
PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- content_tags 테이블 (Content-Tag 다대다 관계)
CREATE TABLE travel_project.content_tags (
id INT NOT NULL AUTO_INCREMENT,
contents_id INT NOT NULL,
tag_id INT NOT NULL,
is_ai_extracted BOOLEAN NOT NULL,
PRIMARY KEY (id),
UNIQUE KEY ux_content_tag (contents_id, tag_id),
FOREIGN KEY (contents_id) REFERENCES travel_project.contents (id)
ON DELETE CASCADE
ON UPDATE CASCADE,
FOREIGN KEY (tag_id) REFERENCES travel_project.tags (id)
ON DELETE RESTRICT
ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- review_tags 테이블 (Review-Tag 다대다 관계 - AI 태그 검색 핵심)
CREATE TABLE travel_project.review_tags (
id INT NOT NULL AUTO_INCREMENT,
review_id INT NOT NULL,
tag_id INT NOT NULL,
is_ai_extracted BOOLEAN NOT NULL,
PRIMARY KEY (id),
UNIQUE KEY ux_review_tag (review_id, tag_id),
FOREIGN KEY (review_id) REFERENCES travel_project.reviews (id)
ON DELETE CASCADE
ON UPDATE CASCADE,
FOREIGN KEY (tag_id) REFERENCES travel_project.tags (id)
ON DELETE RESTRICT
ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- guide_reviews 테이블 (고객이 가이드를 직접 평가 - booking 연결)
CREATE TABLE travel_project.guide_reviews (
id INT NOT NULL AUTO_INCREMENT,
booking_id INT NOT NULL UNIQUE, -- 특정 예약 당 한 번의 가이드 리뷰
guide_id INT NOT NULL,
reviewer_id INT NOT NULL,
rating INT NOT NULL, -- 가이드 매너/서비스 평점 (1-5)
text TEXT NOT NULL,
created_at DATETIME NOT NULL,
PRIMARY KEY (id),
FOREIGN KEY (booking_id) REFERENCES travel_project.bookings (id)
ON DELETE RESTRICT
ON UPDATE CASCADE,
FOREIGN KEY (guide_id) REFERENCES travel_project.guide_profiles (users_id)
ON DELETE RESTRICT
ON UPDATE CASCADE,
FOREIGN KEY (reviewer_id) REFERENCES travel_project.users (id)
ON DELETE RESTRICT
ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- traveler_reviews 테이블 (가이드가 고객을 직접 평가 - booking 연결)
CREATE TABLE travel_project.traveler_reviews (
id INT NOT NULL AUTO_INCREMENT,
booking_id INT NOT NULL UNIQUE, -- 특정 예약 당 한 번의 고객 리뷰
guide_id INT NOT NULL,
traveler_id INT NOT NULL,
rating INT NOT NULL, -- 고객 매너 평점 (1-5)
text TEXT NOT NULL,
created_at DATETIME NOT NULL,
PRIMARY KEY (id),
FOREIGN KEY (booking_id) REFERENCES travel_project.bookings (id)
ON DELETE RESTRICT
ON UPDATE CASCADE,
FOREIGN KEY (guide_id) REFERENCES travel_project.guide_profiles (users_id)
ON DELETE RESTRICT
ON UPDATE CASCADE,
FOREIGN KEY (traveler_id) REFERENCES travel_project.users (id)
ON DELETE RESTRICT
ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
