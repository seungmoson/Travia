import React, { useState, useEffect, useRef } from 'react';
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
import SearchBar from './components/SearchBar.jsx';

// [중요] 백엔드 API 주소 설정
const API_BASE_URL = 'http://localhost:8000';

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

const App = () => {
    // 1. 사용자 상태
    const [user, setUser] = useState({
        isLoggedIn: false,
        username: 'Guest',
        id: null,
        user_type: null,
    });

    // 2. 페이지 라우팅 상태
    const [currentPage, setCurrentPage] = useState('main');
    const [currentContentId, setCurrentContentId] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);

    // 3. 검색 상태 (입력값)
    const [searchParams, setSearchParams] = useState({
        location: '',
        tags: [],
        keywords: [],
        character: null,
    });

    // 4. 검색 옵션 데이터 (백엔드에서 불러옴)
    const [searchOptions, setSearchOptions] = useState({
        locations: [],   
        tags: [],       
        characters: []  
    });

    // 5. 헤더 애니메이션 상태 (스크롤 감지)
    const [isScrolled, setIsScrolled] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true); 
    
    // [핵심 1] 이전 스크롤 위치 저장
    const lastScrollY = useRef(0);
    // [핵심 2] 애니메이션 중 스크롤 이벤트 무시를 위한 락(Lock)
    const isToggling = useRef(false);

    // --- 검색 옵션 로딩 ---
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [locRes, charRes, tagRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/content/locations`),
                    fetch(`${API_BASE_URL}/characters`),
                    fetch(`${API_BASE_URL}/content/tags`)
                ]);

                const locations = locRes.ok ? await locRes.json() : [];
                const characters = charRes.ok ? await charRes.json() : [];
                const tags = tagRes.ok ? await tagRes.json() : [];

                setSearchOptions({ locations, tags, characters });
            } catch (error) {
                console.error("검색 옵션 불러오기 실패:", error);
                setSearchOptions({ locations: [], tags: [], characters: [] });
            }
        };
        fetchOptions();
    }, []); 

    // --- [수정됨] 스크롤 이벤트 리스너 ---
    useEffect(() => {
        const handleScroll = () => {
            // 확장이 진행 중(잠금 상태)이라면 스크롤 로직 무시
            if (isToggling.current) return;

            const currentScrollY = window.scrollY;

            // 1. 최상단(50px 이하)에서는 무조건 확장
            if (currentScrollY <= 50) {
                setIsScrolled(false);
                setIsExpanded(true);
            } 
            // 2. 스크롤이 내려왔을 때
            else {
                setIsScrolled(true);
                
                // 아래로 내리는 중(current > last)이면 축소
                if (currentScrollY > lastScrollY.current) {
                    setIsExpanded(false);
                }
                // 위로 올리는 중이면 유지 (깜빡임 방지)
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- 로그인 유지 로직 ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');
        const storedId = localStorage.getItem('user_id');
        const storedUserType = localStorage.getItem('user_type');

        if (token && storedUsername && storedId && storedUserType) {
            const payload = decodeToken(token);
            if (payload && payload.exp * 1000 > Date.now()) {
                setUser({
                    isLoggedIn: true,
                    username: storedUsername,
                    id: storedId,
                    user_type: storedUserType
                });
            } else {
                localStorage.clear();
            }
        }
    }, []);

    // --- 핸들러 함수들 ---
    
    const navigateTo = (page, contentId = null) => {
        const loginRequiredPages = ['booking', 'myPage', 'guideDashboard'];
        if (loginRequiredPages.includes(page) && !user.isLoggedIn) {
            setShowAuthModal(true);
        } else {
            setCurrentPage(page);
            setCurrentContentId(contentId);
            window.scrollTo(0, 0);
        }
    };

    const handleUpdateSearch = (newParams) => {
        setSearchParams(prev => ({ ...prev, ...newParams }));
        if (currentPage !== 'main') navigateTo('main');
    };

    // 알약 검색바 클릭 시 확장 (잠금 로직 추가)
    const handleExpand = () => {
        setIsExpanded(true);
        
        // 확장 애니메이션이 일어나는 동안(약 500ms) 스크롤 이벤트를 무시하도록 설정
        isToggling.current = true;
        setTimeout(() => {
            isToggling.current = false; 
        }, 500);
    };

    const handleLogin = () => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const id = localStorage.getItem('user_id');
        const user_type = localStorage.getItem('user_type');
        if (token && username && id && user_type) {
            setUser({ isLoggedIn: true, username, id, user_type });
            navigateTo('main');
        } else {
            navigateTo('login');
        }
    };

    const handleLogout = () => {
        setUser({ isLoggedIn: false, username: 'Guest', id: null, user_type: null });
        localStorage.clear(); 
        setCurrentPage('main');
    };

    const handleCloseModal = () => setShowAuthModal(false);
    const handleModalLogin = () => { setShowAuthModal(false); navigateTo('login'); };
    const handleModalSignup = () => { setShowAuthModal(false); navigateTo('signup'); };

    const renderPage = () => {
        switch (currentPage) {
            case 'login': return <LoginPage login={handleLogin} navigateTo={navigateTo} />;
            case 'signup': return <SignupPage navigateTo={navigateTo} />;
            case 'booking': return <BookingPage contentId={currentContentId} navigateTo={navigateTo} user={user} />;
            case 'detail': return <DetailPage contentId={currentContentId} navigateTo={navigateTo} user={user} setShowAuthModal={setShowAuthModal} />;
            case 'myPage': return <MyPage user={user} navigateTo={navigateTo} />;
            case 'guideDashboard': return <GuideDashboard user={user} navigateTo={navigateTo} />;
            case 'map': return <MapPage navigateTo={navigateTo} />;
            case 'main':
            default:
                return <MainPage user={user} navigateTo={navigateTo} searchParams={searchParams} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans antialiased">
            
            {/* --- 헤더 영역 --- */}
            <nav 
                className={`
                    bg-white shadow-md sticky top-0 z-50 transition-all duration-300 ease-in-out flex flex-col justify-center
                    ${isExpanded ? 'h-[180px]' : 'h-[80px]'} 
                `}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full">
                    <div className="flex items-center justify-between h-full gap-4 relative">
                        
                        {/* 1. 로고 */}
                        <div 
                            className={`flex-shrink-0 flex items-center cursor-pointer w-[140px] transition-all duration-300 ${isExpanded ? 'self-start mt-6' : ''}`} 
                            onClick={() => navigateTo('main')}
                        >
                            <img src="/image3.png" alt="Travia Logo" className="h-10 w-auto object-contain" />
                        </div>

                        {/* 2. 검색바 영역 */}
                        <div className={`flex-1 flex flex-col items-center justify-center transition-all duration-300 ${isExpanded ? 'h-full pt-4' : 'h-full'}`}>
                            <SearchBar 
                                options={searchOptions} 
                                searchParams={searchParams}
                                onUpdateSearch={handleUpdateSearch}
                                navigateTo={navigateTo}
                                isExpanded={isExpanded}
                                onExpand={handleExpand}
                            />
                        </div>

                        {/* 3. 프로필 영역 (너비 제한 해제 및 닉네임 표시 수정) */}
                        <div 
                            // [수정] w-[180px] 고정 제거 -> w-auto 사용
                            // [수정] justify-end는 유지하되 공간이 필요하면 왼쪽으로 늘어남
                            className={`flex-shrink-0 w-auto min-w-[140px] flex justify-end items-center space-x-3 transition-all duration-300 ${isExpanded ? 'self-start mt-6' : ''}`}
                        >
                            {user.isLoggedIn ? (
                                <>
                                    {/* [수정] 닉네임 truncate 제거, whitespace-nowrap 추가 (줄바꿈 방지) */}
                                    <span className="text-gray-700 text-base font-medium hidden lg:inline whitespace-nowrap mr-2">
                                        {user.username}님
                                    </span>
                                    
                                    {/* 내 예약 버튼 */}
                                    <button onClick={() => navigateTo('myPage')} className="w-11 h-11 rounded-full flex-shrink-0 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center" title="내 예약">
                                        <svg className="w-6 h-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                    </button>

                                    {/* 가이드 대시보드 버튼 */}
                                    {user.user_type === 'guide' && (
                                        <button onClick={() => navigateTo('guideDashboard')} className="w-11 h-11 rounded-full flex-shrink-0 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center" title="대시보드">
                                           <svg className="w-6 h-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v2a4 4 0 004 4h4a2 2 0 002-2v-4M9 17h-2a4 4 0 01-4-4V7a4 4 0 014-4h4a4 4 0 014 4v2" /></svg>
                                        </button>
                                    )}

                                    {/* 로그아웃 버튼 */}
                                    <button onClick={handleLogout} className="w-11 h-11 rounded-full flex-shrink-0 bg-red-50 text-red-500 hover:bg-red-100 transition flex items-center justify-center font-bold text-base" title="로그아웃">
                                        {user.username ? user.username[0].toUpperCase() : 'Out'}
                                    </button>
                                </>
                            ) : (
                                /* 로그인 버튼 */
                                <button onClick={() => setShowAuthModal(true)} className="w-11 h-11 rounded-full flex-shrink-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition flex items-center justify-center" title="로그인">
                                    <UserIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {currentPage === 'map' ? (
                <main>{renderPage()}</main>
            ) : (
                <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    {renderPage()}
                </main>
            )}

            {currentPage !== 'map' && (
                <footer className="mt-10 p-4 text-center text-gray-500 text-sm border-t border-gray-200 bg-white">
                    © 2025 Travia AI Platform. AI와 데이터로 만드는 개인화 여행.
                </footer>
            )}

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