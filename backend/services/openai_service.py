import os
from openai import OpenAI
from dotenv import load_dotenv
from schemas import ProductReviewExtraction # 스키마 적용

load_dotenv()
try:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    print(f"❗️ OpenAI Client Error: {e}")
    client = None

def extract_tags_from_text(review_text: str, content_title: str) -> list[str]:
    """
    [Track A] 상품 리뷰에서 태그를 구조화하여 추출하고, 리스트로 병합하여 반환합니다.
    """
    if not client or not review_text:
        return []

    system_prompt = """
    당신은 여행 리뷰 태그 추출 전문가입니다.
    입력된 [컨텐츠 제목]과 [리뷰 내용]을 분석하여, 검색에 유용한 핵심 키워드를 카테고리별로 추출하세요.
    없는 카테고리는 빈 리스트로 남겨두세요.
    """
    
    try:
        # [핵심 변경] parse 사용 (Structured Outputs)
        completion = client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06", # gpt-4o-mini 사용 가능
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"[컨텐츠 제목]: {content_title}\n[리뷰]: {review_text}"}
            ],
            response_format=ProductReviewExtraction, 
        )

        result = completion.choices[0].message.parsed
        
        # 3가지 카테고리 결과를 하나의 리스트로 합치기 (중복 제거)
        all_tags = set(result.locations + result.activities + result.foods_objects)
        return list(all_tags)

    except Exception as e:
        print(f"❗️ OpenAI (Product) Error: {e}")
        return []