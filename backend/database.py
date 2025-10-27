# app/database.py

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# .env 파일에서 환경 변수를 로드합니다.
load_dotenv()

# 🚨 .env 파일에서 DB URL을 가져옵니다. 
# .env 파일에는 다음과 같은 형태의 변수가 있어야 합니다:
# DATABASE_URL="mysql+mysqlconnector://user:password@host:port/travel_project"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    # URL이 없는 경우 예외 처리
    raise Exception("DATABASE_URL 환경 변수가 .env 파일에 설정되지 않았습니다.")

# 1. DB 연결 엔진 생성
# 'pool_recycle'은 MySQL의 연결 시간 초과 문제를 방지합니다.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_recycle=3600 # 1시간 (초 단위)
)

# 2. 세션 로컬 생성 (각 요청별 독립 세션)
# autocommit=False: 트랜잭션 수동 관리 (FastAPI에서 권장)
# autoflush=False: 커밋 시에만 데이터베이스에 변경 사항을 전송
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. 모든 모델의 기본 클래스
# 이 클래스를 상속받아 models.py에서 테이블을 정의합니다.
Base = declarative_base()

# 4. FastAPI 의존성 주입을 위한 DB 세션 제너레이터 함수
# 각 API 요청이 들어올 때마다 새 세션을 생성하고, 요청이 끝나면 세션을 닫습니다.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()