import React, { useState, useEffect, useCallback, useRef } from 'react';
import ContentList from '../components/ContentList';

const API_BASE_URL = 'https://guidie.duckdns.org';
const CONTENTS_PER_PAGE = 9;
const MainPage = ({ user, navigateTo, searchParams }) => {
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef(null);

    useEffect(() => {
        const fetchContents = async () => {
            setLoading(true);
            setError(null);
            setCurrentPage(1);
            setContents([]);
            setHasMore(true);

            try {
                const params = new URLSearchParams({ page: 1, per_page: CONTENTS_PER_PAGE });
                if (searchParams.location) params.append('location', searchParams.location);
                if (searchParams.tags && searchParams.tags.length > 0) {
                    params.append('tags', searchParams.tags.join(','));
                }
                if (searchParams.character) params.append('style', searchParams.character.name);
                if (searchParams.keywords && searchParams.keywords.length > 0) {
                    searchParams.keywords.forEach(k => params.append('q', k));
                }

                const response = await fetch(`${API_BASE_URL}/content/list?${params.toString()}`);
                if (!response.ok) throw new Error("Failed to fetch contents");

                const data = await response.json();
                const newContents = data.contents || [];
                setContents(newContents);
                setTotalCount(data.total_count || 0);
                setHasMore(newContents.length >= CONTENTS_PER_PAGE);
            } catch (e) {
                console.error(e);
                setError("콘텐츠를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchContents();
    }, [searchParams]);

    const loadMoreContents = useCallback(async () => {
        if (loading || loadingMore || !hasMore) return;
        
        setLoadingMore(true);
        const nextPage = currentPage + 1;

        try {
            const params = new URLSearchParams({ page: nextPage, per_page: CONTENTS_PER_PAGE });

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
                    const existingIds = new Set(prev.map(c => c.id || c._id));
                    const uniqueNew = newContents.filter(c => !existingIds.has(c.id || c._id));
                    return [...prev, ...uniqueNew];
                });
                setCurrentPage(nextPage);
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
            {(searchParams.location || searchParams.tags.length > 0 || searchParams.character) && (
                <div className="mb-4 text-sm text-gray-500">
                    🔍 검색 조건 적용 중: {searchParams.location} {searchParams.character?.name} {searchParams.tags.join(', ')}
                </div>
            )}

            <div className="space-y-6 relative z-10">
                {loading ? (
                    <div className="text-center py-20 text-gray-400">여행지를 찾고 있어요...</div>
                ) : contents.length === 0 ? (
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
