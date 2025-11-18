import sys
import os
from dotenv import load_dotenv

# 'backend' 폴더를 sys.path에 추가
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# 다른 모든 임포트 *전에* .env 파일 로드
load_dotenv() 

# .env가 로드되었으니, 다른 모듈을 임포트
from database import SessionLocal

# --- '캐릭터' 전용 서비스 임포트 ---
from services.openai_character_service import (
    extract_character_tags, 
    classify_character_rag
)
from services.character_tagging_service import (
    fetch_reviews_without_character, 
    get_all_character_rules, 
    save_tags_and_character
)


def main():
    """AI 캐릭터 태그 추출 및 분류 일괄 처리 스크립트"""
    print("--- 1. AI Character Tagging Batch Process Start ---")
    
    # DB 세션 생성
    db = SessionLocal() 
    
    try:
        # --- 2. AI 분류가 필요한 리뷰 가져오기 ---
        reviews_to_process = fetch_reviews_without_character(db)
        if not reviews_to_process:
            print("ℹ️ No new person-reviews to tag. Process finished.")
            return
        
        print(f"✅ Found {len(reviews_to_process)} person-reviews to process.")

        # --- 3. AI가 참조할 'RAG 규칙서' DB에서 미리 로드 ---
        print("...Loading AI Character Rules (RAG Knowledge)...")
        allowed_tag_list, character_rule_prompt = get_all_character_rules(db)
        
        if not allowed_tag_list or not character_rule_prompt:
            print("❗️ CRITICAL ERROR: Could not load AI character rules from DB.")
            return
        print("✅ AI Rules Loaded.")

        # --- 4. 각 리뷰에 대해 AI 2단계 처리 ---
        for i, review in enumerate(reviews_to_process):
            
            # --- ▼ [수정] review.__tablename__ -> type(review).__name__ ▼ ---
            print(f"\n--- Processing review #{review.id} ({i+1}/{len(reviews_to_process)}) (Type: {type(review).__name__}) ---")
            # --- ▲ [수정] ▲ ---
            
            review_text = review.text
            print(f"   Review Text: {review_text[:30]}...") 

            # --- AI 1단계: 태그 추출 (Extractor) ---
            extracted_tags = extract_character_tags(review_text, allowed_tag_list)
            
            if not extracted_tags:
                print("   ⚠️ No character tags extracted. Skipping to next review.")
                # '처리 완료' 마커를 저장할 수도 있으나, 여기선 일단 생략
                continue

            print(f"   ✨ AI (1) Extracted Tags: {', '.join(extracted_tags)}")

            # --- AI 2단계: 캐릭터 분류 (Classifier - RAG) ---
            classified_character_id = classify_character_rag(extracted_tags, character_rule_prompt)

            if not classified_character_id:
                print("   ⚠️ AI (2) Could not classify character. Skipping save.")
                continue
                
            print(f"   ✨ AI (2) Classified Character ID: {classified_character_id}")

            # --- DB 저장 ---
            save_tags_and_character(
                db=db, 
                review=review, 
                tag_names=extracted_tags, 
                character_id=classified_character_id
            )
            print(f"   💾 Tags and Character ID queued for saving.")

        # 5. 모든 작업 완료 후 일괄 커밋
        print("\n--- Committing all changes to the database ---")
        db.commit()
        print("🎉 AI Character Tagging Batch Process Successfully Completed!")

    except Exception as e:
        import traceback # 오류 상세 추적을 위해
        print(f"\n❗️ An error occurred: {e}")
        traceback.print_exc() # [수정] 오류 스택 트레이스 출력
        db.rollback()
        print("--- Process rolled back ---")
    finally:
        db.close()
        print("--- Database session closed ---")

if __name__ == "__main__":
    main()