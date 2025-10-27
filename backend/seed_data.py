# app/seed_data.py (models.py의 Booking-Review 관계 반영)

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import bcrypt 
import random 
# 💡 Booking 모델을 import 리스트에 추가합니다.
from models import User, GuideProfile, Content, ContentImage, Tag, ContentTag, Review, Booking

# 🚨 실행 환경에 bcrypt 라이브러리 설치가 필요합니다: pip install bcrypt

# 💡 React의 'public' 폴더에 있는 이미지 파일 목록 (루트 경로로 저장)
LOCAL_IMAGES = [
    '/beach.png',
    '/food.png',
    '/hanok.png',
    '/hiking.png',
    '/sunset.png',
    '/traditional.png'
]

def create_seed_data(db: Session):
    """
    초기 사용자, 가이드 프로필, 콘텐츠 및 태그 데이터를 데이터베이스에 주입합니다.
    (수정: Booking -> Review 순서로 생성)
    """
    print("Seeding initial data...")
    
    # --- 0. 기존 데이터 삭제 (Booking 추가) ---
    print("Deleting old data...")
    db.query(ContentTag).delete()
    db.query(Review).delete()
    db.query(Booking).delete() # 💡 Booking 삭제 추가
    db.query(ContentImage).delete()
    db.query(Content).delete()
    db.query(Tag).delete()
    db.query(GuideProfile).delete()
    db.query(User).delete()
    db.commit() # 삭제 커밋

    # --- 1. User & Guide Profiles ---
    print("Creating users and guides...")
    
    # 공통 비밀번호 해싱
    raw_password = "testpass123"
    hashed_password = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # 1-1. Traveler Users
    traveler1 = User(email="traveler@travia.com", nickname="ExploringKim", password=hashed_password, user_type="traveler")
    traveler2 = User(email="traveler2@travia.com", nickname="VoyageJoy", password=hashed_password, user_type="traveler")
    traveler3 = User(email="traveler3@travia.com", nickname="MinSu", password=hashed_password, user_type="traveler")
    db.add_all([traveler1, traveler2, traveler3])
    db.flush() 

    # 1-2. Guide Users & Profiles
    guide1_seo = User(email="guide1_seoul@travia.com", nickname="SeoulInsider", password=hashed_password, user_type="guide")
    guide2_bus = User(email="guide2_busan@travia.com", nickname="BusanOceanExpert", password=hashed_password, user_type="guide")
    guide3_jej = User(email="guide3_jeju@travia.com", nickname="JejuWind", password=hashed_password, user_type="guide")
    db.add_all([guide1_seo, guide2_bus, guide3_jej])
    db.flush()
    
    db.add(GuideProfile(users_id=guide1_seo.id, bio="5년 경력의 서울 전문 가이드.", avg_rating=4.8, license_status="Licensed", manner_score=100))
    db.add(GuideProfile(users_id=guide2_bus.id, bio="해운대부터 감천문화마을까지 안내합니다.", avg_rating=4.5, license_status="Licensed", manner_score=100))
    db.add(GuideProfile(users_id=guide3_jej.id, bio="한라산과 오름, 제주의 자연을 사랑하는 가이드입니다.", avg_rating=4.7, license_status="Pending", manner_score=100))
    db.flush()

    # --- 2. Tags ---
    print("Creating tags...")
    tag_list = [
        Tag(name="야경", tag_type="Activity"), Tag(name="역사", tag_type="Activity"),
        Tag(name="사진촬영", tag_type="Activity"), Tag(name="해변", tag_type="Activity"),
        Tag(name="등산", tag_type="Activity"), Tag(name="맛집", tag_type="Activity"),
        Tag(name="서울여행", tag_type="Location"), Tag(name="부산여행", tag_type="Location"),
        Tag(name="제주여행", tag_type="Location")
    ]
    db.add_all(tag_list)
    db.commit() # 태그 ID 생성을 위해 커밋

    # --- 3. Content, Images, Bookings, Reviews, ContentTags (동적 생성) ---
    print("Creating contents, images, bookings, reviews, and tags...")

    guides = [
        {"user": guide1_seo, "location": "SEO", "tag_name": "서울여행"},
        {"user": guide2_bus, "location": "BUS", "tag_name": "부산여행"},
        {"user": guide3_jej, "location": "JEJ", "tag_name": "제주여행"}
    ]
    all_users = [traveler1, traveler2, traveler3, guide1_seo, guide2_bus, guide3_jej]
    all_tags = db.query(Tag).all()
    
    content_titles = [
        "필수 코스! 시그니처 투어", "현지인만 아는 숨겨진 맛집 탐방",
        "감성 폭발! 인생샷 스냅 투어", "핵심 정복! 반나절 시티 투어",
        "자연과 함께하는 힐링 워킹 투어"
    ]
    
    total_contents = 0
    total_reviews = 0

    try:
        for guide_info in guides:
            guide_user = guide_info["user"]
            location_tag = db.query(Tag).filter_by(name=guide_info["tag_name"]).first()
            
            for i in range(5): # 💡 가이드당 5개의 콘텐츠 생성
                # 3-1. Content 생성
                new_content = Content(
                    guide_id=guide_user.id,
                    title=f"[{guide_info['location']}] {guide_user.nickname}의 {content_titles[i]}",
                    description=f"{guide_info['location']}의 {content_titles[i]}입니다. 잊을 수 없는 경험을 선사합니다.",
                    price=random.randint(3, 10) * 10000,
                    location=guide_info["location"],
                    status="Active",
                    created_at=datetime.now() - timedelta(days=random.randint(1, 30))
                )
                db.add(new_content)
                db.flush() # content.id를 얻기 위해 flush
                total_contents += 1
                
                # 3-2. ContentImage 생성 (models.py: contents_id)
                main_image = ContentImage(
                    contents_id=new_content.id,
                    image_url=random.choice(LOCAL_IMAGES), 
                    sort_order=1,
                    is_main=True
                )
                db.add(main_image)
                
                # 3-3. ContentTag 생성 (models.py: contents_id)
                db.add(ContentTag(contents_id=new_content.id, tag_id=location_tag.id, is_ai_extracted=False))
                random_activity_tag = random.choice([t for t in all_tags if t.tag_type == 'Activity'])
                db.add(ContentTag(contents_id=new_content.id, tag_id=random_activity_tag.id, is_ai_extracted=False))

                # 3-4. Booking 및 Review 생성
                for _ in range(8): # 💡 콘텐츠당 8개의 "완료된 예약 & 리뷰" 생성
                    random_user = random.choice(all_users) # 리뷰 작성자
                    
                    # (1) 가짜 '완료된' Booking 생성 (models.py: traveler_id, content_id)
                    new_booking = Booking(
                        traveler_id=random_user.id,
                        content_id=new_content.id, # 
                        booking_date=datetime.now() - timedelta(days=random.randint(1, 10)),
                        status="Completed" # 💡 리뷰를 쓰려면 'Completed' 상태여야 함
                    )
                    db.add(new_booking)
                    db.flush() # booking.id를 얻기 위해 flush
                    
                    # (2) Booking에 연결된 Review 생성 (models.py: booking_id, reviewer_id)
                    new_review = Review(
                        booking_id=new_booking.id,
                        reviewer_id=random_user.id,
                        rating=random.randint(3, 5),
                        text=f"정말 {random.choice(['즐거운', '유익한', '멋진'])} 투어였습니다! {random.choice(['추천합니다.', '최고예요!'])}",
                        created_at=datetime.now() - timedelta(days=random.randint(0, 1))
                    )
                    db.add(new_review)
                    total_reviews += 1

        db.commit()
        print(f"Seeding complete: {len(all_users)} users, {len(guides)} guides, {total_contents} contents, {total_reviews} reviews created.")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback() # 오류 발생 시 롤백
    finally:
        db.close()