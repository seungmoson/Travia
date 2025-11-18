import sys
import os
from dotenv import load_dotenv

# 'backend' 폴더를 sys.path에 추가
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# 다른 모든 임포트 *전에* .env 파일 로드
load_dotenv() 

# .env가 로드되었으니, 다른 모듈을 임포트
from database import SessionLocal
from services.openai_service import extract_tags_from_text
from services.tagging_service import fetch_reviews_without_tags, save_tags_for_review

def main():
    """AI 태그 추출 일괄 처리 스크립트"""
    print("--- 1. AI Tagging Batch Process Start ---")
    
    # DB 세션 생성
    db = SessionLocal() 
    
    try:
        # 2. 태그가 없는 리뷰 가져오기 (Content가 joinedload된 버전)
        reviews = fetch_reviews_without_tags(db)
        if not reviews:
            print("ℹ️ No new reviews to tag. Process finished.")
            return
        
        print(f"✅ Found {len(reviews)} reviews to tag.")

        # 3. 각 리뷰에 대해 태그 추출 및 저장
        for i, review in enumerate(reviews):
            print(f"\n--- Processing review #{review.id} ({i+1}/{len(reviews)}) ---")
            
            # --- ▼  컨텐츠 제목 가져오기 ▼ ---
            review_text = review.text
            
            content_title = "" # 기본값
            # (tagging_service에서 joinedload를 했으므로 N+1 쿼리 문제 없음)
            if review.booking and review.booking.content:
                content_title = review.booking.content.title
                print(f"   Review Text: {review_text[:30]}...") 
                print(f"   Context Title: {content_title[:30]}...")
            else:
                # 컨텐츠 정보가 없는 리뷰(예: 탈퇴한 가이드)도 태그 추출은 시도
                print(f"   Review Text: {review_text[:50]}...")
                print(f"   ⚠️ Warning: Could not find Content Title for this review.")
            # --- ▼  AI 호출 시 두 인자 전달 ▼ ---
            tags = extract_tags_from_text(review_text, content_title)

            if tags:
                print(f"   ✨ Extracted Tags: {', '.join(tags)}")
                # DB에 태그 저장
                save_tags_for_review(db, review.id, tags)
                print(f"   💾 Tags queued for saving.")
            else:
                print("   ⚠️ No tags extracted for this review.")
                # --- ▼  '태그 없음'도 저장하여 중복 처리 방지 ▼ ---
                # (이 태그는 run_promote_tags.py의 GARBAGE_SUBSTRINGS_FOR_SQL에 추가해야 함)
                special_tag = ["AI_PROCESSED_NO_TAGS"]
                save_tags_for_review(db, review.id, special_tag)
                print(f"   💾 Saved a 'no-tag' marker to prevent re-processing.")
                
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