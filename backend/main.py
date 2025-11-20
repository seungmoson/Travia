from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# routers 패키지에서 각 모듈 임포트
from routers import content, auth, booking, review, character

# 1. FastAPI 애플리케이션 인스턴스 생성
app = FastAPI(
    title="Travia Project API",
    description="여행 가이드 및 콘텐츠 예약 플랫폼 API",
    version="0.1.0",
)

# 2. CORS 설정
# 프론트엔드(Vite)에서 접근할 수 있도록 5173 포트를 허용합니다.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",    # React (Vite) 개발 서버
    "http://127.0.0.1:5173",    # 로컬 호스트 IP 접속 대비
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. 라우터 통합 (Include Routers)

# 3-1. 콘텐츠 라우터
app.include_router(
    content.router,
    prefix="/content",
    tags=["Content"]
)

# 3-2. 인증 라우터
# auth.py 내부 router 정의에 prefix="/auth"가 있다고 가정
app.include_router(
    auth.router,
    tags=["Auth"]
)

# 3-3. 예약 라우터
app.include_router(
    booking.router,
    prefix="/bookings",
    tags=["Booking"]
)

# 3-4. 리뷰 라우터
app.include_router(
    review.router,
    tags=["Reviews"]
)

# 3-5. 캐릭터 라우터 (추가됨)
# character.py 내부 router 정의에 prefix="/characters"가 있다고 가정
app.include_router(
    character.router,
    tags=["Characters"]
)

# 4. 루트 경로 테스트
@app.get("/")
def read_root():
    return {"message": "Travia API server is running successfully."}