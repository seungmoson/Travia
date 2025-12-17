# backend/seed_data.py
from sqlalchemy.orm import Session
from sqlalchemy import func 
from datetime import datetime, timedelta
import bcrypt
import random

from models import (
    User, GuideProfile, Content, ContentImage, ContentVideo, 
    Tag, ContentTag, Review, Booking, 
    GuideReview, TravelerReview, 
    AiCharacter, AiCharacterDefinitionTag, GuideReviewTag, TravelerReviewTag)

from seed_definitions import (
    IMAGE_MAP,
    TRAVELER_DATA,
    GUIDE_DATA,
    SEED_CONTENTS_DATA)

from seed_ai_definitions import (
    SEED_AI_CHARACTERS_DATA,
    SEED_AI_TAG_DEFINITIONS,
    SEED_REALISTIC_GUIDE_REVIEWS,
    SEED_REALISTIC_TRAVELER_REVIEWS,
    CONTENT_PERSONA_MIX,
)

def _create_ai_rules(db: Session):
    print("    ... Seeding AI Character Rules ...")
    char_map = {}
    for char_data in SEED_AI_CHARACTERS_DATA:
        new_char = AiCharacter(
            name=char_data["name"],
            catchphrase=char_data["catchphrase"],
            description=char_data["description"],
            image_url=char_data["image_url"]
        )
        db.add(new_char)
        db.flush()
        char_map[char_data["name"]] = new_char
    print(f"       - {len(char_map)} AiCharacters created.")
    tag_map = {}
    total_definitions = 0
    for char_name, tag_names in SEED_AI_TAG_DEFINITIONS.items():
        ai_character = char_map.get(char_name)
        if not ai_character:
            continue
            
        for tag_name in tag_names:
            tag_obj = tag_map.get(tag_name)
            if not tag_obj:
                tag_obj = db.query(Tag).filter_by(name=tag_name).first()
                if not tag_obj:
                    tag_obj = Tag(name=tag_name, tag_type="AI_Character_Keyword")
                    db.add(tag_obj)
                    db.flush()
                tag_map[tag_name] = tag_obj
            
            new_definition = AiCharacterDefinitionTag(
                ai_character_id=ai_character.id,
                tag_id=tag_obj.id
            )
            db.add(new_definition)
            total_definitions += 1
            
    print(f"       - {len(tag_map)} unique AI Tags created in master Tag table.")
    print(f"       - {total_definitions} AiCharacterDefinitionTags (Rules) created.")


def create_seed_data(db: Session):
    print("--- [seed_data.py] Database Initializer (called by db_init.py) ---")
    print("  1. Attempting to delete existing data...")
    try:
        db.query(GuideReviewTag).delete()
        db.query(TravelerReviewTag).delete()
        db.query(AiCharacterDefinitionTag).delete()
        db.query(AiCharacter).delete()
        db.query(ContentTag).delete()
        db.query(GuideReview).delete()
        db.query(TravelerReview).delete()
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

    print("  3. Creating AI Character Rules...")
    try:
        _create_ai_rules(db)
        db.commit()
    except Exception as e:
        print(f"     ❌ Error creating AI rules: {e}")
        db.rollback()
        return

    print("  4. Creating Tags... (Skipped - Handled by AI rules)")
    print("  5. Creating Contents, Images, Bookings, Reviews...")
    total_contents = 0
    total_bookings = 0
    total_reviews = 0
    total_guide_reviews = 0
    total_traveler_reviews = 0 
    guide_ratings = {user_obj.id: [] for user_obj in users.values() if user_obj.user_type == 'guide'} 
    traveler_ratings = {user_obj.id: [] for user_obj in users.values() if user_obj.user_type == 'traveler'}

    try:
        traveler_users_list = [u for u in users.values() if u.user_type == 'traveler'] 
        if not traveler_users_list:
            print("     ⚠️ No traveler users found. Aborting content creation.")
            return

        for content_data in SEED_CONTENTS_DATA:
            guide_user = users.get(content_data["guide_key"]) 
            if not guide_user:
                print(f"     ⚠️ Warning: Guide user '{content_data['guide_key']}' not found. Skipping content '{content_data['title']}'.")
                continue

            new_content = Content(
                guide_id=guide_user.id,
                title=content_data["title"],
                description=content_data["description"],
                price=random.randint(3, 10) * 10000,
                location=content_data["location"],
                latitude=content_data.get("latitude"),
                longitude=content_data.get("longitude"),
                status="Active",
                created_at=datetime.now() - timedelta(days=random.randint(30, 60))
            )
            db.add(new_content)
            db.flush()
            total_contents += 1
            image_path = IMAGE_MAP.get(content_data["image_key"], "/default.png") 
            db.add(ContentImage(contents_id=new_content.id, image_url=image_path, sort_order=1, is_main=True))
            reviews_data = content_data.get("reviews", [])
            for i, (review_rating, review_text) in enumerate(reviews_data):
                reviewer = random.choice(traveler_users_list)
                new_booking = Booking(
                    traveler_id=reviewer.id,
                    content_id=new_content.id,
                    booking_date=datetime.now() - timedelta(days=random.randint(1, 30)),
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
                    created_at=datetime.now() - timedelta(hours=random.randint(1, 48))
                ))
                total_reviews += 1

                guide_review_rating = review_rating
                db.add(GuideReview(
                    booking_id=new_booking.id,
                    guide_id=guide_user.id,
                    reviewer_id=reviewer.id,
                    rating=guide_review_rating,
                    text=random.choice(SEED_REALISTIC_GUIDE_REVIEWS),
                    created_at=datetime.now() - timedelta(hours=random.randint(1, 48))
                ))
                total_guide_reviews += 1
                guide_ratings[guide_user.id].append(guide_review_rating)
                traveler_review_rating = random.choice([4, 5])
                db.add(TravelerReview(
                    booking_id=new_booking.id,
                    guide_id=guide_user.id,
                    traveler_id=reviewer.id,
                    rating=traveler_review_rating,
                    text=random.choice(SEED_REALISTIC_TRAVELER_REVIEWS),
                    created_at=datetime.now() - timedelta(hours=random.randint(1, 48))
                ))
                total_traveler_reviews += 1
                if reviewer.id in traveler_ratings:
                    traveler_ratings[reviewer.id].append(traveler_review_rating)

        db.commit()
        
    except Exception as e:
        import traceback 
        print(f"     ❌ Error during content/review creation loop: {e}")
        traceback.print_exc() 
        db.rollback()
        return 
    
    print(f"     ✅ {total_contents} contents, {total_bookings} bookings, {total_reviews} reviews created.")
    print(f"     ✅ {total_guide_reviews} GuideReviews (for AI processing) created.")
    print(f"     ✅ {total_traveler_reviews} TravelerReviews (for AI processing) created.")
    print("  6. Updating Guide/Traveler Ratings...")
    try:
        updated_guides = 0
        for guide_id, ratings in guide_ratings.items():
            if ratings: 
                guide_profile_obj = db.query(GuideProfile).filter_by(users_id=guide_id).first()
                if guide_profile_obj:
                    new_avg = round(sum(ratings) / len(ratings), 1)
                    guide_profile_obj.avg_rating = new_avg
                    updated_guides += 1
        
        if updated_guides > 0:
            db.commit() 
            print(f"     ✅ {updated_guides} guide profiles avg_rating updated.")
        else:
            print("     ✅ No guide ratings to update.")
            
    except Exception as e:
        import traceback 
        print(f"     ❌ Error during rating update: {e}")
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
