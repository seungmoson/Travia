import React, { useState, useEffect, useCallback, useRef } from 'react';
import ContentList from '../components/ContentList';

const API_BASE_URL = 'http://localhost:8000'; // 사용하시는 백엔드 포트에 맞게 설정
const CONTENTS_PER_PAGE = 9;

const MainPage = ({ user, navigateTo, searchParams }) => {
    // --- 1. 상태 관리 ---
    // 콘텐츠 리스트 및 로딩 상태
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 무한 스크롤 관련 상태
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef(null);

    // [변경] searchParams와 options 상태는 App.jsx에서 관리하므로 제거했습니다.

    // --- 2. 콘텐츠 목록 검색/로딩 (props.searchParams 변경 시 실행) ---
    useEffect(() => {
        const fetchContents = async () => {
            setLoading(true);
            setError(null);
            setCurrentPage(1);
            setContents([]); // 새로운 검색이므로 기존 목록 비움
            setHasMore(true); // 검색 조건이 바뀌면 더보기 상태 초기화

            try {
                const params = new URLSearchParams({ page: 1, per_page: CONTENTS_PER_PAGE });

                // props로 받은 searchParams 사용
                if (searchParams.location) params.append('location', searchParams.location);
                if (searchParams.tags && searchParams.tags.length > 0) {
                    params.append('tags', searchParams.tags.join(','));
                }
                if (searchParams.character) params.append('style', searchParams.character.name);
                if (searchParams.keywords && searchParams.keywords.length > 0) {
                    searchParams.keywords.forEach(k => params.append('q', k));
                }

                // API 호출
                const response = await fetch(`${API_BASE_URL}/content/list?${params.toString()}`);
                if (!response.ok) throw new Error("Failed to fetch contents");

                const data = await response.json();

                // 안전하게 데이터 설정
                const newContents = data.contents || [];
                setContents(newContents);
                setTotalCount(data.total_count || 0);
                // 데이터가 per_page보다 적으면 더 이상 로드할 게 없음
                setHasMore(newContents.length >= CONTENTS_PER_PAGE);

            } catch (e) {
                console.error(e);
                setError("콘텐츠를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchContents();
    }, [searchParams]); // ★ searchParams(부모에서 전달됨)가 바뀔 때마다 재실행

    // --- 3. 무한 스크롤 (추가 데이터 로딩) ---
    const loadMoreContents = useCallback(async () => {
        // 이미 로딩 중이거나, 더 불러올 데이터가 없으면 중단
        if (loading || loadingMore || !hasMore) return;
        
        setLoadingMore(true);
        const nextPage = currentPage + 1;

        try {
            const params = new URLSearchParams({ page: nextPage, per_page: CONTENTS_PER_PAGE });
            
            // props로 받은 searchParams 사용 (동일한 조건으로 다음 페이지 요청)
            if (searchParams.location) params.append('location', searchParams.location);
            if (searchParams.tags && searchParams.tags.length > 0) {
                params.append('tags', searchParams.tags.join(','));
            }
            if (searchParams.character) params.append('style', searchParams.character.name);
            if (searchParams.keywords && searchParams.keywords.length > 0) {
                searchParams.keywords.forEach(k => params.append('q', k));
            }

            const response = await fetch(`${API_BASE_URL}/content/list?${params.toString()}`);
            const data = await response.json();
            const newContents = data.contents || [];

            if (newContents.length > 0) {
                setContents(prev => {
                    // ID 기준으로 중복 제거 후 병합 (안전장치)
                    const existingIds = new Set(prev.map(c => c.id || c._id));
                    const uniqueNew = newContents.filter(c => !existingIds.has(c.id || c._id));
                    return [...prev, ...uniqueNew];
                });
                setCurrentPage(nextPage);
                // 새로 받아온 데이터 개수가 요청한 개수보다 적으면 끝난 것임
                setHasMore(newContents.length >= CONTENTS_PER_PAGE);
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
            if (entries[0].isIntersecting) {
                loadMoreContents();
            }
        }, { threshold: 0.1 });

        observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [loading, loadingMore, hasMore, loadMoreContents]);


    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6">
            
            {/* [수정] SearchBar 제거됨 (App.jsx 헤더에 있음) */}
            
            {/* 현재 검색 조건 표시 (선택사항: 필요 없으면 제거 가능) */}
            {(searchParams.location || searchParams.tags.length > 0 || searchParams.character) && (
                <div className="mb-4 text-sm text-gray-500">
                    🔍 검색 조건 적용 중: {searchParams.location} {searchParams.character?.name} {searchParams.tags.join(', ')}
                </div>
            )}

            {/* 콘텐츠 리스트 영역 */}
            <div className="space-y-6 relative z-10">
                {loading ? (
                    // 첫 로딩 시 스켈레톤이나 로딩 텍스트
                    <div className="text-center py-20 text-gray-400">여행지를 찾고 있어요...</div>
                ) : contents.length === 0 ? (
                    // 결과 없음
                    <div className="p-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <div className="text-4xl mb-3">🧐</div>
                        <h3 className="text-lg font-bold text-gray-900">조건에 맞는 여행지가 없어요</h3>
                        <p className="text-gray-500">다른 지역이나 태그로 다시 검색해보세요.</p>
                    </div>
                ) : (
                    // 결과 있음
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

                {/* 하단 무한 스크롤 로딩 트리거 */}
                {/* 데이터가 더 있고(hasMore) 로딩이 아닐 때만 감지 요소 표시 */}
                {hasMore && !loading && contents.length > 0 && (
                    <div ref={observerRef} className="h-20 flex justify-center items-center">
                        {loadingMore && <div className="text-sm text-gray-500">더 불러오는 중...</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainPage;