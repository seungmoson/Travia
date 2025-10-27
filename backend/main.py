# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# [수정] booking 라우터 import 추가
from routers import content, auth, booking

# 1. FastAPI 애플리케이션 인스턴스 생성 (가장 먼저!)
app = FastAPI(
    title="Travia Project API",
    description="여행 가이드 및 콘텐츠 예약 플랫폼 API",
    version="0.1.0",
)

# 2. CORS (Cross-Origin Resource Sharing) 설정 (한 번만 정의)
origins = [
    "http://localhost:3000",      # (다른 프론트엔드 포트도 사용한다면 유지)
    "http://127.0.0.1:3000",    # (다른 프론트엔드 포트도 사용한다면 유지)
    "http://localhost:5173",      # 👈 현재 사용하는 프론트엔드 주소
    # 만약 배포된 프론트엔드 주소가 있다면 여기에 추가
    # "https://your-deployed-frontend.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # 설정된 origins 리스트 사용
    allow_credentials=True,     # 쿠키 허용
    allow_methods=["*"],        # 모든 HTTP 메소드 허용
    allow_headers=["*"],        # 모든 HTTP 헤더 허용
)

# 3. 라우터 통합 (Include Routers)

# 3-1. 콘텐츠 라우터 (GET /content/list 등)
app.include_router(
    content.router,
    prefix="/content",
    tags=["Content"]
)

# 3-2. 인증 라우터 (POST /auth/login 등)
app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Auth"]
)

# --- 👇 [추가] 3-3. 예약 라우터 👇 ---
app.include_router(
    booking.router,
    prefix="/bookings", # 👈 API 경로를 '/bookings'로 설정
    tags=["Booking"]
)
# --- ▲ 추가 완료 ▲ ---


# 4. 루트 경로 테스트 (선택 사항)
@app.get("/")
def read_root():
    return {"message": "Travia API server is running successfully."}