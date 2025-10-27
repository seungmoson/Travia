import React, { useState, useEffect } from 'react';
// 💡 오류 해결: 명시적으로 확장자를 포함하거나, 폴더 이름만 사용 (여기서는 일반적인 방식을 따릅니다.)
import ContentList from '../components/ContentList'; 

// 🚨 FastAPI 서버 주소: 실행 중인 서버의 주소로 설정합니다.
const API_BASE_URL = 'http://localhost:8000'; 

/**
 * 메인 콘텐츠 페이지 (로그인 없이 접근 가능)
 * @param {object} user - 현재 사용자 정보 (isLoggedIn, username)
 * @param {function} navigateTo - 페이지 이동 함수
 */
const MainPage = ({ user, navigateTo }) => {
    // 1. 상태 정의: contents, loading, error
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // API 호출을 위한 비동기 함수 정의
        const fetchContents = async () => {
            try {
                setLoading(true);
                setError(null);   

                // GET /content/list 엔드포인트 호출
                const response = await fetch(`${API_BASE_URL}/content/list`);

                if (!response.ok) {
                    throw new Error(`HTTP Error! Status: ${response.status}`);
                }

                const data = await response.json();
                
                // 2. 성공: DB에서 가져온 실제 데이터로 상태 업데이트
                setContents(data); 

            } catch (e) {
                console.error("Content list fetching failed:", e);
                setError("콘텐츠 목록을 불러오는 데 실패했습니다. 서버 상태를 확인하세요.");
            } finally {
                setLoading(false); // 요청 완료 후 로딩 상태 해제
            }
        };

        fetchContents();
    }, []); 
    
    // --- 로딩 및 오류 상태 렌더링 ---
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <p className="text-xl text-indigo-600 font-semibold">투어 목록을 불러오는 중입니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-100 border border-red-400 text-red-700 rounded-lg m-8">
                <h1 className="text-2xl font-bold mb-2">데이터 로딩 오류</h1>
                <p>{error}</p>
                <p className="mt-4 text-sm">FastAPI 서버(http://localhost:8000)가 실행 중인지 확인해주세요.</p>
            </div>
        );
    }
    
    // DB 연결은 됐으나, Active 상태인 콘텐츠가 없을 경우
    if (contents.length === 0) {
        return (
             <div className="p-8 text-center bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg m-8">
                <h1 className="text-2xl font-bold mb-2">등록된 콘텐츠 없음</h1>
                <p>현재 활성화된 투어 상품이 없습니다. 백엔드의 Seed Data를 확인해주세요.</p>
            </div>
        );
    }

    // --- 메인 콘텐츠 렌더링 ---
    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6">
            
            {/* 상단 검색 및 필터 영역 (로직만 비활성화) */}
            <div className="bg-white rounded-xl shadow-lg p-5 space-y-4">
                {/* 검색창 */}
                <div className="flex items-center border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-indigo-500 transition duration-200">
                    <input
                        type="search"
                        placeholder="여행지를 검색하세요..."
                        className="w-full text-lg p-1 focus:outline-none"
                    />
                    <button className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition duration-200">
                        {/* 검색 아이콘 (인라인 SVG) */}
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </button>
                </div>
                
                {/* 카테고리/태그 필터: 데이터 없이 목업만 유지 */}
                <div className="flex flex-wrap gap-2 text-sm">
                    {/* 임시 필터 데이터는 제거되었으므로, 실제 API에서 태그 데이터를 가져와야 합니다. */}
                    <span className="px-3 py-1.5 rounded-full bg-indigo-600 text-white font-semibold shadow-md">전체</span>
                    <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">서울</span>
                    <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">부산</span>
                    <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">역사</span>
                </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 pt-4">
                추천 콘텐츠 ({user.isLoggedIn ? user.username : '게스트'})
            </h1>

            {/* ContentList 컴포넌트에 DB에서 가져온 실제 contents 배열을 전달 */}
            <ContentList contents={contents} user={user} navigateTo={navigateTo} />
        </div>
    );
};

export default MainPage;
