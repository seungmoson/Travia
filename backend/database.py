#/database.py

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise Exception("DATABASE_URL 환경 변수가 .env 파일에 설정되지 않았습니다.")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_recycle=3600 # 1시간 (초 단위)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
