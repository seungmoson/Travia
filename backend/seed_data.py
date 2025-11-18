# seed_data.py (최종 수정본 - lat/lng 읽기 로직 추가됨)

from sqlalchemy.orm import Session
from sqlalchemy import func 
from datetime import datetime, timedelta
import bcrypt
import random
from models import User, GuideProfile, Content, ContentImage, Tag, ContentTag, Review, Booking, GuideReview, ContentVideo

# (db_init.py와 같은 레벨에 있다고 가정)
from seed_definitions import (
    IMAGE_MAP,
    TRAVELER_DATA,
    GUIDE_DATA,
    SEED_CONTENTS_DATA
)

def create_seed_data(db: Session):
    print("--- [seed_data.py] Database Initializer (called by db_init.py) ---")
    
    # --- 0. 기존 데이터 삭제 ---
    print("  1. Attempting to delete existing data...")
    try:
        db.query(ContentTag).delete()
        db.query(GuideReview).delete() 
        db.query(Review).delete()      
        db.query(Booking).delete()     
        db.query(ContentImage).delete()
        db.query(ContentVideo).delete() 
        db.query(Content).delete()     
        db.query(Tag).delete()
        db.query(GuideProfile).delete()
        db.query(User).delete()
        db.commit()
        print("     ✅ Existing data deleted successfully.")
    except Exception as e:
        print(f"     ❌ Error deleting data: {e}")
        db.rollback()
        return

    # --- 1. User & Guide Profiles ---
    print("  2. Creating Users and Guide Profiles...")
    users = {} 
    try:
        raw_password = "testpass123"
        hashed_password = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        for email, nickname in TRAVELER_DATA:
            user = User(email=email, nickname=nickname, password=hashed_password, user_type="traveler")
            db.add(user)
            users[nickname] = user
        db.flush()

        for email, nickname, bio, loc in GUIDE_DATA:
            user = User(email=email, nickname=nickname, password=hashed_password, user_type="guide")
            db.add(user)
            db.flush()
            users[nickname] = user
            guide_profile = GuideProfile(
                users_id=user.id,
                bio=bio,
                license_status= "Licensed" if loc != "제주" else "Pending",
                avg_rating=0.0,
                manner_score=100
            )
            db.add(guide_profile)

        db.commit()
        print(f"     ✅ {len(users)} users ({len(TRAVELER_DATA)} travelers, {len(GUIDE_DATA)} guides) created.") 
    except Exception as e:
        print(f"     ❌ Error creating users/guides: {e}")
        db.rollback()
        return

    print("  3. Creating Tags... (Skipped)")
    
    # --- 3. Content, Images, Bookings, Reviews ---
    print("  4. Creating Contents, Images, Bookings, Reviews...")
    total_contents = 0
    total_bookings = 0
    total_reviews = 0
    total_guide_reviews = 0
    guide_ratings = {user_obj.id: [] for user_obj in users.values() if user_obj.user_type == 'guide'} 

    try:
        traveler_users_list = [u for u in users.values() if u.user_type == 'traveler'] 
        if not traveler_users_list:
             print("     ⚠️ No traveler users found to create reviews. Aborting content creation.")
             return

        for content_data in SEED_CONTENTS_DATA:
            guide_user = users.get(content_data["guide_key"]) 
            if not guide_user:
                print(f"     ⚠️ Warning: Guide user '{content_data['guide_key']}' not found. Skipping content '{content_data['title']}'.")
                continue

            # 3-1. Content 생성
            new_content = Content(
                guide_id=guide_user.id,
                title=content_data["title"],
                description=content_data["description"],
                price=random.randint(3, 10) * 10000,
                location=content_data["location"],
                
                # --- ▼  위도/경도 데이터 읽기 로직 추가 ▼ ---
                latitude=content_data.get("latitude"),
                longitude=content_data.get("longitude"),
                # --- ▲ ---

                status="Active",
                created_at=datetime.now() - timedelta(days=random.randint(1, 30))
            )
            db.add(new_content)
            db.flush()
            total_contents += 1

            # 3-2. ContentImage 생성
            image_path = IMAGE_MAP.get(content_data["image_key"], "/default.png") 
            db.add(ContentImage(contents_id=new_content.id, image_url=image_path, sort_order=1, is_main=True))

            # 3-4. Booking, Review, GuideReview 생성
            reviews_for_this_content = content_data.get("reviews", [])
            reviewers_for_this_content = random.choices(traveler_users_list, k=len(reviews_for_this_content)) 

            for i, (review_rating, review_text) in enumerate(reviews_for_this_content):
                reviewer = reviewers_for_this_content[i]

                new_booking = Booking(
                    traveler_id=reviewer.id,
                    content_id=new_content.id,
                    booking_date=datetime.now() - timedelta(days=random.randint(1, 10)),
                    personnel=random.randint(1, 4),
                    status="Completed"
                )
                db.add(new_booking)
                db.flush() 
                total_bookings += 1

                db.add(Review(
                    booking_id=new_booking.id,
                    reviewer_id=reviewer.id,
                    rating=review_rating,
                    text=review_text,
                    created_at=datetime.now() - timedelta(hours=random.randint(1, 24)) 
                ))
                total_reviews += 1

                guide_review_rating = review_rating 
                db.add(GuideReview(
                    booking_id=new_booking.id,
                    guide_id=guide_user.id,
                    reviewer_id=reviewer.id,
                    rating=guide_review_rating,
                    text=f"가이드님 덕분에 즐거운 시간이었습니다. ({random.choice(['친절해요', '설명이 좋아요', '시간을 잘 지켜요', '유머러스해요'])})",
                    created_at=datetime.now() - timedelta(hours=random.randint(1, 24))
                ))
                total_guide_reviews += 1
                guide_ratings[guide_user.id].append(guide_review_rating)

        db.commit()
        print(f"     ✅ {total_contents} contents, {total_bookings} bookings, {total_reviews} reviews, {total_guide_reviews} guide reviews created.")

        # --- 4. 가이드 평균 평점 업데이트 ---
        print("  5. Updating Guide Average Ratings...")
        updated_guides = 0
        for guide_id, ratings in guide_ratings.items():
            if ratings: 
                guide_profile_obj = db.query(GuideProfile).filter_by(users_id=guide_id).first()
                if guide_profile_obj:
                    new_avg = round(sum(ratings) / len(ratings), 1)
                    guide_profile_obj.avg_rating = new_avg
                    updated_guides += 1
                    guide_nickname_for_log = next((nk for nk, u in users.items() if u.id == guide_id), f"ID:{guide_id}")
                    print(f"     - Guide '{guide_nickname_for_log}' avg_rating updated to {new_avg}")

        if updated_guides > 0:
            db.commit() 
            print(f"     ✅ {updated_guides} guide profiles updated.")
        else:
             print("     ✅ No guide ratings to update.")

    except Exception as e:
        import traceback 
        print(f"     ❌ Error during content/review creation or rating update: {e}")
        traceback.print_exc() 
        db.rollback()

if __name__ == "__main__":
    from database import SessionLocal
    db = SessionLocal()
    print("--- Warning: Running seed_data.py directly. Please use db_init.py ---")
    try:
        create_seed_data(db)
    finally:
        db.close()