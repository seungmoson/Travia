from sqlalchemy.orm import Session, joinedload, subqueryload
from typing import List, Tuple, Dict, Union

from models import (
    GuideReview, TravelerReview, AiCharacter, AiCharacterDefinitionTag, 
    Tag, GuideReviewTag, TravelerReviewTag
)

def fetch_reviews_without_character(db: Session) -> List[Union[GuideReview, TravelerReview]]:
    """AI 캐릭터 분류가 아직 안 된 리뷰 목록을 가져옵니다."""
    print("Fetching ONLY GUIDE reviews without AI character ID...")
    guide_reviews = db.query(GuideReview).filter(GuideReview.ai_character_id == None).all()
    # traveler_reviews = db.query(TravelerReview).filter(TravelerReview.ai_character_id == None).all()
    return guide_reviews # + traveler_reviews

def get_all_character_rules(db: Session) -> Tuple[List[str], str]:
    """AI에게 건네줄 규칙서(Prompt)를 DB에서 생성합니다."""
    all_characters = db.query(AiCharacter).options(
        joinedload(AiCharacter.definition_tags).subqueryload(AiCharacterDefinitionTag.tag)
    ).all()
    
    if not all_characters:
        return [], ""

    character_rule_prompt = "" 
    all_unique_tag_names = set()

    for char in all_characters:
        character_rule_prompt += f"[캐릭터 ID: {char.id}] {char.name}\n"
        character_rule_prompt += f"- 설명: {char.description}\n"
        tag_names = [dt.tag.name for dt in char.definition_tags if dt.tag]
        
        if tag_names:
            character_rule_prompt += f"- 관련 태그: {', '.join(tag_names)}\n\n"
            all_unique_tag_names.update(tag_names)
        else:
            character_rule_prompt += "- 관련 태그: (없음)\n\n"

    return list(all_unique_tag_names), character_rule_prompt

def save_tags_and_character(
    db: Session, 
    review: Union[GuideReview, TravelerReview], 
    tag_names: List[str], 
    character_id: int,
    ai_reasoning: str = None # [신규] 추론 근거
):
    """결과(태그, 캐릭터ID, 추론근거)를 DB에 저장합니다."""
    if not tag_names:
        return 

    # 1. 태그 저장
    existing_tags = db.query(Tag).filter(Tag.name.in_(tag_names)).all()
    existing_tags_map = {tag.name: tag for tag in existing_tags}
    
    new_tags_to_create = []
    for name in tag_names:
        if name not in existing_tags_map:
            new_tag = Tag(name=name, tag_type="AI_Character_Keyword") 
            db.add(new_tag)
            new_tags_to_create.append(new_tag)

    if new_tags_to_create:
        try:
            db.flush()
            for tag in new_tags_to_create:
                existing_tags_map[tag.name] = tag
        except Exception as e:
            print(f" - Warning: Tag creation failed. {e}")
            db.rollback()
            existing_tags = db.query(Tag).filter(Tag.name.in_(tag_names)).all()
            existing_tags_map = {tag.name: tag for tag in existing_tags}

    # 2. 연결 테이블 저장
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
            if tag_obj:
                new_link = LinkTable(**{
                    link_column_name: review.id,
                    "tag_id": tag_obj.id
                })
                new_links.append(new_link)
        if new_links:
            db.add_all(new_links)

    # 3. 리뷰 업데이트 (ID + Reasoning)
    review.ai_character_id = character_id
    if hasattr(review, 'ai_reasoning'):
        review.ai_reasoning = ai_reasoning
        
    db.add(review)