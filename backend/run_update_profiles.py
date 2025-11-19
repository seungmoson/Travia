# backend/run_update_profiles.py
import sys
import os

# 현재 디렉토리를 모듈 검색 경로에 추가 (backend 폴더 안에서 실행한다고 가정)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import func
from database import SessionLocal
from models import GuideProfile, GuideReview, AiCharacter

def update_guide_representative_character():
    """
    모든 가이드 프로필을 순회하며, 
    GuideReview에서 가장 많이 등장한 ai_character_id를 찾아
    GuideProfile.ai_character_id_as_guide 컬럼을 업데이트합니다.
    """
    db = SessionLocal()
    
    try:
        print("🔄 가이드 대표 캐릭터 업데이트 시작...")
        
        # 1. 모든 가이드 조회
        guides = db.query(GuideProfile).all()
        
        updated_count = 0
        
        for guide in guides:
            # 2. 해당 가이드의 리뷰 중 ai_character_id 별 개수 세기 (내림차순 정렬)
            # 예: [(1, 5개), (2, 3개)] -> ID 1번이 1등
            top_character = db.query(
                GuideReview.ai_character_id, 
                func.count(GuideReview.ai_character_id).label('count')
            ).filter(
                GuideReview.guide_id == guide.users_id,
                GuideReview.ai_character_id.isnot(None) # NULL 제외
            ).group_by(
                GuideReview.ai_character_id
            ).order_by(
                func.count(GuideReview.ai_character_id).desc()
            ).first()

            # 3. 1등 캐릭터가 있으면 프로필 업데이트
            if top_character:
                char_id = top_character.ai_character_id
                
                # 값이 다를 때만 업데이트 (DB 부하 감소)
                if guide.ai_character_id_as_guide != char_id:
                    guide.ai_character_id_as_guide = char_id
                    updated_count += 1
                    print(f" - 가이드(ID: {guide.users_id}) 업데이트 -> 캐릭터 ID: {char_id}")

        db.commit()
        print(f"✅ 업데이트 완료! (총 {updated_count}명의 가이드 정보 갱신)")
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_guide_representative_character()