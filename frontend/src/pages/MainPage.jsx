import React, { useState, useEffect, useCallback, useRef } from 'react';
// 파일 구조에 맞춘 정확한 Import 경로
import SearchBar from '../components/SearchBar';
import ContentList from '../components/ContentList';

const API_BASE_URL = 'http://localhost:8000';
const CONTENTS_PER_PAGE = 9;

const MainPage = ({ user, navigateTo }) => {
    // --- 1. 상태 관리 ---
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 무한 스크롤 관련 상태
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef(null);

    // 검색 관련 상태 (여행지, 태그, 캐릭터, 검색어)
    const [searchParams, setSearchParams] = useState({ location: '', tags: [], character: null, keywords: [] });
    // 필터 옵션 데이터 (백엔드에서 불러온 목록)
    const [options, setOptions] = useState({ locations: [], tags: [], characters: [] });

    // --- 2. 초기 데이터 로딩 (검색 옵션들) ---
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                // Promise.all로 3개의 API를 병렬 요청하여 로딩 속도 최적화
                const [locRes, charRes, tagRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/content/locations`),
                    fetch(`${API_BASE_URL}/characters`),
                    fetch(`${API_BASE_URL}/content/tags`)
                ]);

                setOptions({
                    locations: locRes.ok ? await locRes.json() : [],
                    characters: charRes.ok ? await charRes.json() : [],
                    tags: tagRes.ok ? await tagRes.json() : []
                });
            } catch (e) {
                console.error("Fetch options error", e);
            }
        };
        fetchOptions();
    }, []);

    // --- 3. 콘텐츠 목록 검색/로딩 (searchParams 변경 시 실행) ---
    useEffect(() => {
        const fetchContents = async () => {
            setLoading(true);
            setError(null);
            setCurrentPage(1);
            setContents([]); // 새로운 검색이므로 기존 목록 비움

            try {
                const params = new URLSearchParams({ page: 1, per_page: CONTENTS_PER_PAGE });

                // 검색 조건 파라미터 추가
                if (searchParams.location) params.append('location', searchParams.location);
                if (searchParams.tags.length > 0) params.append('tags', searchParams.tags.join(','));
                if (searchParams.character) params.append('style', searchParams.character.name);
                // [신규] 검색어(keywords)가 있으면 q 파라미터로 전달
                if (searchParams.keywords && searchParams.keywords.length > 0) {
                    searchParams.keywords.forEach(k => params.append('q', k));
                }

                const response = await fetch(`${API_BASE_URL}/content/list?${params.toString()}`);
                if (!response.ok) throw new Error("Failed to fetch contents");

                const data = await response.json();

                // 안전하게 데이터 설정
                const newContents = data.contents || [];
                setContents(newContents);
                setTotalCount(data.total_count || 0);
                setHasMore((1 * CONTENTS_PER_PAGE) < (data.total_count || 0));

            } catch (e) {
                console.error(e);
                setError("콘텐츠를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchContents();
    }, [searchParams]); // searchParams가 바뀔 때마다 재실행

    // --- 4. 무한 스크롤 (추가 데이터 로딩) ---
    const loadMoreContents = useCallback(async () => {
        if (loading || loadingMore || !hasMore) return;
        setLoadingMore(true);
        const nextPage = currentPage + 1;

        try {
            const params = new URLSearchParams({ page: nextPage, per_page: CONTENTS_PER_PAGE });
            if (searchParams.location) params.append('location', searchParams.location);
            if (searchParams.tags.length > 0) params.append('tags', searchParams.tags.join(','));
            if (searchParams.character) params.append('style', searchParams.character.name);
            if (searchParams.keywords && searchParams.keywords.length > 0) {
                searchParams.keywords.forEach(k => params.append('q', k));
            }

            const response = await fetch(`${API_BASE_URL}/content/list?${params.toString()}`);
            const data = await response.json();
            const newContents = data.contents || [];

            if (newContents.length > 0) {
                setContents(prev => {
                    // ID 기준으로 중복 제거 후 병합
                    const existingIds = new Set(prev.map(c => c.id || c._id));
                    const uniqueNew = newContents.filter(c => !existingIds.has(c.id || c._id));
                    return [...prev, ...uniqueNew];
                });
                setCurrentPage(nextPage);
                setHasMore((nextPage * CONTENTS_PER_PAGE) < data.total_count);
            } else {
                setHasMore(false);
            }
        } catch (e) {
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    }, [currentPage, loading, loadingMore, hasMore, searchParams]);

    // 스크롤 감지 (Intersection Observer)
    useEffect(() => {
        if (loading || loadingMore || !hasMore || !observerRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) loadMoreContents();
        }, { threshold: 0.1 });
        observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [loading, loadingMore, hasMore, loadMoreContents]);

    // --- 5. 핸들러 ---
    const handleUpdateSearch = (newParams) => {
        setSearchParams(prev => ({ ...prev, ...newParams }));
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6">

            {/* [컴포넌트 1] 분리된 검색바 사용 */}
            <div className="flex justify-center mb-8 relative z-30">
                <SearchBar
                    options={options}
                    searchParams={searchParams}
                    onUpdateSearch={handleUpdateSearch}
                    navigateTo={navigateTo}
                />
            </div>

            {/* [컴포넌트 2] 분리된 리스트 사용 */}
            <div className="space-y-6 relative z-10">
                {contents.length === 0 && !loading ? (
                    <div className="p-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <div className="text-4xl mb-3">🧐</div>
                        <h3 className="text-lg font-bold text-gray-900">조건에 맞는 여행지가 없어요</h3>
                        <p className="text-gray-500">다른 지역이나 태그로 다시 검색해보세요.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-baseline gap-2 mb-2">
                            <h2 className="text-xl font-bold text-gray-900">
                                {searchParams.character ? `${searchParams.character.name} 추천 여행지` : '탐험할 여행지'}
                            </h2>
                            <span className="text-sm text-gray-500">({totalCount}개)</span>
                        </div>

                        <ContentList contents={contents} navigateTo={navigateTo} />
                    </>
                )}

                {/* 하단 로딩 인디케이터 */}
                {totalCount > CONTENTS_PER_PAGE && (
                    <div ref={observerRef} className="h-20 flex justify-center items-center">
                        {loadingMore && <div className="text-sm text-gray-500">더 불러오는 중...</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainPage;