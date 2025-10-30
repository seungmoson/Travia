# backend/services/openai_service.py (강화된 버전)

import os
from openai import OpenAI
from dotenv import load_dotenv

# .env 파일에서 환경변수 로드
load_dotenv()

try:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except TypeError:
    print("❗️ OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.")
    client = None

def extract_tags_from_text(text: str) -> list:
    """주어진 텍스트에서 AI를 사용하여 관련 태그를 추출합니다."""
    if not client or not text:
        return []

    # --- [수정됨] 프롬프트 강화 ---
    system_prompt = """
    당신은 국내 여행 후기에서 검색과 분류에 가장 유용한 핵심 명사 태그만을 추출하는 정제 전문가입니다.
    사용자의 여행 후기를 읽고, 다음 세 가지 핵심 카테고리에 해당하는 키워드를 **최대 3개**까지 추출하여 쉼표(,)로 구분된 목록으로 만들어주세요.

    **핵심 카테고리 (구체적인 명사만 허용):**
    1.  **장소/지역:** 구체적인 지명, 건물, 관광지 **및 해당 장소를 포함하는 대표 도시/지역**. (예: 제주도, 경복궁, 해운대, 전주한옥마을)
    2.  **활동/경험:** '서핑', '한복체험', '해변열차'처럼 구체적인 명사형 활동. ('구경', '산책', '여행' 같은 일반 명사는 제외)
    3.  **음식/물건:** 특정 음식, 지역 특산물, 중요한 사물. (예: 흑돼지, 닭강정, 튀김소보로, 전기자전거)

    **엄격한 규칙:**
    1.  **최대 3개**의 키워드만 반환해야 합니다.
    2.  리뷰에서 **특정 명소**가 언급되었다면, 해당 명소를 포함하는 **가장 넓은 대표 지역 (도시 또는 섬)** 태그를 **반드시 첫 번째 또는 두 번째 태그로 포함**해야 합니다. (예: '쇠소깍' -> '제주도' 포함, '해운대' -> '부산' 포함)
    3.  동사, 형용사, 감정 표현, 분위기 등은 절대 태그로 추출하지 않습니다.
    4.  다른 설명, 인사, 사과, '(추출할 키워드가 없습니다.)', '-', '해당하는 태그가 없습니다.' 같은 키워드 외의 텍스트를 절대 포함하지 마세요.
    5.  **절대 '장소/지역:', '음식/물건:' 같은 카테고리 형식을 출력에 포함하지 마세요.** (가장 중요)
    6.  추출할 키워드가 없으면, **아무것도 반환하지 말고 빈 문자열을 반환**합니다. (가장 중요)

    예시 출력: '제주도, 쇠소깍, 투명카약'
    예시 출력: '부산, 해운대, 해변열차'
    예시 출력: '대전, 성심당, 튀김소보로'
    예시 출력: (만약 태그가 없다면 그냥 빈칸)
    """
    # --- [수정 완료] ---
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            temperature=0.2,
            max_tokens=50
        )
        content = response.choices[0].message.content
        
        # --- [수정됨] 1. 후처리: 괄호, 따옴표, 콜론(:) 등 불필요한 문자 제거 ---
        # "음식/물건: 짜장면" -> "음식/물건 짜장면"
        content = content.replace("(", "").replace(")", "").replace("'", "").replace('"', "").replace(':', "")
        
        tags_from_ai = [tag.strip() for tag in content.split(',') if tag.strip()]
        
        # --- [수정됨] 2. 후처리: 품질 관리 필터링 ---
        # AI가 생성할 수 있는 모든 종류의 쓰레기 단어 목록
        GARBAGE_SUBSTRINGS = [
            '반환', '추출', '없음', '키워드', '해당', '태그', 
            '장소', '지역', '음식', '물건', '활동', '경험',
            '여행', '식도락', '역사와', '아무것도'
        ]

        final_tags = []
        for tag in tags_from_ai:
            is_clean = True
            
            # 1. 태그가 기호(-)이거나 너무 짧으면(1글자) 버림
            if len(tag) <= 1:
                 is_clean = False
                 
            # 2. '쓰레기 단어 목록' 중 하나라도 포함되어 있으면 버림
            if is_clean:
                for garbage in GARBAGE_SUBSTRINGS:
                    if garbage in tag:
                        is_clean = False
                        break 
            
            if is_clean:
                final_tags.append(tag)
                
        return final_tags
        
    except Exception as e:
        print(f"❗️ OpenAI API 호출 중 오류 발생: {e}")
        return []