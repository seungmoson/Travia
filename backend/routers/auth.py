from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext

from database import get_db
from models import User
from schemas import LoginRequest, LoginResponse, SignupRequest, UserPublic

# --- ▼ [JWT 설정] ▼ ---
# 실무에서는 환경변수(.env)로 관리하는 것이 좋습니다.
SECRET_KEY = "YOUR_VERY_SECRET_KEY_NEEDS_TO_BE_CHANGED"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# --- ▲ JWT 설정 끝 ▲ ---


# --- ▼ [유틸리티 함수] ▼ ---

# 비밀번호 검증 함수
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 비밀번호 해시 함수 (회원가입 시 필요)
def get_password_hash(password):
    return pwd_context.hash(password)

# 토큰 생성 함수
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
# --- ▲ 유틸리티 함수 끝 ▲ ---


# 1. APIRouter 인스턴스 생성
router = APIRouter(
    prefix="/auth",  # URL prefix 설정 (/auth)
    tags=["Auth"]    # 문서 태그 설정
)


# --- ▼ [회원가입 엔드포인트] ▼ ---
@router.post("/signup", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def create_user(request: SignupRequest, db: Session = Depends(get_db)):
    """
    새로운 사용자를 생성합니다. (회원가입)
    - username, email, password, user_type을 받습니다.
    """
    
    # 1. 이메일 중복 확인
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 사용 중인 이메일입니다.",
        )
        
    # 2. 비밀번호 해시
    hashed_password = get_password_hash(request.password)
    
    # 3. 새 User 객체 생성
    new_user = User(
        email=request.email,
        password=hashed_password,
        nickname=request.username,  # 프론트의 'username' -> DB 'nickname' 매핑
        user_type=request.user_type
    )
    
    # 4. DB에 추가 및 커밋
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        print(f"DB 오류 발생: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 생성 중 서버 오류가 발생했습니다."
        )
    
    # 5. 생성된 사용자 정보 반환
    return new_user


# --- ▼ [로그인 엔드포인트] ▼ ---
@router.post("/login", response_model=LoginResponse)
def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    """
    사용자 로그인을 처리하고 인증에 성공하면 JWT 액세스 토큰을 반환합니다.
    """
    # 1. 이메일로 사용자 조회
    user = db.query(User).filter(User.email == request.email).first()

    # 2. 비밀번호 검증
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. 인증 성공 시 JWT 토큰 생성 Payload 구성
    access_token_data = {
        "sub": str(user.id),
        "nickname": user.nickname,
        "user_type": user.user_type
    }
    
    # 4. 토큰 생성
    access_token = create_access_token(
        data=access_token_data,
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # 5. 토큰 반환
    return LoginResponse(access_token=access_token, token_type="bearer")


# --- ▼ [토큰 검증 의존성 함수 (다른 라우터에서 사용)] ▼ ---
# tokenUrl은 라우터 prefix를 포함한 전체 경로여야 합니다.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

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
    return user