# db_init.py

import sys
import os

# 현재 스크립트의 상위 디렉토리(backend)를 Python 경로에 추가하여 
# 'database', 'models' 등의 파일을 모듈로 인식할 수 있도록 합니다.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))


# 🚨 'app.' 접두사를 제거했습니다.
from database import engine, Base, SessionLocal
from models import User 
from seed_data import create_seed_data 


def initialize_database():
    """
    데이터베이스 연결을 시도하고, 테이블 생성 및 Seed 데이터 주입을 수행합니다.
    """
    print("--- Travia Project Database Initializer ---")
    
    # ... (나머지 코드는 동일)
    try:
        print(f"1. Attempting to create tables via SQLAlchemy Base...")
        Base.metadata.create_all(bind=engine)
        print("   ✅ Database tables created successfully or already exist.")
        
        # 2. Seed 데이터 주입
        db = SessionLocal()
        try:
            if db.query(User).count() == 0:
                print("2. Database is empty. Injecting seed data...")
                create_seed_data(db)
                print("   ✅ Seed data injection complete.")
            else:
                print("2. Seed data already exists (found existing users). Skipping data insertion.")
        finally:
            db.close()
            
    except Exception as e:
        print("\n--- 🚨 Database Initialization Failed 🚨 ---")
        print(f"Error: {e}")
        print("Action Required: Please check your database connection details in database.py and ensure the database server is running.")


if __name__ == "__main__":
    initialize_database()