from sqlalchemy.orm import Session, joinedload, subqueryload
from typing import List, Tuple, Dict, Union

# --- ▼ [신규] 모든 AI 캐릭터 관련 모델 임포트 ▼ ---
from models import (
    GuideReview, TravelerReview, AiCharacter, AiCharacterDefinitionTag, 
    Tag, GuideReviewTag, TravelerReviewTag
)
# --- ▲ [신규] ▲ ---


def fetch_reviews_without_character(db: Session) -> List[Union[GuideReview, TravelerReview]]:
    """AI 캐릭터 분류가 아직 안 된(ai_character_id가 NULL) 리뷰 목록을 가져옵니다."""
    print("Fetching reviews without AI character ID...")
    
    # 1. 가이드 리뷰 (여행자 -> 가이드)
    guide_reviews_to_tag = db.query(GuideReview).filter(
        GuideReview.ai_character_id == None
    ).all()
    
    # 2. 여행자 리뷰 (가이드 -> 여행자)
    traveler_reviews_to_tag = db.query(TravelerReview).filter(
        TravelerReview.ai_character_id == None
    ).all()
    
    return guide_reviews_to_tag + traveler_reviews_to_tag

def get_all_character_rules(db: Session) -> Tuple[List[str], str]:
    """AI가 사용할 'RAG 규칙서' 2종을 DB에서 생성합니다."""
    
    # 1. AI #2 (분류기)가 사용할 상세한 규칙서 (Description + Tags)
    # N+1 방지: AiCharacter -> AiCharacterDefinitionTag -> Tag 를 한번에 로드
    all_characters = db.query(AiCharacter).options(
        joinedload(AiCharacter.definition_tags).subqueryload(AiCharacterDefinitionTag.tag)
    ).all()
    
    if not all_characters:
        return [], ""

    character_rule_prompt = "" # AI #2에 전달할 프롬프트 문자열
    all_unique_tag_names = set() # AI #1에 전달할 태그 이름 리스트

    # DB에서 읽어온 9개 캐릭터 정보로 프롬프트와 태그 리스트 생성
    for char in all_characters:
        character_rule_prompt += f"[캐릭터 ID: {char.id}] {char.name}\n"
        character_rule_prompt += f"- 설명: {char.description}\n"
        
        # 이 캐릭터에 연결된 '정의 태그' 이름들을 수집
        tag_names = [dt.tag.name for dt in char.definition_tags if dt.tag]
        
        if tag_names:
            character_rule_prompt += f"- 관련 태그: {', '.join(tag_names)}\n\n"
            all_unique_tag_names.update(tag_names) # AI #1용 태그셋에 추가
        else:
            character_rule_prompt += "- 관련 태그: (없음)\n\n"

    # 2. AI #1 (추출기)가 사용할 '허용된 태그' 이름 목록
    allowed_tag_list = list(all_unique_tag_names)
    
    return allowed_tag_list, character_rule_prompt

def save_tags_and_character(
    db: Session, 
    review: Union[GuideReview, TravelerReview], 
    tag_names: List[str], 
    character_id: int
):
    """
    AI의 2가지 결과(추출된 태그, 분류된 캐릭터ID)를 DB에 저장합니다.
    """
    if not tag_names:
        return # 저장할 태그가 없음

    # 1. 태그 저장 (기존 tagging_service.py의 _get_or_create_tags와 유사)
    # -----------------------------------------------------------------
    existing_tags = db.query(Tag).filter(Tag.name.in_(tag_names)).all()
    existing_tags_map = {tag.name: tag for tag in existing_tags}
    
    new_tags_to_create = []
    
    for name in tag_names:
        if name not in existing_tags_map:
            # 새 태그. 'Tag' 마스터 테이블에 생성
            # (주의: 이 태그는 '상품' 태그와 다름)
            new_tag = Tag(name=name, tag_type="AI_Character_Keyword") 
            db.add(new_tag)
            new_tags_to_create.append(new_tag)

    # 새 태그가 있으면 flush하여 ID를 미리 받음
    if new_tags_to_create:
        try:
            db.flush()
            # flush된 새 태그들도 map에 추가
            for tag in new_tags_to_create:
                existing_tags_map[tag.name] = tag
        except Exception as e:
            print(f" - Warning: Could not create new tags (maybe unique constraint?). Rolling back flush. {e}")
            db.rollback() # flush 롤백
            # 롤백 후 다시 조회
            existing_tags = db.query(Tag).filter(Tag.name.in_(tag_names)).all()
            existing_tags_map = {tag.name: tag for tag in existing_tags}

    # 2. 리뷰 종류에 따라 올바른 '연결 테이블'에 태그 저장
    # -----------------------------------------------------------------
    new_links = []
    LinkTable = None
    link_column_name = None

    if isinstance(review, GuideReview):
        LinkTable = GuideReviewTag
        link_column_name = "guide_review_id"
    elif isinstance(review, TravelerReview):
        LinkTable = TravelerReviewTag
        link_column_name = "traveler_review_id"
    
    if LinkTable:
        for name in tag_names:
            tag_obj = existing_tags_map.get(name)
            if tag_obj: # 태그 생성/조회가 성공한 경우에만
                new_link = LinkTable(**{
                    link_column_name: review.id,
                    "tag_id": tag_obj.id
                })
                new_links.append(new_link)
        
        if new_links:
            db.add_all(new_links)

    # 3. '리뷰' 테이블 자체에 '최종 분류된 캐릭터 ID' 업데이트
    # -----------------------------------------------------------------
    review.ai_character_id = character_id
    db.add(review) # (SQLAlchemy가 UPDATE로 처리)