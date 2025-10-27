

/
Working
Working...
Travel app homepage - v0 by Vercel
pasted-text.txt
pasted-text.txt
trip
├── 📦 package.json
├── ⚙️ vite.config.js              # (React + Vite 기준)
├── 📄 README.md
├── 📁 public/
│   ├── index.html
│   ├── favicon.ico
│   └── images/
│       └── logo.png
│
├── 📁 src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│
│   ├── 📁 assets/                # 정적 리소스 (이미지, 아이콘 등)
│   │   ├── icons/
│   │   ├── images/
│   │   └── styles/
│
│   ├── 📁 components/            # 재사용 가능한 공용 컴포넌트
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Loader.jsx
│   │   ├── MapView.jsx
│   │   ├── RatingStars.jsx
│   │   ├── ChatBox.jsx
│   │   └── Modal.jsx
│
│   ├── 📁 pages/                 # 주요 페이지 구성
│   │   ├── Home/
│   │   │   └── Home.jsx
│   │   ├── Explore/
│   │   │   └── Explore.jsx
│   │   ├── PostDetail/
│   │   │   └── PostDetail.jsx
│   │   ├── CreateTrip/
│   │   │   └── CreateTrip.jsx
│   │   ├── Profile/
│   │   │   └── Profile.jsx
│   │   ├── Booking/
│   │   │   └── Booking.jsx
│   │   ├── MyPage/
│   │   │   └── MyPage.jsx
│   │   ├── Messages/
│   │   │   └── Messages.jsx
│   │   ├── Admin/
│   │   │   └── AdminDashboard.jsx
│   │   └── Auth/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       └── ForgotPassword.jsx
│
│   ├── 📁 routes/                # 라우팅 관련 파일
│   │   └── AppRouter.jsx
│
│   ├── 📁 context/               # 전역 상태 관리 (React Context API)
│   │   ├── AuthContext.jsx
│   │   ├── TripContext.jsx
│   │   └── ThemeContext.jsx
│
│   ├── 📁 hooks/                 # 커스텀 훅
│   │   ├── useAuth.js
│   │   ├── useFetch.js
│   │   ├── useModal.js
│   │   └── useChat.js
│
│   ├── 📁 services/              # API 통신 관련
│   │   ├── api.js               # Axios 기본 설정
│   │   ├── authService.js
│   │   ├── tripService.js
│   │   ├── bookingService.js
│   │   └── userService.js
│
│   ├── 📁 utils/                 # 유틸 함수
│   │   ├── formatDate.js
│   │   ├── calculatePrice.js
│   │   ├── filterTrips.js
│   │   └── constants.js
│
│   └── 📁 data/                  # 임시 더미 데이터
│       ├── trips.json
│       ├── users.json
│       └── reviews.json
│
└── 📁 server/                    # (선택) 간단한 백엔드 서버
    ├── server.js                 # Express 기반 서버
    ├── routes/
    ├── controllers/
    └── models/