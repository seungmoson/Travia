from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# ▼ [수정 1] character 모듈 import 추가
from routers import content, auth, booking, review, character

# 1. FastAPI 애플리케이션 인스턴스 생성
app = FastAPI(
    title="Travia Project API",
    description="여행 가이드 및 콘텐츠 예약 플랫폼 API",
    version="0.1.0",
)

# 2. CORS 설정
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",      # React 개발 서버
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
app.include_router(
    auth.router,
    # auth.py 내부에 prefix="/auth"가 정의되어 있다고 가정하여 생략
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

# ▼ [수정 2] 캐릭터 라우터 등록 추가 ▼
# character.py 내부에 prefix="/characters"가 정의되어 있으므로 여기서는 라우터만 등록합니다.
app.include_router(
    character.router,
    tags=["Characters"]
)
# ▲ 추가 완료 ▲


# 4. 루트 경로 테스트
@app.get("/")
def read_root():
    return {"message": "Travia API server is running successfully."}