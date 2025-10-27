# app/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone # 👈 timedelta, timezone 추가
from jose import JWTError, jwt # 👈 JWT 라이브러리 import
from passlib.context import CryptContext # 👈 passlib import (bcrypt 대신 사용 권장)

from database import get_db
from models import User
# [수정] LoginResponse 스키마가 변경되었으므로 확인
from schemas import LoginRequest, LoginResponse

# --- ▼ [추가] JWT 설정 ▼ ---
# .env 파일 등으로 옮기는 것이 더 안전합니다.
SECRET_KEY = "YOUR_VERY_SECRET_KEY_NEEDS_TO_BE_CHANGED" # 👈 !!반드시 강력하고 비밀스러운 키로 변경하세요!!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # 👈 토큰 유효 시간 (분 단위)

# 비밀번호 해싱 설정 (passlib 사용)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# --- ▲ JWT 설정 끝 ▲ ---


# --- ▼ [추가] 토큰 생성 함수 ▼ ---
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # 기본 유효 시간 설정
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
# --- ▲ 토큰 생성 함수 끝 ▲ ---


# 1. APIRouter 인스턴스 생성
router = APIRouter()

# 2. POST /login 엔드포인트 정의
@router.post("/login", response_model=LoginResponse) # 
def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    """
    사용자 로그인을 처리하고 인증에 성공하면 JWT 액세스 토큰을 반환합니다.
    """
    # 1. 이메일로 사용자 조회
    user = db.query(User).filter(User.email == request.email).first()

    # [수정] 비밀번호 검증 (passlib 사용)
    if not user or not pwd_context.verify(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, # 400 -> 401 Unauthorized
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"}, # 
        )

    # 3. [수정] 인증 성공 시 JWT 토큰 생성
    # 토큰에 담을 데이터 (민감 정보 제외, 여기서는 user_id만)
    # 'sub'는 토큰의 주체(subject)를 의미하는 표준 클레임
    access_token_data = {"sub": str(user.id)}
    
    # 설정된 유효 시간으로 토큰 생성
    access_token = create_access_token(
        data=access_token_data, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # 4. [수정] 토큰 반환 (LoginResponse 스키마에 맞게)
    return LoginResponse(access_token=access_token, token_type="bearer")

# (향후 여기에 회원가입, 비밀번호 찾기 엔드포인트 등을 추가합니다.)

# --- ▼ [추가] 토큰 검증 및 사용자 정보 얻는 의존성 함수 ▼ ---
# (이 함수는 예약 API 등 로그인 필요한 엔드포인트에서 사용)
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login") # tokenUrl은 실제 토큰 발급 경로

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user # 현재 로그인된 User 모델 객체 반환
# --- ▲ 의존성 함수 끝 ▲ ---