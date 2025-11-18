import React, { useState, useEffect } from 'react';
import MainPage from './pages/MainPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import DetailPage from './pages/DetailPage.jsx';
import MyPage from './pages/MyPage.jsx';
import GuideDashboard from './pages/GuideDashboard.jsx';
import MapPage from './pages/MapPage.jsx';
import { UserIcon } from './assets/Icons.jsx';
import './index.css';
import AuthModal from './components/AuthModal.jsx';

//토큰 디코딩 함수 (단순 Base64 디코딩)
const decodeToken = (token) => {
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(decodedJson);
        return payload;
    } catch (error) {
        console.error("Invalid token:", error);
        return null;
    }
};

// 메인 App 컴포넌트: 전역 상태 관리 및 라우팅 담당 (커스텀 라우팅 구현)
const App = () => {
    console.log("--- App component is rendering ---");

    //  사용자 상태에 id와 user_type 추가
    const [user, setUser] = useState({
        isLoggedIn: false,
        username: 'Guest',
        id: null,        // 사용자 ID (BookingBox 비교용)
        user_type: null,  // 'traveler' 또는 'guide'
    });

    // 페이지 라우팅 상태
    const [currentPage, setCurrentPage] = useState('main');
    const [currentContentId, setCurrentContentId] = useState(null);

    // --- ▼  로그인 모달 상태 추가 ▼ ---
    const [showAuthModal, setShowAuthModal] = useState(false);
    
    //  앱 로드 시 모든 로그인 상태 복원
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');
        const storedId = localStorage.getItem('user_id'); // 
        const storedUserType = localStorage.getItem('user_type'); // 

        //  모든 정보가 있는지 확인
        if (token && storedUsername && storedId && storedUserType) {
            const payload = decodeToken(token);
            // 토큰 유효성 검사 (만료 시간 확인)
            if (payload && payload.exp * 1000 > Date.now()) {
                console.log(`Found valid token on load. Restoring user session for: ${storedUsername}`);

                //  id와 user_type도 상태에 저장
                setUser({
                    isLoggedIn: true,
                    username: storedUsername,
                    id: storedId,
                    user_type: storedUserType
                });
            } else {
                console.log("Found expired or invalid token. Clearing storage.");
                //  모든 정보 제거
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                localStorage.removeItem('user_id');
                localStorage.removeItem('user_type');
            }
        }
    }, []); // Empty dependency array means run only once on mount

    //  로그인 처리 함수 (LoginPage에서 호출, 인자 없음)
    const handleLogin = () => {
        // LoginPage가 저장한 localStorage에서 모든 정보를 읽어옴
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const id = localStorage.getItem('user_id');
        const user_type = localStorage.getItem('user_type');

        if (token && username && id && user_type) {
            console.log("handleLogin: Reading user info from localStorage", { username, id, user_type });
            setUser({
                isLoggedIn: true,
                username: username,
                id: id,
                user_type: user_type
            });
            navigateTo('main'); // 로그인 성공 후 메인 페이지로 이동
        } else {
            console.error("handleLogin Error: LoginPage did not set all items in localStorage.");
            // 비정상 상태. 다시 로그인하도록 유도
            navigateTo('login');
        }
    };

    //  로그아웃 처리 함수
    const handleLogout = () => {
        console.log("handleLogout called, setting user state to logged out");

        //  id와 user_type도 초기화
        setUser({
            isLoggedIn: false,
            username: 'Guest',
            id: null,
            user_type: null
        });

        //  모든 사용자 정보 localStorage에서 제거
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_type');

        setCurrentPage('main');
    };

    // --- ▼  모달 제어 핸들러 함수 3개 ▼ ---
    //모달 닫기
    const handleCloseModal = () => {
        setShowAuthModal(false);
    };

    // 모달에서 [로그인] 버튼 클릭
    const handleModalLogin = () => {
        setShowAuthModal(false); // 모달 닫고
        navigateTo('login');    // 로그인 페이지로 이동
    };

    // 모달에서 [회원가입] 버튼 클릭
    const handleModalSignup = () => {
        setShowAuthModal(false); // 모달 닫고
        navigateTo('signup');   // 회원가입 페이지로 이동
    };
    
    // 페이지 이동 함수 (라우팅 역할)
    const navigateTo = (page, contentId = null) => {
        console.log(`Navigating to '${page}', contentId: ${contentId}, current user state:`, user);

        //  로그인 필수 페이지 확인 ('signup'은 제외)
        const loginRequiredPages = ['booking', 'myPage', 'guideDashboard'];
        if (loginRequiredPages.includes(page) && !user.isLoggedIn) {
            console.log(`Page '${page}' requires login, showing auth modal.`);
            //  로그인 페이지 대신 Auth 모달을 띄웁니다.
            setShowAuthModal(true);
            // setCurrentPage('login'); // 👈 이 부분을 주석 처리
        } else {
            setCurrentPage(page);
            setCurrentContentId(contentId); // 상세/예약 페이지 이동 시 ID 설정
            //  페이지 이동 시 상단으로 스크롤
            window.scrollTo(0, 0);
        }
    };

    console.log("App component user state before renderPage:", user);

    // 현재 페이지 컴포넌트를 렌더링하는 함수
    const renderPage = () => {
        switch (currentPage) {
            case 'login':
                //  login prop으로 인자 없는 handleLogin 함수 전달
                return <LoginPage login={handleLogin} navigateTo={navigateTo} />;

            // --- ▼  'signup' 페이지 케이스 (임시 -> 실제) ▼ ---
            case 'signup':
                return <SignupPage navigateTo={navigateTo} />;
            

            case 'booking':
                return <BookingPage contentId={currentContentId} navigateTo={navigateTo} user={user} />;
            case 'detail':
                //  이제 'id'와 'user_type'이 포함된 user 객체가 전달됨
                return <DetailPage
                    contentId={currentContentId}
                    navigateTo={navigateTo}
                    user={user}
                    setShowAuthModal={setShowAuthModal} // 👈  모달 함수 전달
                />;

            case 'myPage':
                return <MyPage user={user} navigateTo={navigateTo} />;

            case 'guideDashboard':
                return <GuideDashboard user={user} navigateTo={navigateTo} />;

            // --- ▼  'map' 페이지 케이스 추가 ▼ ---
            case 'map':
                return <MapPage navigateTo={navigateTo} />;
            

            case 'main':
            default:
                return <MainPage user={user} navigateTo={navigateTo} />;
        }
    };

    // ... (useEffect 주석 부분은 동일하므로 생략) ...

    return (
        <div className="min-h-screen bg-gray-100 font-sans antialiased">
            {/* 네비게이션 바 (Tailwind CSS) */}
            {/*  map 페이지에서는 nav를 숨길 수도 있지만, 일단은 z-index로 지도 위에 표시되도록 둡니다. */}
            <nav className="bg-white shadow-md sticky top-0 z-20"> {/* z-index 증가 */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* 로고/타이틀 */}
                        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigateTo('main')}>
                            <img
                                src="/image3.png" // public 폴더의 이미지를 참조합니다.
                                alt="Travia Logo"
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                        {/* 우측 사용자 인터페이스 */}
                        <div className="flex items-center space-x-4">

                            {user.isLoggedIn ? (
                                // 로그인 상태
                                <>
                                    <span className="text-gray-700 text-sm font-medium hidden sm:inline">{user.username}님</span>

                                    {/* '내 예약' 버튼 */}
                                    <button
                                        onClick={() => navigateTo('myPage')}
                                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition duration-200 flex items-center justify-center shadow-md"
                                        title="내 예약 보기"
                                    >
                                        <svg className="w-5 h-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </button>

                                    {/*  '가이드 대시보드' 버튼 (user_type이 'guide'일 때만 보임) */}
                                    {user.user_type === 'guide' && (
                                        <button
                                            onClick={() => navigateTo('guideDashboard')}
                                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition duration-200 flex items-center justify-center shadow-md"
                                            title="가이드 대시보드"
                                        >
                                            <svg className="w-5 h-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v2a4 4 0 004 4h4a2 2 0 002-2v-4M9 17h-2a4 4 0 01-4-4V7a4 4 0 014-4h4a4 4 0 014 4v2" />
                                            </svg>
                                        </button>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="w-8 h-8 rounded-full text-white bg-red-500 hover:bg-red-600 transition duration-200 flex items-center justify-center text-sm font-semibold shadow-md"
                                        title={`${user.username}님 로그아웃`}
                                    >
                                        {user.username ? user.username[0].toUpperCase() : '?'}
                                    </button>
                                </>
                            ) : (
                                // --- ▼  로그아웃 상태 (로그인 버튼) ▼ ---
                                // onClick 이벤트를 navigateTo에서 모달을 여는 함수로 변경
                                <button
                                    onClick={() => setShowAuthModal(true)}
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

            {/* --- ▼  페이지 내용 렌더링 (지도 페이지 분기 처리) ▼ --- */}
            {/* 'map' 페이지일 때는 max-w-7xl, p-4 등 패딩을 제거하여 지도를 꽉 채웁니다. */}
            {currentPage === 'map' ? (
                <main>
                    {renderPage()}
                </main>
            ) : (
                <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    {renderPage()}
                </main>
            )}
            
            {/* --- ▼  Footer (지도 페이지에서는 숨김) ▼ --- */}
            {currentPage !== 'map' && (
                <footer className="mt-10 p-4 text-center text-gray-500 text-sm border-t border-gray-200 bg-white">
                    © 2025 Travia AI Platform. AI와 데이터로 만드는 개인화 여행.
                </footer>
            )}

            {/* --- ▼  모달 렌더링 ▼ --- */}
            {/* showAuthModal state에 따라 모달이 표시되거나 숨겨집니다. */}
            <AuthModal
                show={showAuthModal}
                onClose={handleCloseModal}
                onLogin={handleModalLogin}
                onSignup={handleModalSignup}
            />
            
        </div>
    );
};

export default App;

