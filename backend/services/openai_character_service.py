import os
from openai import OpenAI
from dotenv import load_dotenv
from typing import List, Optional

# .env 파일에서 환경변수 로드
load_dotenv()

try:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except TypeError:
    print("❗️ OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.")
    client = None

# ================================================================
# AI #1: 태그 추출기 (Extractor)
# ================================================================
def extract_character_tags(review_text: str, allowed_tags: List[str]) -> List[str]:
    """
    [리뷰 텍스트]에서 [허용된 태그 리스트]에 존재하는 키워드만 추출합니다.
    """
    if not client or not review_text or not allowed_tags:
        return []

    system_prompt = """
    당신은 여행 리뷰에서 '인물'의 성격과 행동을 묘사하는 핵심 키워드만을 추출하는 AI입니다.
    
    당신은 [허용된 태그 리스트]와 [리뷰 텍스트]를 받게 됩니다.
    [리뷰 텍스트]의 내용과 문맥을 분석하여, [허용된 태그 리스트]에 '정확히 일치하는' 키워드만 모두 찾아내야 합니다.
    
    규칙:
    1. 오직 [허용된 태그 리스트]에 존재하는 단어만 반환해야 합니다.
    2. 리뷰에 언급되지 않았거나, 리스트에 없는 단어는 절대 반환하지 마세요.
    3. 결과는 쉼표(,)로 구분된 목록(string)으로 반환하세요.
    4. 다른 설명, 인사, 사과, "추출된 태그 없음" 등의 텍스트를 절대 포함하지 마세요.
    5. 추출할 키워드가 없으면, '아무것도 반환하지 말고' 빈 문자열을 반환합니다.
    
    예시 출력: 'TMI, 친절함, 다정함'
    """
    
    user_content = f"""
    [허용된 태그 리스트]
    {', '.join(allowed_tags)}

    [리뷰 텍스트]
    {review_text}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # (또는 gpt-4o-mini 등)
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.0, # 정확한 추출을 위해 0
            max_tokens=100
        )
        content = response.choices[0].message.content
        
        if not content:
            return []
            
        # 후처리: 쉼표로 분리하고 공백 제거
        extracted_tags = [tag.strip() for tag in content.split(',') if tag.strip()]
        
        # (방어 코드) 혹시 AI가 리스트에 없는 단어를 지어냈다면 필터링
        final_tags = [tag for tag in extracted_tags if tag in allowed_tags]
        
        return final_tags
        
    except Exception as e:
        print(f"❗️ OpenAI (extract_character_tags) API 호출 중 오류 발생: {e}")
        return []

# ================================================================
# AI #2: 캐릭터 분류기 (Classifier - RAG)
# ================================================================
def classify_character_rag(extracted_tags: List[str], character_rule_prompt: str) -> Optional[int]:
    """
    RAG(규칙서)를 바탕으로, 추출된 태그 목록에 가장 적합한 캐릭터 ID 1개를 반환합니다.
    """
    if not client or not extracted_tags or not character_rule_prompt:
        return None

    system_prompt = """
    당신은 태그 목록을 보고 '캐릭터'를 분류하는 AI입니다.
    
    당신은 [캐릭터 규칙서]와 [추출된 태그 목록]을 받게 됩니다.
    
    [캐릭터 규칙서]는 9개 캐릭터의 ID, 설명(Description), 관련 태그를 정의합니다.
    '설명'은 캐릭터의 의미와 문맥을, '관련 태그'는 핵심 키워드를 나타냅니다.
    
    [추출된 태그 목록]은 실제 리뷰에서 발견된 증거입니다.
    
    당신의 임무:
    1. [캐릭터 규칙서]의 '설명'과 '관련 태그'를 모두 참고하여,
    2. [추출된 태그 목록]과 가장 연관성이 높고 가장 잘 어울리는 '캐릭터 ID' 1개만을 선정해야 합니다.
    3. 당신의 응답은 '오직' 숫자로 된 [캐릭터 ID]여야 합니다.
    
    규칙:
    - 절대 다른 설명, 인사, 사과, "가장 적합한 캐릭터는..." 등의 텍스트를 포함하지 마세요.
    - 오직 숫자 ID만 반환하세요.
    
    예시 응답: 1
    예시 응답: 7
    """
    
    user_content = f"""
    [캐릭터 규칙서]
    {character_rule_prompt}

    [추출된 태그 목록]
    {', '.join(extracted_tags)}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # (분류 작업은 gpt-4급의 추론 능력이 권장됩니다)
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.1,
            max_tokens=10 # ID만 받으므로 토큰을 낮게 설정
        )
        content = response.choices[0].message.content
        
        # 후처리: AI가 반환한 ID(문자열)를 숫자(int)로 변환
        try:
            classified_id = int(content.strip())
            return classified_id
        except ValueError:
            print(f"❗️ OpenAI (classify_character_rag)가 ID 숫자를 반환하지 않음: {content}")
            return None
            
    except Exception as e:
        print(f"❗️ OpenAI (classify_character_rag) API 호출 중 오류 발생: {e}")
        return None