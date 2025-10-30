# backend/run_ai_tagging.py
import sys
import os
from dotenv import load_dotenv # 👈 [수정] 1. dotenv 임포트

# 2. 'backend' 폴더를 sys.path에 추가 (db_init.py와 동일)
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# 👈 [수정] 3. 다른 모든 임포트 *전에* .env 파일 로드
#    (이것이 빠지면 database.py와 openai_service.py가 실패합니다)
load_dotenv() 

# 4. 이제 .env가 로드되었으니, 다른 모듈을 임포트합니다.
from database import SessionLocal
from services.openai_service import extract_tags_from_text
from services.tagging_service import fetch_reviews_without_tags, save_tags_for_review

def main():
    """AI 태그 추출 일괄 처리 스크립트"""
    print("--- 1. AI Tagging Batch Process Start ---")
    
    # DB 세션 생성
    db = SessionLocal() 
    
    try:
        # 2. 태그가 없는 리뷰 가져오기 (Travia AI 버전)
        reviews = fetch_reviews_without_tags(db)
        if not reviews:
            print("ℹ️ No new reviews to tag. Process finished.")
            return
        
        print(f"✅ Found {len(reviews)} reviews to tag.")

        # 3. 각 리뷰에 대해 태그 추출 및 저장
        for i, review in enumerate(reviews):
            print(f"\n--- Processing review #{review.id} ({i+1}/{len(reviews)}) ---")
            print(f"   Content: {review.text[:50]}...") 
            
            # AI를 통해 태그 추출
            tags = extract_tags_from_text(review.text)
            
            if tags:
                print(f"   ✨ Extracted Tags: {', '.join(tags)}")
                # DB에 태그 저장
                save_tags_for_review(db, review.id, tags)
                print(f"   💾 Tags queued for saving.")
            else:
                print("   ⚠️ No tags extracted for this review.")

        # 4. 모든 작업 완료 후 일괄 커밋
        print("\n--- Committing all changes to the database ---")
        db.commit()
        print("🎉 AI Tagging Batch Process Successfully Completed!")

    except Exception as e:
        print(f"\n❗️ An error occurred: {e}")
        db.rollback()
        print("--- Process rolled back ---")
    finally:
        db.close()
        print("--- Database session closed ---")

if __name__ == "__main__":
    main()