import React, { useState, useEffect } from 'react'; // [수정] useEffect import
// [수정] 파일 구조에 맞게 import 경로 수정
import MainPage from './pages/MainPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import DetailPage from './pages/DetailPage.jsx';
import MyPage from './pages/MyPage.jsx';
import GuideDashboard from './pages/GuideDashboard.jsx'; // --- ▼ [신규] GuideDashboard 컴포넌트 import ---
// [수정] 파일 구조에 맞게 import 경로 수정
import { UserIcon } from './assets/Icons.jsx';
// [수정] 파일 구조에 맞게 import 경로 수정
import './index.css';

/**
 * 토큰 디코딩 함수 (단순 Base64 디코딩)
 * @param {string} token - JWT 토큰
 * @returns {object | null} 디코딩된 페이로드 (또는 오류 시 null)
 */
const decodeToken = (token) => {
    try {
        // 토큰의 payload (두 번째 부분)를 디코딩
        const payloadBase64 = token.split('.')[1];
        // Base64 URL-safe 문자를 표준 Base64로 변환
        const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(decodedJson);
        return payload;
    } catch (error) {
        console.error("Invalid token:", error);
        return null;
    }
};


/**
 * 메인 App 컴포넌트: 전역 상태 관리 및 라우팅 담당 (커스텀 라우팅 구현)
 */
const App = () => {
    // Add a log to confirm rendering
    console.log("--- App component is rendering ---");

    // 사용자 상태 관리 (로그인 여부, 사용자명)
    const [user, setUser] = useState({
        isLoggedIn: false,
        username: 'Guest',
    });

    // 페이지 라우팅 상태 (main, login, booking, detail)
    const [currentPage, setCurrentPage] = useState('main');
    const [currentContentId, setCurrentContentId] = useState(null);

    // [추가] 앱 로드 시 로그인 상태 복원
    useEffect(() => {
        const token = localStorage.getItem('token');
        // [수정] username도 localStorage에서 가져옵니다.
        const storedUsername = localStorage.getItem('username');

        if (token && storedUsername) {
            const payload = decodeToken(token);
            // 토큰 유효성 검사 (만료 시간 확인)
            if (payload && payload.exp * 1000 > Date.now()) {
                console.log(`Found valid token on load. Restoring user session for: ${storedUsername}`);
                // [수정] 토큰의 sub(ID) 대신 저장된 username을 사용
                setUser({ isLoggedIn: true, username: storedUsername });
            } else {
                console.log("Found expired or invalid token. Clearing storage.");
                localStorage.removeItem('token');
                localStorage.removeItem('username');
            }
        }
    }, []); // Empty dependency array means run only once on mount

    // 로그인 처리 함수 (LoginPage에서 호출)
    const handleLogin = (username) => {
        console.log("handleLogin called, setting user state to logged in with username:", username); // Add log here
        setUser({ isLoggedIn: true, username: username });
        // [수정] localStorage 저장은 LoginPage에서 처리하므로 주석 제거
        navigateTo('main'); // 로그인 성공 후 메인 페이지로 이동
    };

    // 로그아웃 처리 함수
    const handleLogout = () => {
        console.log("handleLogout called, setting user state to logged out"); // Add log here
        setUser({ isLoggedIn: false, username: 'Guest' });
        // [수정] JWT 토큰 키 'token'으로 변경
        localStorage.removeItem('token'); 
        // [추가] username도 localStorage에서 제거
        localStorage.removeItem('username'); 
        setCurrentPage('main');
    };

    /**
     * 페이지 이동 함수 (라우팅 역할)
     */
    const navigateTo = (page, contentId = null) => {
        // Log navigation attempt and current user state
        console.log(`Navigating to '${page}', contentId: ${contentId}, current user state:`, user);

        // Check login requirement *before* changing page state
        // [수정] myPage 및 guideDashboard도 로그인 필수 페이지로 추가
        if ((page === 'booking' || page === 'myPage' || page === 'guideDashboard') && !user.isLoggedIn) {
            console.log(`Page '${page}' requires login, redirecting to login page.`);
            // Store intended destination before redirecting (Optional)
            // sessionStorage.setItem('intendedBookingId', contentId);
            setCurrentPage('login');
        } else {
            setCurrentPage(page);
            setCurrentContentId(contentId); // 상세/예약 페이지 이동 시 ID 설정
        }
    };

    // Log user state before rendering page content
    console.log("App component user state before renderPage:", user);

    // 현재 페이지 컴포넌트를 렌더링하는 함수
    const renderPage = () => {
        switch (currentPage) {
            case 'login':
                // Pass the handleLogin function as the 'login' prop
                return <LoginPage login={handleLogin} navigateTo={navigateTo} />;
            case 'booking':
                // BookingPage needs contentId
                // Note: Consider if BookingPage also needs the user object
                return <BookingPage contentId={currentContentId} navigateTo={navigateTo} user={user} />;
            case 'detail':
                // DetailPage needs contentId, navigateTo, and the current user state
                return <DetailPage
                    contentId={currentContentId}
                    navigateTo={navigateTo}
                    user={user} // Pass the user state as a prop
                />;
            
            // --- ▼ [신규] MyPage 라우팅 추가 ▼ ---
            case 'myPage':
                return <MyPage user={user} navigateTo={navigateTo} />;
            // --- ▲ 신규 라우팅 완료 ▲ ---

            // --- ▼ [신규] GuideDashboard 라우팅 추가 ▼ ---
            case 'guideDashboard':
                return <GuideDashboard user={user} navigateTo={navigateTo} />;
            // --- ▲ 신규 라우팅 완료 ▲ ---

            case 'main':
            default:
                // MainPage needs user state and navigateTo
                return <MainPage user={user} navigateTo={navigateTo} />;
        }
    };

    // Add useEffect to check for token on initial load (Optional but good practice)
    /*
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            // TODO: Decode token to get username/expiry if needed
            // For now, just assume logged in if token exists
            // You might want to verify the token with the backend here
            console.log("Found auth token on load, setting user as logged in.");
            // Extract username from token or fetch user details
            const decodedToken = {}; // Replace with actual decoding logic if needed
            setUser({ isLoggedIn: true, username: decodedToken.username || 'User' });
        }
    }, []); // Empty dependency array means run only once on mount
    */


    return (
        <div className="min-h-screen bg-gray-100 font-sans antialiased">
            {/* 네비게이션 바 (Tailwind CSS) */}
            <nav className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* 로고/타이틀 */}
                        <div className="flex items-center space-x-4">
                            <span className="text-xl font-extrabold text-indigo-600 cursor-pointer" onClick={() => navigateTo('main')}>
                                BUSAN DIGITAL ACADEMY
                            </span>
                            <span className="text-2xl font-extrabold text-gray-800 cursor-pointer" onClick={() => navigateTo('main')}>
                                Travia AI
                            </span>
                        </div>
                        {/* 우측 사용자 인터페이스 */}
                        <div className="flex items-center space-x-4">
                            
                            {/* --- ▼ [수정] 임시 아이콘 2개 제거됨 ▼ --- */}
                            
                            {user.isLoggedIn ? (
                                // 로그인 상태 (첫 글자 프로필 아이콘)
                                <>
                                    <span className="text-gray-700 text-sm font-medium hidden sm:inline">{user.username}님</span>
                                    
                                    {/* --- ▼ [신규] '내 예약' 버튼 ▼ --- */}
                                    <button
                                        onClick={() => navigateTo('myPage')}
                                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition duration-200 flex items-center justify-center shadow-md"
                                        title="내 예약 보기"
                                    >
                                        {/* 간단한 목록 아이콘 (SVG) */}
                                        <svg className="w-5 h-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </button>
                                    {/* --- ▲ [신규] 버튼 종료 ▲ --- */}

                                    {/* --- ▼ [신규] '가이드 대시보드' 버튼 ▼ --- */}
                                    <button
                                      onClick={() => navigateTo('guideDashboard')}
                                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition duration-200 flex items-center justify-center shadow-md"
                                      title="가이드 대시보드"
                                    >
                                      {/* 가이드 대시보드 아이콘 (SVG) - 기존 placeholder 2번 아이콘 재활용 */}
                                      <svg className="w-5 h-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                         <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v2a4 4 0 004 4h4a2 2 0 002-2v-4M9 17h-2a4 4 0 01-4-4V7a4 4 0 014-4h4a4 4 0 014 4v2" />
                                      </svg>
                                    </button>
                                    {/* --- ▲ [신규] 버튼 종료 ▲ --- */}

                                    <button
                                        onClick={handleLogout}
                                        className="w-8 h-8 rounded-full text-white bg-red-500 hover:bg-red-600 transition duration-200 flex items-center justify-center text-sm font-semibold shadow-md"
                                        title={`${user.username}님 로그아웃`}
                                    >
                                        {/* Ensure username exists before accessing index 0 */}
                                        {user.username ? user.username[0].toUpperCase() : '?'}
                                    </button>
                                </>
                            ) : (
                                // 로그아웃 상태 (로그인 버튼)
                                <button
                                    onClick={() => navigateTo('login')}
                                    className="w-8 h-8 rounded-full bg-indigo-500 hover:bg-indigo-600 transition duration-200 flex items-center justify-center shadow-md"
                                    title="로그인/가입"
                                >
                                    <UserIcon className="w-5 h-5 text-white" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* 페이지 내용 렌더링 */}
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {renderPage()}
            </main>

            {/* Footer */}
            <footer className="mt-10 p-4 text-center text-gray-500 text-sm border-t border-gray-200 bg-white">
                © 2025 Travia AI Platform. AI와 데이터로 만드는 개인화 여행.
            </footer>
        </div>
    );
};

export default App;

