// [수정] useCallback, useRef 훅 추가
import React, { useState, useEffect, useCallback, useRef } from 'react';
// --- ▼ [수정] import 경로에서 .jsx 확장자 제거 및 SearchBar 추가 ▼ ---
import ContentList from '../components/ContentList';
import SearchBar from '../components/SearchBar'; // 👈 [신규] SearchBar 임포트
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

    // --- ▼ 무한 스크롤 상태 ▼ ---
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false); // 추가 로딩
    const [hasMore, setHasMore] = useState(true); // 더 불러올 콘텐츠가 있는지
    const observerRef = useRef(null); // 스크롤 감지용 Ref
    // --- ▲ 무한 스크롤 상태 완료 ▲ ---

    // --- ▼ [수정] 검색 및 태그 관련 상태 ▼ ---
    const [inputValue, setInputValue] = useState("");     // SearchBar의 현재 입력 값
    const [searchTerm, setSearchTerm] = useState(""); // API로 보낼 확정된 검색어
    const [popularTags, setPopularTags] = useState([]); // [신규] 인기 태그 목록
    // --- ▲ [수정] 검색 상태 완료 ▲ ---

    // --- ▼ [수정] 초기 콘텐츠 로드 (1페이지) 함수 ▼ ---
    // [핵심] searchTerm이 변경될 때마다 이 함수가 다시 호출됨
    useEffect(() => {
        const fetchInitialContents = async () => {
            try {
                setLoading(true); // "전체" 로딩 시작
                setError(null);
                setCurrentPage(1); // 페이지 1로 리셋
                setHasMore(true);
                setContents([]); // [중요] 목록 초기화

                // [수정] URL에 search 파라미터 추가
                const params = new URLSearchParams({
                    page: 1,
                    per_page: CONTENTS_PER_PAGE,
                });
                if (searchTerm) {
                    params.append('search', searchTerm); // 👈 검색어가 있으면 추가
                }

                // --- ▼ [FIX] API 경로 수정 (prefix 중복 제거) ▼ ---
                // /content/content/list -> /content/list
                const response = await fetch(`${API_BASE_URL}/content/list?${params.toString()}`);
                // --- ▲ [FIX] 수정 완료 ▲ ---

                if (!response.ok) {
                    throw new Error(`HTTP Error! Status: ${response.status}`);
                }

                const data = await response.json();
                
                const initialContents = data.contents || [];
                setContents(initialContents);
                const totalContentCount = data.total_count || 0;
                setTotalCount(totalContentCount);
                setHasMore(initialContents.length < totalContentCount);

            } catch (e) {
                console.error("Content list fetching failed:", e);
                setError("콘텐츠 목록을 불러오는 데 실패했습니다. 서버 상태를 확인하세요.");
                setHasMore(false);
            } finally {
                setLoading(false); // "전체" 로딩 완료
            }
        };

        fetchInitialContents();
    }, [searchTerm]); // [핵심] searchTerm이 바뀔 때마다 1페이지부터 다시 로드
    // --- ▲ [수정 완료] ▲ ---

    // --- ▼ [신규] 인기 태그 로드 useEffect ▼ ---
    useEffect(() => {
        const fetchPopularTags = async () => {
            try {
                // --- ▼ [FIX] API 경로 수정 (prefix 중복 제거) ▼ ---
                // /content/content/tags -> /content/tags
                const response = await fetch(`${API_BASE_URL}/content/tags?limit=10`);
                // --- ▲ [FIX] 수정 완료 ▲ ---
                if (!response.ok) {
                    throw new Error("Failed to fetch popular tags");
                }
                const tags = await response.json(); // ["태그1", "태그2", ...]
                setPopularTags(tags);
            } catch (err) {
                console.error("Popular tags fetching failed:", err);
                // 태그 로딩 실패는 치명적이지 않으므로, 에러 상태를 설정하지 않고 콘솔에만 기록
            }
        };

        fetchPopularTags(); // 컴포넌트 마운트 시 1회 실행
    }, []); // 빈 의존성 배열
    // --- ▲ [신규] 태그 로드 완료 ▲ ---


    // --- ▼ [수정] 추가 콘텐츠 로드 함수 (무한 스크롤용) ▼ ---
    const loadMoreContents = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        const nextPage = currentPage + 1;

        try {
            // [수정] URL에 search 파라미터 추가
            const params = new URLSearchParams({
                page: nextPage,
                per_page: CONTENTS_PER_PAGE,
            });
            if (searchTerm) {
                params.append('search', searchTerm); // 👈 검색어가 있으면 추가
            }

            // --- ▼ [FIX] API 경로 수정 (prefix 중복 제거) ▼ ---
            // /content/content/list -> /content/list
            const response = await fetch(`${API_BASE_URL}/content/list?${params.toString()}`);
            // --- ▲ [FIX] 수정 완료 ▲ ---
            
            if (!response.ok) throw new Error("Failed to fetch more contents");

            const data = await response.json(); // { contents: [...], total_count: N }
            const newContents = data.contents || [];

            if (newContents.length > 0) {
                setContents(prevContents => {
                    const existingIds = new Set(prevContents.map(c => c.id));
                    const uniqueNew = newContents.filter(c => !existingIds.has(c.id));
                    const updatedContents = [...prevContents, ...uniqueNew];
                    
                    // [수정] totalCount는 이미 searchTerm 기준으로 설정되어 있으므로
                    // setHasMore(updatedContents.length < totalCount);
                    // (위 코드는 Pydantic 스키마의 total_count를 신뢰하므로 아래 코드로 대체)
                    setTotalCount(data.total_count || totalCount); // (혹시 모르니 totalCount도 갱신)
                    setHasMore(updatedContents.length < (data.total_count || totalCount));
                    
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
        // [수정] searchTerm도 의존성에 추가
    }, [loadingMore, hasMore, currentPage, totalCount, searchTerm]);
    // --- ▲ [수정 완료] ▲ ---

    // --- ▼ [신규] 검색 실행 핸들러 ▼ ---
    /**
     * SearchBar에서 "검색" 버튼을 누르거나 Enter를 쳤을 때 실행
     */
    const handleSearchSubmit = () => {
        // [핵심] searchTerm 상태를 업데이트
        // -> 이로 인해 1페이지 로드 useEffect가 자동으로 다시 실행됨
        setSearchTerm(inputValue);
    };
    // --- ▲ [신규] 핸들러 완료 ▲ ---

    // --- ▼ [신규] 태그 클릭 핸들러 ▼ ---
    const handleTagClick = (tagName) => {
        setInputValue(tagName); // 1. 입력창 값을 클릭한 태그로 변경
        setSearchTerm(tagName); // 2. 즉시 검색 실행 (searchTerm 변경 -> useEffect 트리거)
    };
    // --- ▲ [신규] 핸들러 완료 ▲ ---


    // --- Intersection Observer 설정 (변경 없음) ---
    useEffect(() => {
        if (loading || !observerRef.current) return () => {};

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingMore && hasMore) {
                    loadMoreContents();
                }
            },
            { threshold: 0.1 }
        );

        const currentObserverRef = observerRef.current;
        observer.observe(currentObserverRef);

        return () => {
            if (currentObserverRef) {
                observer.unobserve(currentObserverRef);
            }
        };
    }, [loading, loadMoreContents, loadingMore, hasMore]);
    

    // --- 로딩 및 오류 상태 렌더링 (변경 없음) ---
    if (loading && currentPage === 1) { 
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
    
    // --- ▼ [수정] "결과 없음" 메시지 분기 처리 ▼ ---
    if (!loading && contents.length === 0) {
        return (
            <div className="p-4 sm:p-6 md:p-8 space-y-6">
                {/* 검색창은 "결과 없음" 페이지에도 표시 */}
                <div className="bg-white rounded-xl shadow-lg p-5 space-y-4">
                    <SearchBar
                        inputValue={inputValue}
                        onInputChange={setInputValue}
                        onSearchSubmit={handleSearchSubmit}
                        popularTags={popularTags} // 👈 [신규] props 전달
                        onTagClick={handleTagClick}   // 👈 [신규] props 전달
                    />
                </div>
                
                {/* 분기 메시지 */}
                <div className="p-8 text-center bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg m-8">
                    <h1 className="text-2xl font-bold mb-2">
                        {searchTerm ? "검색 결과 없음" : "등록된 콘텐츠 없음"}
                    </h1>
                    <p>
                        {searchTerm 
                            ? `'${searchTerm}'에 대한 검색 결과가 없습니다. 다른 키워드나 태그로 검색해 보세요.`
                            : "현재 활성화된 투어 상품이 없습니다. 백엔드의 Seed Data를 확인해주세요."
                        }
                    </p>
                </div>
            </div>
        );
    }
    // --- ▲ [수정 완료] ▲ ---

    // --- ▼ [수정] 페이지 제목 동적 변경 ▼ ---
    const pageTitle = searchTerm
        ? `'${searchTerm}' 검색 결과 (${totalCount || 0}개)`
        : `추천 콘텐츠 (${totalCount || 0}개)`;
    // --- ▲ [수정 완료] ▲ ---

    // --- 메인 콘텐츠 렌더링 ---
    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6">
            
            {/* --- ▼ [수정] 상단 검색 영역 (SearchBar 컴포넌트로 교체) ▼ --- */}
            <div className="bg-white rounded-xl shadow-lg p-5 space-y-4">
                {/* [수정] 기존 하드코딩된 input/button 대신 SearchBar 컴포넌트 사용 */}
                <SearchBar
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                    onSearchSubmit={handleSearchSubmit}
                    popularTags={popularTags} // 👈 [신규] props 전달
                    onTagClick={handleTagClick}   // 👈 [신규] props 전달
                />
                
                {/* --- ▼ [삭제] 기존 목업 태그 필터 ▼ --- */}
                {/* <div className="flex flex-wrap gap-2 text-sm">
                    <span className="px-3 py-1.5 rounded-full bg-indigo-600 text-white font-semibold shadow-md">전체</span>
                    <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">서울</span>
                    <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">부산</span>
                    <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">역사</span>
                </div>
                */}
                {/* --- ▲ [삭제 완료] ▲ --- */}
            </div>
            {/* --- ▲ [수정 완료] ▲ --- */}


            <h1 className="text-2xl font-bold text-gray-800 pt-4">
                {/* [수정] 동적 제목 사용 */}
                {pageTitle}
            </h1>

            {/* ContentList 컴포넌트에 현재 로드된 contents 배열 전달 (기존과 동일) */}
            <ContentList contents={contents} user={user} navigateTo={navigateTo} />

            {/* 무한 스크롤 로더 및 타겟 (기존과 동일) */}
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
        </div>
    );
};

export default MainPage;

