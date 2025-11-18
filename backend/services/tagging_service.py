from sqlalchemy.orm import Session, joinedload
from models import Review, ReviewTag, Tag, Booking, Content

def fetch_reviews_without_tags(db: Session) -> list[Review]:
    """AI 태그가 아직 없는 리뷰 목록을 (관련 컨텐츠와 함께) 가져옵니다."""
    print("Fetching reviews (and their content titles) without AI tags...")
    
    # ReviewTag 테이블에 ID가 없는 Review를 찾습니다. (LEFT JOIN)
    # 이미 is_ai_extracted=True 플래그가 있는 ReviewTag 모델을 사용합니다.
    reviews_to_tag = db.query(Review).outerjoin(
        ReviewTag, (Review.id == ReviewTag.review_id) & (ReviewTag.is_ai_extracted == True)
    ).filter(
        ReviewTag.id == None # IS NULL
    ).options(
        # --- ▼  N+1 방지를 위해 Eager Loading ▼ ---
        # Review -> Booking -> Content 관계를 미리 로드
        joinedload(Review.booking).joinedload(Booking.content)
        
    ).all()
    
    return reviews_to_tag

def save_tags_for_review(db: Session, review_id: int, tag_names: list[str]):
    """
    추출된 태그 문자열 목록을 'Tag'(마스터)와 'ReviewTag'(연결) 테이블에 저장합니다.
    """
    if not tag_names:
        return

    # 1. DB에서 기존 태그 이름 조회
    existing_tags = db.query(Tag).filter(Tag.name.in_(tag_names)).all()
    existing_tags_map = {tag.name: tag for tag in existing_tags}
    
    new_review_tags = []

    for name in tag_names:
        tag_obj = existing_tags_map.get(name)
        
        # 2. 새 태그인 경우, 'Tag' 마스터 테이블에 생성
        if not tag_obj:
            print(f" - New tag found: '{name}'. Creating in master Tag table...")
            # 'Tag' 모델에 맞게 tag_type 지정
            tag_obj = Tag(name=name, tag_type="AI_Extracted") 
            db.add(tag_obj)
            # 새 tag_obj의 ID를 즉시 사용하기 위해 flush
            try:
                db.flush() 
            except Exception as e:
                print(f" - Warning: Could not create tag '{name}' (maybe unique constraint?). Rolling back flush. {e}")
                db.rollback() # 방금 add한 tag_obj 롤백
                # 이미 다른 세션에서 생성되었을 수 있으므로 다시 조회
                tag_obj = db.query(Tag).filter(Tag.name == name).first()
                if not tag_obj:
                    print(f" - Error: Failed to create or find tag '{name}'. Skipping.")
                    continue
        
        # 3. 'ReviewTag' 연결 테이블에 추가 (is_ai_extracted=True)
        new_link = ReviewTag(
            review_id=review_id,
            tag_id=tag_obj.id,
            is_ai_extracted=True 
        )
        new_review_tags.append(new_link)
    
    if new_review_tags:
        db.add_all(new_review_tags)