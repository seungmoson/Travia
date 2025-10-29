// [수정] useCallback, useRef 훅 추가
import React, { useState, useEffect, useCallback, useRef } from 'react';
// --- ▼ [수정] import 경로에서 .jsx 확장자 제거 (Vite가 처리하도록) ▼ ---
import ContentList from '../components/ContentList'; 
// --- ▲ [수정 완료] ▲ ---
// [추가] 로딩 스피너
import { ThreeDots } from 'react-loader-spinner'; // (npm install react-loader-spinner 필요)

const API_BASE_URL = 'http://localhost:8000'; 
// [추가] 페이지당 불러올 콘텐츠 개수 (백엔드 기본값과 일치)
const CONTENTS_PER_PAGE = 9;

/**
 * 메인 콘텐츠 페이지 (로그인 없이 접근 가능)
 * @param {object} user - 현재 사용자 정보 (isLoggedIn, username)
 * @param {function} navigateTo - 페이지 이동 함수
 */
const MainPage = ({ user, navigateTo }) => {
    // 1. 상태 정의: contents, loading, error
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true); // 초기 로딩
    const [error, setError] = useState(null);

    // --- ▼ [신규 추가] 무한 스크롤 상태 ▼ ---
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false); // 추가 로딩
    const [hasMore, setHasMore] = useState(true); // 더 불러올 콘텐츠가 있는지
    const observerRef = useRef(null); // 스크롤 감지용 Ref
    // --- ▲ [신규 추가 완료] ▲ ---

    // --- ▼ [수정] 초기 콘텐츠 로드 (1페이지만) ▼ ---
    useEffect(() => {
        const fetchContents = async () => {
            try {
                setLoading(true);
                setError(null);
                setCurrentPage(1); // 페이지 초기화
                setHasMore(true); // 더보기 상태 초기화
                setContents([]); // [추가] 목록 초기화

                // GET /content/list?page=1&per_page=9
                const response = await fetch(`${API_BASE_URL}/content/list?page=1&per_page=${CONTENTS_PER_PAGE}`);

                if (!response.ok) {
                    throw new Error(`HTTP Error! Status: ${response.status}`);
                }

                // [수정] 백엔드 응답 형식 변경 { contents: [...], total_count: N }
                const data = await response.json(); 
                
                // 2. 성공: 1페이지 데이터와 전체 개수 설정
                const initialContents = data.contents || [];
                setContents(initialContents); 
                const totalContentCount = data.total_count || 0;
                setTotalCount(totalContentCount);
                // 더 불러올 콘텐츠가 있는지 확인
                setHasMore(initialContents.length < totalContentCount);

            } catch (e) {
                console.error("Content list fetching failed:", e);
                setError("콘텐츠 목록을 불러오는 데 실패했습니다. 서버 상태를 확인하세요.");
                setHasMore(false);
            } finally {
                setLoading(false); // 초기 로딩 완료
            }
        };

        fetchContents();
    }, []); // 마운트 시 1회만 실행
    // --- ▲ [수정 완료] ▲ ---

    // --- ▼ [신규 추가] 추가 콘텐츠 로드 함수 ▼ ---
    const loadMoreContents = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        const nextPage = currentPage + 1;

        try {
            const response = await fetch(`${API_BASE_URL}/content/list?page=${nextPage}&per_page=${CONTENTS_PER_PAGE}`);
            if (!response.ok) throw new Error("Failed to fetch more contents");

            const data = await response.json(); // { contents: [...], total_count: N }
            const newContents = data.contents || [];

            if (newContents.length > 0) {
                setContents(prevContents => {
                    const existingIds = new Set(prevContents.map(c => c.id));
                    const uniqueNew = newContents.filter(c => !existingIds.has(c.id));
                    const updatedContents = [...prevContents, ...uniqueNew];
                    // 갱신된 길이를 기준으로 hasMore 상태 업데이트
                    setHasMore(updatedContents.length < totalCount);
                    return updatedContents;
                });
                setCurrentPage(nextPage);
            } else {
                setHasMore(false); // 서버에서 빈 배열을 반환하면 더 이상 없음
            }

        } catch (err) {
            console.error("Failed to load more contents:", err);
            setHasMore(false); // 에러 발생 시 중단
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, currentPage, totalCount]);
    // --- ▲ [신규 추가 완료] ▲ ---

    // --- ▼ [신규 추가] Intersection Observer 설정 ▼ ---
    useEffect(() => {
        // 초기 로딩 중이거나, ref가 없으면 Observer 설정 안함
        if (loading || !observerRef.current) return () => {};

        const observer = new IntersectionObserver(
            (entries) => {
                // 타겟이 보이고, 추가 로딩 중이 아니며, 더 불러올 게 있을 때
                if (entries[0].isIntersecting && !loadingMore && hasMore) {
                    loadMoreContents();
                }
            },
            { threshold: 0.1 } // 타겟이 10% 보일 때
        );

        const currentObserverRef = observerRef.current;
        observer.observe(currentObserverRef);

        return () => {
            if (currentObserverRef) {
                observer.unobserve(currentObserverRef);
            }
        };
    }, [loading, loadMoreContents, loadingMore, hasMore]);
    // --- ▲ [신규 추가 완료] ▲ ---

    
    // --- 로딩 및 오류 상태 렌더링 ---
    if (loading && currentPage === 1) { // [수정] 초기 로딩 시에만
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <ThreeDots color="#4f46e5" height={80} width={80} />
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
    if (!loading && contents.length === 0) {
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
            
            {/* 상단 검색 및 필터 영역 (기존과 동일) */}
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
                {/* [수정] 전체 개수 표시 */}
                추천 콘텐츠 ({totalCount || 0}개)
            </h1>

            {/* ContentList 컴포넌트에 현재 로드된 contents 배열 전달 */}
            <ContentList contents={contents} user={user} navigateTo={navigateTo} />

            {/* --- ▼ [신규 추가] 무한 스크롤 로더 및 타겟 ▼ --- */}
            {/* [수정] 전체 개수가 페이지당 개수보다 클 때만 로더 표시 */}
            {totalCount > CONTENTS_PER_PAGE && (
                <div ref={observerRef} className="h-20 flex justify-center items-center">
                    {loadingMore && (
                        <ThreeDots color="#4f46e5" height={40} width={40} />
                    )}
                    {!loadingMore && !hasMore && contents.length > 0 && (
                        <p className="text-sm text-gray-500">모든 콘텐츠를 불러왔습니다.</p>
                    )}
                </div>
            )}
            {/* --- ▲ [신규 추가 완료] ▲ --- */}
        </div>
    );
};

export default MainPage;

