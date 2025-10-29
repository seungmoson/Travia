import React, { useState, useEffect, useCallback, useRef } from 'react';
// --- ▼ [수정] import 경로에서 .jsx 확장자 제거 ▼ ---
import ReviewList from './ReviewList'; // ReviewList 컴포넌트 import
// --- ▲ [수정 완료] ▲ ---
import { ThreeDots } from 'react-loader-spinner'; // 로딩 스피너 import

const API_BASE_URL = 'http://localhost:8000';
const REVIEWS_PER_PAGE = 5; // 페이지당 로드할 리뷰 개수

/**
 * 리뷰 목록 및 무한 스크롤 섹션 컴포넌트
 * @param {string | number} contentId - 현재 콘텐츠 ID
 * @param {Array<object>} initialReviews - DetailPage에서 초기에 로드한 리뷰 목록
 * @param {number} totalReviews - 이 콘텐츠의 전체 리뷰 개수
 */
const ReviewsSection = ({ contentId, initialReviews, totalReviews }) => {
    // --- 리뷰 목록 및 무한 스크롤 상태 ---
    const [reviews, setReviews] = useState(initialReviews || []);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    // 초기 로드된 리뷰 개수와 전체 개수를 비교하여 초기 hasMoreReviews 상태 설정
    const [hasMoreReviews, setHasMoreReviews] = useState((initialReviews || []).length < totalReviews);
    const observerRef = useRef(null);

    // contentId가 변경되면 상태 초기화 (DetailPage 재방문 시)
    useEffect(() => {
        setReviews(initialReviews || []);
        setCurrentPage(1);
        setHasMoreReviews((initialReviews || []).length < totalReviews);
    }, [contentId, initialReviews, totalReviews]);


    // --- 추가 리뷰 로드 함수 ---
    const loadMoreReviews = useCallback(async () => {
        if (loadingMore || !hasMoreReviews || !contentId) {
            return;
        }
        setLoadingMore(true);
        const nextPage = currentPage + 1;

        try {
            const response = await fetch(`${API_BASE_URL}/content/${contentId}?reviews_page=${nextPage}&reviews_per_page=${REVIEWS_PER_PAGE}`);
            if (!response.ok) throw new Error("Failed to fetch more reviews");
            const data = await response.json();
            const newReviews = data.reviews || [];

            if (newReviews.length > 0) {
                setReviews(prevReviews => {
                    const existingIds = new Set(prevReviews.map(r => r.id));
                    const uniqueNew = newReviews.filter(r => !existingIds.has(r.id));
                    const updatedReviews = [...prevReviews, ...uniqueNew];
                    // 상태 업데이트 콜백 내에서 hasMoreReviews 업데이트
                    setHasMoreReviews(updatedReviews.length < totalReviews);
                    return updatedReviews;
                });
                setCurrentPage(nextPage);
            } else {
                setHasMoreReviews(false);
            }
        } catch (err) {
            console.error(`추가 리뷰 로딩 중 오류 발생:`, err);
            setHasMoreReviews(false);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMoreReviews, currentPage, contentId, totalReviews]);


    // --- Intersection Observer 설정 ---
    useEffect(() => {
        // observerRef.current가 없을 경우 Observer 생성 방지
        if (!observerRef.current) return () => {};

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingMore && hasMoreReviews) {
                    loadMoreReviews();
                }
            }, { root: null, rootMargin: '0px', threshold: 0.1 }
        );

        const currentObserverRef = observerRef.current;
        observer.observe(currentObserverRef);

        return () => {
            if (currentObserverRef) observer.unobserve(currentObserverRef);
        };
    }, [loadMoreReviews, loadingMore, hasMoreReviews]); // loading 제거


    // --- 렌더링 ---
    return (
        <div className="pt-8 border-t border-gray-200 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">
                리뷰 ({totalReviews || 0}개)
            </h2>
            
            {/* 리뷰가 없을 때 메시지 */}
            {reviews.length === 0 && !loadingMore && ( // loadingMore 조건 추가
                 <p className="text-center text-gray-500 py-4">아직 작성된 리뷰가 없습니다.</p>
             )}
            
            {/* 리뷰 목록 렌더링 */}
            {reviews.length > 0 && <ReviewList reviews={reviews} />}

            {/* Observer 타겟 및 로딩 상태 표시 */}
            {/* 전체 리뷰 수가 페이지당 리뷰 수보다 클 때만 Observer 표시 */}
            {totalReviews > REVIEWS_PER_PAGE && (
                 <div ref={observerRef} className="h-10 flex justify-center items-center">
                    {loadingMore && <ThreeDots color="#4f46e5" height={40} width={40} />}
                    {!loadingMore && !hasMoreReviews && reviews.length > 0 && ( // reviews.length > 0 조건 추가
                        <p className="text-sm text-gray-500">모든 리뷰를 불러왔습니다.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReviewsSection;

