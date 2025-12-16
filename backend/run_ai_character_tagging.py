import sys
import os
from dotenv import load_dotenv

# 'backend' 폴더를 sys.path에 추가
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
load_dotenv() 

from database import SessionLocal

# [수정] 통합된 One-Shot 서비스 임포트
from services.openai_character_service import analyze_review_for_character
from services.character_tagging_service import (
    fetch_reviews_without_character, 
    get_all_character_rules, 
    save_tags_and_character
)

def main():
    """AI 캐릭터 태그 추출 및 분류 (One-Shot) 일괄 처리"""
    print("--- 1. AI Character Tagging Batch Process Start ---")
    
    db = SessionLocal() 
    
    try:
        # 2. 대상 리뷰 조회
        reviews_to_process = fetch_reviews_without_character(db)
        if not reviews_to_process:
            print("ℹ️ No new person-reviews to tag. Process finished.")
            return
        
        print(f"✅ Found {len(reviews_to_process)} person-reviews to process.")

        # 3. 규칙서 로드
        print("...Loading AI Character Rules...")
        _, character_rule_prompt = get_all_character_rules(db)
        
        if not character_rule_prompt:
            print("❗️ CRITICAL ERROR: Could not load AI character rules.")
            return

        # 4. 각 리뷰에 대해 One-Shot 분석 수행
        for i, review in enumerate(reviews_to_process):
            print(f"\n--- Processing review #{review.id} ({i+1}/{len(reviews_to_process)}) ---")
            print(f"   Review: {review.text[:30]}...") 

            # [핵심 변경] analyze_review_for_character 호출 (한 번에 끝냄)
            result = analyze_review_for_character(review.text, character_rule_prompt)

            if not result:
                print("   ⚠️ AI Analysis failed. Skipping.")
                continue

            print(f"   ✨ Classified: ID {result.character_id} / Keywords: {result.extracted_keywords}")
            print(f"   🤔 Reasoning: {result.chain_of_thought[:50]}...")

            # DB 저장 (reasoning 포함)
            save_tags_and_character(
                db=db, 
                review=review, 
                tag_names=result.extracted_keywords, 
                character_id=result.character_id,
                ai_reasoning=result.chain_of_thought
            )
            print(f"   💾 Saved.")

        # 5. 커밋
        print("\n--- Committing all changes ---")
        db.commit()
        print("🎉 Batch Process Completed!")

    except Exception as e:
        import traceback
        print(f"\n❗️ An error occurred: {e}")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()