import React, { useState, useEffect, useCallback, useRef } from 'react';
import RelatedContentList from './RelatedContentList';
import { ThreeDots } from 'react-loader-spinner';

const API_BASE_URL = 'https://guidie.duckdns.org';
const RELATED_PER_PAGE = 4;
const RelatedContentSection = ({ contentId, initialRelatedContents, totalRelated, navigateTo }) => {
    const [relatedContents, setRelatedContents] = useState(initialRelatedContents || []);
    const [relatedCurrentPage, setRelatedCurrentPage] = useState(1);
    const [loadingMoreRelated, setLoadingMoreRelated] = useState(false);
    const [hasMoreRelated, setHasMoreRelated] = useState(true);
    const relatedObserverRef = useRef(null);
    useEffect(() => {
        const initialData = initialRelatedContents || [];
        setRelatedContents(initialData);
        setRelatedCurrentPage(1);
        const moreAvailable = totalRelated > 0 && initialData.length < totalRelated;
        setHasMoreRelated(moreAvailable);
    }, [contentId, initialRelatedContents, totalRelated]);

    const loadMoreRelatedContents = useCallback(async () => {
        if (loadingMoreRelated || !hasMoreRelated || !contentId) {
            return;
        }
        setLoadingMoreRelated(true);
        const nextPage = relatedCurrentPage + 1;

        try {
            const response = await fetch(`${API_BASE_URL}/content/${contentId}?related_page=${nextPage}&related_per_page=${RELATED_PER_PAGE}`);
            if (!response.ok) throw new Error(`Failed to fetch more related content (status: ${response.status})`);
            const data = await response.json();
            const newRelated = data.related_contents || [];

            if (newRelated.length > 0) {
                setRelatedContents(prevRelated => {
                    const existingIds = new Set(prevRelated.map(c => c.id));
                    const uniqueNew = newRelated.filter(c => !existingIds.has(c.id));
                    const updatedRelated = [...prevRelated, ...uniqueNew];
                    const moreAvailable = updatedRelated.length < totalRelated;
                    setHasMoreRelated(moreAvailable);
                    return updatedRelated;
                });
                setRelatedCurrentPage(nextPage);
            } else {
                setHasMoreRelated(false);
            }
        } catch (err) {
            console.error(`추가 관련 콘텐츠 로딩 중 오류 발생:`, err);
            setHasMoreRelated(false);
        } finally {
            setLoadingMoreRelated(false);
        }
    }, [loadingMoreRelated, hasMoreRelated, relatedCurrentPage, contentId, totalRelated]);

    useEffect(() => {
        const currentRef = relatedObserverRef.current;
        if (!currentRef) {
             return () => {};
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingMoreRelated && hasMoreRelated) {
                    loadMoreRelatedContents();
                } else if (entries[0].isIntersecting) {
                }
            }, { root: null, rootMargin: '0px', threshold: 0.1 }
        );

        observer.observe(currentRef);

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [loadMoreRelatedContents]);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
                함께 보면 좋은 콘텐츠 ({totalRelated || 0}개)
            </h2>

            {relatedContents.length === 0 && !loadingMoreRelated && ( 
                 <p className="text-center text-sm text-gray-500 py-4">관련 콘텐츠가 없습니다.</p>
             )}
            
            {relatedContents.length > 0 && (
                <RelatedContentList 
                    relatedContents={relatedContents} 
                    navigateTo={navigateTo} />
            )}

            {hasMoreRelated && totalRelated > RELATED_PER_PAGE && (
                 <div ref={relatedObserverRef} className="h-10 flex justify-center items-center mt-4"> 
                    {loadingMoreRelated && <ThreeDots color="#4f46e5" height={40} width={40} />}
                 </div>
            )}
             {!loadingMoreRelated && !hasMoreRelated && totalRelated > 0 && (
                 <p className="text-sm text-gray-500 text-center mt-4">모든 관련 콘텐츠를 불러왔습니다.</p>
            )}
        </div>
    );
};
export default RelatedContentSection;
