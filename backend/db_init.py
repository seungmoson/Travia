# db_init.py
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from database import engine, Base, SessionLocal
from models import User 
from seed_data import create_seed_data 

def initialize_database():
    print("--- Travia Project Database Initializer ---")
    try:
        print(f"1. Attempting to create tables via SQLAlchemy Base...")
        Base.metadata.create_all(bind=engine)
        print("   ✅ Database tables created successfully or already exist.")
        
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
