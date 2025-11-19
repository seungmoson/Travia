from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import AiCharacter, Tag, AiCharacterDefinitionTag

router = APIRouter(
    prefix="/characters",
    tags=["Characters"]
)

@router.get("", summary="여행 캐릭터(스타일) 목록 조회")
def get_characters(db: Session = Depends(get_db)):
    """
    AiCharacter 테이블의 모든 캐릭터 정보와
    관련된 정의 태그(AiCharacterDefinitionTag)를 조인하여 반환합니다.
    """
    try:
        characters = db.query(AiCharacter).all()
        
        response_data = []
        for char in characters:
            # 해당 캐릭터와 매핑된 태그 이름 조회
            tags = db.query(Tag.name)\
                     .join(AiCharacterDefinitionTag, AiCharacterDefinitionTag.tag_id == Tag.id)\
                     .filter(AiCharacterDefinitionTag.ai_character_id == char.id)\
                     .all()
            
            # [('힐링',), ('명상',)] -> ['힐링', '명상'] 변환
            tag_list = [t[0] for t in tags]

            response_data.append({
                "id": char.id,
                "name": char.name,
                "description": char.description,
                # ▼ [수정] 프론트엔드 변수명에 맞춰 키값을 'image_url'로 통일
                "image_url": char.image_url, 
                "relatedTags": tag_list
            })
            
        return response_data

    except Exception as e:
        print(f"Error fetching characters: {e}")
        return []