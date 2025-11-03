// [수정] useCallback, useRef 훅 추가
import React, { useState, useEffect, useCallback, useRef } from 'react';
// --- ▼ [오류 수정] 컴파일 오류 해결을 위해 import 구문 제거 ▼ ---
// import ContentList from '../components/ContentList';
// import SearchBar from '../components/SearchBar';
// --- ▲ [오류 수정 완료] ▲ ---
// [수정] react-loader-spinner 임포트 제거 (컴파일 오류 수정)
// import { ThreeDots } from 'react-loader-spinner'; 

const API_BASE_URL = 'http://localhost:8000';
const CONTENTS_PER_PAGE = 9;

/**
 * 메인 콘텐츠 페이지 (로그인 없이 접근 가능)
 * @param {object} user - 현재 사용자 정보 (isLoggedIn, username)
 * @param {function} navigateTo - 페이지 이동 함수
 */
const MainPage = ({ user, navigateTo }) => {
    // 1. 상태 정의
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- ▼ 무한 스크롤 상태 ▼ ---
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef(null);
    // --- ▲ 무한 스크롤 상태 완료 ▲ ---

    // --- ▼ [REFACTOR] 검색 및 태그 관련 상태 ▼ ---
    const [inputValue, setInputValue] = useState(""); // 텍스트 입력창의 현재 값
    const [popularTags, setPopularTags] = useState([]); // 사이드 인기 태그
    
    // [REFACTOR] 검색/필터 조건을 하나의 상태 객체로 통합
    const [searchParams, setSearchParams] = useState({
        text: "",    // 텍스트 검색어
        tags: []     // 선택된 태그 목록
    });
    
    const [isSearchFocused, setIsSearchFocused] = useState(false); // SearchBar 포커스
    const [allTags, setAllTags] = useState([]); // SearchBar 드롭다운용 태그 목록
    const searchWrapperRef = useRef(null); // 외부 클릭 감지용
    // --- ▲ [REFACTOR] ▲ ---


    // --- ▼ [수정] 태그 로드 useEffect (인기태그 + 드롭다운용 태그) ▼ ---
    useEffect(() => {
        const fetchTags = async () => {
            try {
                // 드롭다운용으로 30개, 사이드용으로 10개 가져오기
                const response = await fetch(`${API_BASE_URL}/content/tags?limit=30`);
                if (!response.ok) {
                    throw new Error("Failed to fetch popular tags");
                }
                const tags = await response.json(); // ["태그1", "태그2", ...]
                setAllTags(tags); // SearchBar 드롭다운용 (30개)
                setPopularTags(tags.slice(0, 10)); // 사이드 인기태그용 (10개)
            } catch (err) {
                console.error("Popular tags fetching failed:", err);
            }
        };
        fetchTags();
    }, []);
    // --- ▲ [수정 완료] ▲ ---


    // --- ▼ [REFACTOR] 콘텐츠 로드 로직 (1페이지 로드) ▼ ---
    useEffect(() => {
        const fetchInitialContents = async () => {
            setLoading(true);
            setError(null);
            setCurrentPage(1);
            setHasMore(true);
            setContents([]);

            try {
                const params = new URLSearchParams({
                    page: 1,
                    per_page: CONTENTS_PER_PAGE,
                });

                // --- ▼ [핵심 수정] 텍스트 검색어와 태그 검색어를 '하나의 q 리스트'로 통합 (OR) ▼ ---
                const textTerms = searchParams.text.split(' ').filter(t => t.trim() !== '');
                const allTerms = [...searchParams.tags, ...textTerms];
                const uniqueTerms = [...new Set(allTerms)];

                if (uniqueTerms.length > 0) {
                    uniqueTerms.forEach(term => params.append('q', term));
                }
                // --- ▲ [핵심 수정 완료] ▲ ---

                const response = await fetch(`${API_BASE_URL}/content/list?${params.toString()}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP Error! Status: ${response.status}`);
                }

                const data = await response.json();
                const newContents = data.contents || [];
                const totalContentCount = data.total_count || 0;

                setContents(newContents);
                setTotalCount(totalContentCount);
                setHasMore((1 * CONTENTS_PER_PAGE) < totalContentCount);

            } catch (e) {
                console.error("Content list fetching failed:", e);
                setError("콘텐츠 목록을 불러오는 데 실패했습니다. 서버 상태를 확인하세요.");
                setHasMore(false);
            } finally {
                setLoading(false);
            }
        };
        
        fetchInitialContents();
    // [REFACTOR]
    }, [searchParams]); 
    // --- ▲ [REFACTOR] ▲ ---

    // --- ▼ [REFACTOR] 추가 로드 useCallback (무한 스크롤용) ▼ ---
    const loadMoreContents = useCallback(async () => {
        // [REFACTOR] loading state check
        if (loading || loadingMore || !hasMore) return;
        
        setLoadingMore(true);
        const nextPage = currentPage + 1;

        try {
            const params = new URLSearchParams({
                page: nextPage,
                per_page: CONTENTS_PER_PAGE,
            });

            const textTerms = searchParams.text.split(' ').filter(t => t.trim() !== '');
            const allTerms = [...searchParams.tags, ...textTerms];
            const uniqueTerms = [...new Set(allTerms)];

            if (uniqueTerms.length > 0) {
                uniqueTerms.forEach(term => params.append('q', term));
            }

            const response = await fetch(`${API_BASE_URL}/content/list?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP Error! Status: ${response.status}`);
            }

            const data = await response.json();
            const newContents = data.contents || [];
            const totalContentCount = data.total_count || 0;

            if (newContents.length > 0) {
                setContents(prevContents => {
                    const existingIds = new Set(prevContents.map(c => c.id));
                    const uniqueNew = newContents.filter(c => !existingIds.has(c.id));
                    return [...prevContents, ...uniqueNew];
                });
                setCurrentPage(nextPage); // [REFACTOR] Update current page
                setTotalCount(totalContentCount);
                setHasMore((nextPage * CONTENTS_PER_PAGE) < totalContentCount);
            } else {
                setHasMore(false);
            }

        } catch (e) {
            console.error("Failed to load more contents:", e);
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    // [REFACTOR]
    }, [searchParams, loading, loadingMore, hasMore, currentPage]);
    // --- ▲ [REFACTOR] ▲ ---


    // --- ▼ 검색 실행 핸들러 (텍스트 입력용) ▼ ---
    const handleSearchSubmit = () => {
        // [REFACTOR]
        setSearchParams(prev => ({ ...prev, text: inputValue }));
    };
    // --- ▲ [REFACTOR] ▲ ---

    // --- ▼ 태그 클릭 핸들러 (인기 태그 또는 검색창 태그 클릭 시) ▼ ---
    const handleTagClick = (tagName) => {
        // [REFACTOR]
        if (!searchParams.tags.includes(tagName)) {
            setSearchParams(prev => ({
                ...prev,
                tags: [...prev.tags, tagName]
            }));
        }
        setInputValue(""); 
    };
    // --- ▲ [REFACTOR] ▲ ---

    // --- ▼ [신규] 선택된 태그 제거 핸들러 ▼ ---
    const handleRemoveTag = (tagName) => {
        // [REFACTOR]
        setSearchParams(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagName)
        }));
    };
    // --- ▲ [REFACTOR] ▲ ---

    // --- ▼ [신규] 검색창 외부 클릭 감지 ▼ ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setIsSearchFocused(false); // 외부 클릭 시 포커스 잃음
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    // --- ▲ [신규] ▲ ---


    // --- Intersection Observer 설정 (변경 없음) ---
    useEffect(() => {
        if (loading || loadingMore || !hasMore || !observerRef.current) return () => {}; 

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) { 
                    loadMoreContents(); // Call the refactored function
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
    }, [loading, loadingMore, hasMore, loadMoreContents]); // [REFACTOR]
    

    // --- 로딩 및 오류 상태 렌더링 (변경 없음) ---
    if (loading && currentPage === 1) { 
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                {/* [수정] ThreeDots -> 텍스트 로더 */}
                <div className="text-xl font-semibold text-indigo-600">로딩 중...</div>
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
    
    // --- ▼ [REFACTOR] "결과 없음" 메시지 분기 처리 ▼ ---
    const hasSearchCriteria = searchParams.text || searchParams.tags.length > 0;
    if (!loading && contents.length === 0) {
        return (
            <div className="p-4 sm:p-6 md:p-8 space-y-6">
                {/* 검색창은 "결과 없음" 페이지에도 표시 */}
                <div 
                    className="bg-white rounded-xl shadow-lg p-5 space-y-4"
                    ref={searchWrapperRef} // [신규] 외부 클릭 감지 Ref
                >
                    <SearchBar
                        inputValue={inputValue}
                        onInputChange={setInputValue}
                        onSearchSubmit={handleSearchSubmit}
                        tagsToShow={allTags} // [수정] 드롭다운용 태그 전달
                        onTagClick={handleTagClick}
                        selectedTags={searchParams.tags} // [REFACTOR]
                        onRemoveTag={handleRemoveTag} // [신규] 태그 제거 함수 전달
                        isFocused={isSearchFocused} // [신규] 포커스 상태 전달
                        onFocus={() => setIsSearchFocused(true)} // [신규] 포커스 이벤트 전달
                    />
                </div>
                
                {/* 분기 메시지 */}
                <div className="p-8 text-center bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg m-8">
                    <h1 className="text-2xl font-bold mb-2">
                        {hasSearchCriteria ? "검색 결과 없음" : "등록된 콘텐츠 없음"}
                    </h1>
                    <p>
                        {hasSearchCriteria 
                            ? `현재 조건에 맞는 검색 결과가 없습니다. 다른 키워드나 태그로 검색해 보세요.`
                            : "현재 활성화된 투어 상품이 없습니다. 백엔드의 Seed Data를 확인해주세요."
                        }
                    </p>
                </div>
            </div>
        );
    }
    // --- ▲ [REFACTOR] ▲ ---

    // --- ▼ [REFACTOR] 페이지 제목 동적 변경 ▼ ---
    const pageTitle = hasSearchCriteria
        ? `검색 결과 (${totalCount || 0}개)`
        : `추천 콘텐츠 (${totalCount || 0}개)`;
    // --- ▲ [REFACTOR] ▲ ---

    // --- 메인 콘텐츠 렌더링 ---
    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6">
            
            {/* --- ▼ [수정] 상단 검색 영역 (SearchBar props 수정) ▼ --- */}
            <div 
                className="bg-white rounded-xl shadow-lg p-5 space-y-4 sticky top-4 z-10" // [수정] 검색창 상단 고정
                ref={searchWrapperRef} // [신규] 외부 클릭 감지 Ref
            >
                <SearchBar
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                    onSearchSubmit={handleSearchSubmit}
                    tagsToShow={allTags} // [수정] popularTags -> tagsToShow (드롭다운용)
                    onTagClick={handleTagClick}
                    selectedTags={searchParams.tags} // [REFACTOR]
                    onRemoveTag={handleRemoveTag} // [신규]
                    isFocused={isSearchFocused} // [신규]
                    onFocus={() => setIsSearchFocused(true)} // [신규]
                />
            </div>
            {/* --- ▲ [수정 완료] ▲ --- */}

            {/* --- ▼ [삭제] 사이드 인기 태그 섹션 ▼ --- */}
            {/* {popularTags.length > 0 && !hasSearchCriteria && (
                <div>
                    <h2 className="text-xl font-bold text-gray-800 pt-4 mb-3">인기 태그</h2>
                    <div className="flex flex-wrap gap-2 text-sm">
                        {popularTags.map((tag) => (
                            <button
                                key={tag}
                                type="button" 
                                onClick={() => handleTagClick(tag)} // 클릭 시 selectedTags에 추가됨
                                className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition duration-200 cursor-pointer"
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            */}
            {/* --- ▲ [삭제 완료] ▲ --- */}

            <h1 className="text-2xl font-bold text-gray-800 pt-4">
                {pageTitle}
            </h1>

            {/* ContentList 컴포넌트에 현재 로드된 contents 배열 전달 (기존과 동일) */}
            <ContentList contents={contents} user={user} navigateTo={navigateTo} />

            {/* 무한 스크롤 로더 및 타겟 (기존과 동일) */}
            {totalCount > CONTENTS_PER_PAGE && (
                <div ref={observerRef} className="h-20 flex justify-center items-center">
                    {loadingMore && (
                        // [수정] ThreeDots -> 텍스트 로더
                        <div className="text-md text-gray-600">추가 로딩 중...</div>
                    )}
                    {!loadingMore && !hasMore && contents.length > 0 && (
                        <p className="text-sm text-gray-500">모든 콘텐츠를 불러왔습니다.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// --- ▼ [오류 수정] 컴포넌트 임시 정의 (파일 하단 포함) ▼ ---
// (상단 import 구문을 제거했으므로, 컴파일을 위해 임시로 컴포넌트를 정의합니다)

const ContentList = ({ contents, navigateTo, user }) => {
    if (!contents || contents.length === 0) {
      return null;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contents.map((content) => (
          <div 
            key={content.id} 
            className="border rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
            onClick={() => navigateTo(`/content/${content.id}`)}
          >
            <img 
              src={content.main_image_url || 'https://placehold.co/600x400/eee/ccc?text=Image'} 
              alt={content.title} 
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-bold truncate">{content.title}</h3>
              <p className="text-gray-600">가이드: {content.guide_nickname}</p>
              <p className="text-xl font-semibold mt-2 text-indigo-600">{content.price.toLocaleString()}원</p>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
const SearchBar = ({ 
    inputValue, 
    onInputChange, 
    onSearchSubmit, 
    tagsToShow = [],
    onTagClick,
    selectedTags = [],
    onRemoveTag,
    isFocused,
    onFocus
  }) => {
    
    const handleSubmit = (e) => {
      e.preventDefault();
      onSearchSubmit();
    };
  
    const filteredTags = tagsToShow.filter(tag => 
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedTags.includes(tag)
    );
  
    return (
      <div className="search-bar-container space-y-4 relative" onFocus={onFocus}>
        <form onSubmit={handleSubmit} className="flex items-center border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-indigo-500 transition duration-200">
          <div className="flex flex-wrap gap-2 pr-2">
            {selectedTags.map((tag) => (
              <span key={tag} className="flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="ml-2 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                  aria-label={`Remove ${tag} filter`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <input
            type="search"
            placeholder={selectedTags.length > 0 ? "태그 추가 또는 키워드 검색" : "여행지 또는 #태그로 검색"}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            className="w-full text-lg p-1 focus:outline-none"
          />
          <button type="submit" className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition duration-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>
        </form>
  
        {isFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {filteredTags.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-4">
                {filteredTags.map((tag) => (
                  <button
                    key={tag}
                    type="button" 
                    onClick={() => onTagClick(tag)}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition duration-200 cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-gray-500">
                {tagsToShow.length === 0 ? "태그 로딩 중..." : "일치하는 태그 없음"}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
// --- ▲ [오류 수정 완료] ▲ ---

export default MainPage;

