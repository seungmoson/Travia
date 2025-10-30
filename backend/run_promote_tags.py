# backend/run_promote_tags.py (강화된 버전)

import sys
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
# --- [수정됨] 1. 'not_', 'func.length' 필터를 위해 추가 ---
from sqlalchemy import func, desc, not_

# 1. 환경 변수 및 경로 설정 (run_ai_tagging.py와 동일)
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
load_dotenv() 

# 2. DB 모델 및 세션 임포트
from database import SessionLocal
from models import ReviewTag, Tag, ContentTag, Review, Booking, Content

# 3. 각 상품(Content)별로 승격시킬 상위 태그 개수
TOP_N_TAGS = 5 

# --- [신규 추가] 4. 승격에서 제외할 '쓰레기 태그' 목록 ---
# (SQL의 LIKE 연산자를 사용하기 위해 % 와일드카드 사용)
GARBAGE_SUBSTRINGS_FOR_SQL = [
    '%반환%', '%추출%', '%없음%', '%키워드%', '%해당%', '%태그%', 
    '%장소%', '%지역%', '%음식%', '%물건%', '%활동%', '%경험%', 
    '%역사와%', '%식도락%', '%아무것도%', '-'
]
# 승격시킬 최대 태그 글자 수 (이보다 길면 문장으로 간주)
MAX_TAG_LENGTH = 15
# -----------------------------------------------

def main():
    """
    'review_tags'에 쌓인 AI 태그를 집계하여,
    가장 많이 언급된 태그를 'content_tags'로 승격시킵니다.
    """
    print("--- 1. AI Tag Promotion Process Start ---")
    db = SessionLocal()
    
    try:
        # 2. 기존에 '승격'되었던 AI 태그를 모두 삭제
        print(f"--- 2. Clearing old AI-promoted tags from 'content_tags'...")
        deleted_count = db.query(ContentTag).filter(
            ContentTag.is_ai_extracted == True
        ).delete(synchronize_session=False)
        db.commit()
        print(f"   ✅ Cleared {deleted_count} old AI tags.")

        # 3. 'review_tags' -> ... -> 'contents'를 JOIN하여 집계
        print(f"--- 3. Aggregating new AI tags from 'review_tags' (filtering garbage/long tags)...")
        
        # --- [수정됨] 3-1. 쓰레기 태그 + '긴 문장' 필터 조건 생성 ---
        filters = [ReviewTag.is_ai_extracted == True] # 기본 필터
        
        # 쓰레기 단어 포함 필터
        for sub in GARBAGE_SUBSTRINGS_FOR_SQL:
            filters.append(not_(Tag.name.like(sub)))
            
        # 문장 길이 필터 (예: 15자 초과 시 제외)
        filters.append(func.length(Tag.name) < MAX_TAG_LENGTH)
        # -----------------------------------------------

        aggregated_tags = db.query(
            Content.id.label('content_id'),
            Tag.id.label('tag_id'),
            Tag.name.label('tag_name'),
            func.count(ReviewTag.id).label('tag_count')
        ).join(
            Booking, Content.id == Booking.content_id
        ).join(
            Review, Booking.id == Review.booking_id
        ).join(
            ReviewTag, Review.id == ReviewTag.review_id
        ).join(
            Tag, ReviewTag.tag_id == Tag.id
        ).filter(
            *filters # [수정됨] 강화된 필터 리스트 적용
        ).group_by(
            Content.id, Tag.id, Tag.name
        ).order_by(
            Content.id, desc('tag_count') # 상품별로, 많이 언급된 순으로 정렬
        ).all()

        if not aggregated_tags:
            print("   ℹ️ No clean AI tags found in 'review_tags' to promote. Process finished.")
            return

        print(f"   ✅ Found {len(aggregated_tags)} unique tag aggregates (after filtering).")

        # 4. 집계된 태그를 'content_tags' 테이블로 승격 (상위 TOP_N_TAGS개만)
        print(f"--- 4. Promoting Top {TOP_N_TAGS} tags per content to 'content_tags'...")
        
        current_content_id = None
        tag_rank_for_content = 0
        new_content_tags_list = []

        for row in aggregated_tags:
            # 상품 ID가 바뀌었는지 체크
            if row.content_id != current_content_id:
                current_content_id = row.content_id
                tag_rank_for_content = 0 

            # 해당 상품의 상위 N개 태그만 승격
            if tag_rank_for_content < TOP_N_TAGS:
                print(f"  - Promoting tag '{row.tag_name}' ({row.tag_count} votes) to Content ID {row.content_id}")
                
                # ContentTag 객체 생성
                new_tag_link = ContentTag(
                    contents_id=row.content_id,
                    tag_id=row.tag_id,
                    is_ai_extracted=True # 이 태그는 AI가 승격시킨 태그임을 표시
                )
                new_content_tags_list.append(new_tag_link)
                tag_rank_for_content += 1

        # 5. 승격된 태그들을 DB에 일괄 저장
        if new_content_tags_list:
            db.add_all(new_content_tags_list)
            db.commit()
            print(f"\n🎉 Successfully promoted {len(new_content_tags_list)} tags to 'content_tags' table!")
        else:
            print("\n   ℹ️ No new tags were added to 'content_tags'.")

    except Exception as e:
        print(f"\n❗️ An error occurred: {e}")
        db.rollback()
        print("--- Process rolled back ---")
    finally:
        db.close()
        print("--- Database session closed ---")

if __name__ == "__main__":
    main()