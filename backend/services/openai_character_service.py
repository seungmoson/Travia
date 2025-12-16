import os
from typing import Optional
from openai import OpenAI
from dotenv import load_dotenv
from schemas import CharacterAnalysisResult # 스키마 적용

load_dotenv()
try:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    print(f"❗️ OpenAI Client Error: {e}")
    client = None

def analyze_review_for_character(review_text: str, character_rules_text: str) -> Optional[CharacterAnalysisResult]:
    """
    [Track B] 리뷰와 규칙서를 받아, '키워드 추출'과 '캐릭터 분류'를 동시에 수행합니다.
    """
    if not client or not review_text:
        return None

    system_prompt = f"""
    당신은 유저의 리뷰를 분석하여 '여행자 페르소나(NBTI)'를 매칭하는 AI입니다.
    
    [캐릭터 분류 규칙]
    {character_rules_text}
    
    위 규칙을 바탕으로 리뷰를 분석하여 결과를 구조화된 데이터로 반환하세요.
    """

    try:
        completion = client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06", # gpt-4o-mini 사용 가능
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"[리뷰 텍스트]: {review_text}"}
            ],
            response_format=CharacterAnalysisResult, 
        )

        return completion.choices[0].message.parsed

    except Exception as e:
        print(f"❗️ OpenAI (Character) Error: {e}")
        return None