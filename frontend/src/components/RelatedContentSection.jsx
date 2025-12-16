import React, { useState, useEffect, useCallback, useRef } from 'react';
import RelatedContentList from './RelatedContentList'; // RelatedContentList 컴포넌트 import
import { ThreeDots } from 'react-loader-spinner'; // 로딩 스피너 import

const API_BASE_URL = 'http://localhost:8000';
const RELATED_PER_PAGE = 4; // 페이지당 로드할 관련 콘텐츠 개수

/**
 * 관련 콘텐츠 목록 및 무한 스크롤 섹션 컴포넌트
 * @param {string | number} contentId - 현재 콘텐츠 ID
 * @param {Array<object>} initialRelatedContents - 초기 로드 데이터
 * @param {number} totalRelated - 전체 개수
 * @param {function} navigateTo - 이동 함수
 * @param {function} getImageUrl - [중요] 이미지 주소 변환 함수 (부모에게서 받음)
 */
// ▼▼▼ [수정 1] props에 getImageUrl 추가 ▼▼▼
const RelatedContentSection = ({ contentId, initialRelatedContents, totalRelated, navigateTo, getImageUrl }) => {
    
    // --- 관련 콘텐츠 목록 및 무한 스크롤 상태 ---
    const [relatedContents, setRelatedContents] = useState(initialRelatedContents || []);
    const [relatedCurrentPage, setRelatedCurrentPage] = useState(1);
    const [loadingMoreRelated, setLoadingMoreRelated] = useState(false);
    const [hasMoreRelated, setHasMoreRelated] = useState(true);
    const relatedObserverRef = useRef(null);

    // --- Props 변경 시 상태 초기화 ---
    useEffect(() => {
        const initialData = initialRelatedContents || [];
        setRelatedContents(initialData);
        setRelatedCurrentPage(1);
        const moreAvailable = totalRelated > 0 && initialData.length < totalRelated;
        setHasMoreRelated(moreAvailable);
    }, [contentId, initialRelatedContents, totalRelated]);


    // --- 추가 관련 콘텐츠 로드 함수 ---
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


    // --- Intersection Observer 설정 ---
    useEffect(() => {
        const currentRef = relatedObserverRef.current;
        if (!currentRef) return () => {};

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingMoreRelated && hasMoreRelated) {
                    loadMoreRelatedContents();
                }
            }, { root: null, rootMargin: '0px', threshold: 0.1 }
        );

        observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, [loadMoreRelatedContents, loadingMoreRelated, hasMoreRelated]);


    // --- 렌더링 ---
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
                함께 보면 좋은 콘텐츠 ({totalRelated || 0}개)
            </h2>
            
            {/* 관련 콘텐츠가 없을 때 메시지 */}
            {relatedContents.length === 0 && !loadingMoreRelated && ( 
                 <p className="text-center text-sm text-gray-500 py-4">관련 콘텐츠가 없습니다.</p>
             )}
            
            {/* 관련 콘텐츠 목록 렌더링 */}
            {relatedContents.length > 0 && (
                <RelatedContentList 
                    relatedContents={relatedContents} 
                    navigateTo={navigateTo}
                    // ▼▼▼ [수정 2] 자식 컴포넌트에게 getImageUrl 전달! ▼▼▼
                    getImageUrl={getImageUrl}
                    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
                />
            )}

            {/* Observer 타겟 및 로딩 상태 표시 */}
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