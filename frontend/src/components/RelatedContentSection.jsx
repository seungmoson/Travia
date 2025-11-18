import React, { useState, useEffect, useCallback, useRef } from 'react';
import RelatedContentList from './RelatedContentList'; // RelatedContentList 컴포넌트 import
import { ThreeDots } from 'react-loader-spinner'; // 로딩 스피너 import (npm install react-loader-spinner 필요)

const API_BASE_URL = 'http://localhost:8000';
const RELATED_PER_PAGE = 4; // 페이지당 로드할 관련 콘텐츠 개수

/**
 * 관련 콘텐츠 목록 및 무한 스크롤 섹션 컴포넌트
 * @param {string | number} contentId - 현재 콘텐츠 ID (API 호출 시 제외하기 위해)
 * @param {Array<object>} initialRelatedContents - DetailPage에서 초기에 로드한 관련 콘텐츠 목록
 * @param {number} totalRelated - 이 콘텐츠와 관련된 전체 콘텐츠 개수
 * @param {function} navigateTo - 페이지 이동 함수 (RelatedContentList에 전달)
 */
const RelatedContentSection = ({ contentId, initialRelatedContents, totalRelated, navigateTo }) => {
    // --- 관련 콘텐츠 목록 및 무한 스크롤 상태 ---
    const [relatedContents, setRelatedContents] = useState(initialRelatedContents || []);
    const [relatedCurrentPage, setRelatedCurrentPage] = useState(1);
    const [loadingMoreRelated, setLoadingMoreRelated] = useState(false);
    //  초기 상태 계산 단순화
    const [hasMoreRelated, setHasMoreRelated] = useState(true);
    const relatedObserverRef = useRef(null);

    // --- ▼  Props 변경 시 상태 초기화 및 hasMore 계산 로직 강화 ▼ ---
    useEffect(() => {
        const initialData = initialRelatedContents || [];
        setRelatedContents(initialData);
        setRelatedCurrentPage(1);
        // 전체 개수가 0이거나, 초기 로드된 개수가 전체 개수 이상이면 더 로드할 필요 없음
        const moreAvailable = totalRelated > 0 && initialData.length < totalRelated;
        setHasMoreRelated(moreAvailable);
    }, [contentId, initialRelatedContents, totalRelated]);

    // --- 추가 관련 콘텐츠 로드 함수 ---
    const loadMoreRelatedContents = useCallback(async () => {
        // 디버깅 로그 제거
        if (loadingMoreRelated || !hasMoreRelated || !contentId) {
            return;
        }
        setLoadingMoreRelated(true);
        const nextPage = relatedCurrentPage + 1;
        // 디버깅 로그 제거

        try {
            const response = await fetch(`${API_BASE_URL}/content/${contentId}?related_page=${nextPage}&related_per_page=${RELATED_PER_PAGE}`);
            // 디버깅 로그 제거
            if (!response.ok) throw new Error(`Failed to fetch more related content (status: ${response.status})`);
            const data = await response.json();
            const newRelated = data.related_contents || [];
            // 디버깅 로그 제거

            if (newRelated.length > 0) {
                setRelatedContents(prevRelated => {
                    const existingIds = new Set(prevRelated.map(c => c.id));
                    const uniqueNew = newRelated.filter(c => !existingIds.has(c.id));
                    const updatedRelated = [...prevRelated, ...uniqueNew];
                    // [버그 수정] 상태 업데이트 콜백 내에서 hasMore 상태를 정확히 계산
                    const moreAvailable = updatedRelated.length < totalRelated;
                    setHasMoreRelated(moreAvailable);
                    // 디버깅 로그 제거
                    return updatedRelated;
                });
                setRelatedCurrentPage(nextPage);
            } else {
                // 디버깅 로그 제거
                setHasMoreRelated(false);
            }
        } catch (err) {
            console.error(`추가 관련 콘텐츠 로딩 중 오류 발생:`, err); // 에러 로그는 유지
            setHasMoreRelated(false);
        } finally {
            setLoadingMoreRelated(false);
        }
    }, [loadingMoreRelated, hasMoreRelated, relatedCurrentPage, contentId, totalRelated]);


    // --- Intersection Observer 설정 ---
    useEffect(() => {
        const currentRef = relatedObserverRef.current;
        if (!currentRef) {
             // 디버깅 로그 제거
             return () => {};
        }

        const observer = new IntersectionObserver(
            (entries) => {
                 // 디버깅 로그 제거
                if (entries[0].isIntersecting && !loadingMoreRelated && hasMoreRelated) {
                    // 디버깅 로그 제거
                    loadMoreRelatedContents();
                } else if (entries[0].isIntersecting) {
                     // 디버깅 로그 제거
                }
            }, { root: null, rootMargin: '0px', threshold: 0.1 }
        );

        observer.observe(currentRef);
        // 디버깅 로그 제거

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
                // 디버깅 로그 제거
            }
        };
    }, [loadMoreRelatedContents]);

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
                />
            )}

            {/* Observer 타겟 및 로딩 상태 표시 */}
            {/* --- ▼  JSX 문법 오류 수정 ▼ --- */}
            {hasMoreRelated && totalRelated > RELATED_PER_PAGE && (
                 <div ref={relatedObserverRef} className="h-10 flex justify-center items-center mt-4"> 
                    {loadingMoreRelated && <ThreeDots color="#4f46e5" height={40} width={40} />}
                 </div>
            )}
            {/* --- ▲ [수정 완료] ▲ --- */}
             {!loadingMoreRelated && !hasMoreRelated && totalRelated > 0 && (
                 <p className="text-sm text-gray-500 text-center mt-4">모든 관련 콘텐츠를 불러왔습니다.</p>
            )}
        </div>
    );
};

export default RelatedContentSection;

