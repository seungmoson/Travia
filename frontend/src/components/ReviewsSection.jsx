import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReviewList from './ReviewList';
import { ThreeDots } from 'react-loader-spinner';

const API_BASE_URL = 'https://guidie.duckdns.org';
const REVIEWS_PER_PAGE = 5;
const ReviewsSection = ({ contentId, initialReviews, totalReviews }) => {
    const [reviews, setReviews] = useState(initialReviews || []);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreReviews, setHasMoreReviews] = useState((initialReviews || []).length < totalReviews);
    const observerRef = useRef(null);

    useEffect(() => {
        setReviews(initialReviews || []);
        setCurrentPage(1);
        setHasMoreReviews((initialReviews || []).length < totalReviews);
    }, [contentId, initialReviews, totalReviews]);

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

    useEffect(() => {
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
    }, [loadMoreReviews, loadingMore, hasMoreReviews]);

    return (
        <div className="pt-8 border-t border-gray-200 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">
                리뷰 ({totalReviews || 0}개)
            </h2>
            
            {reviews.length === 0 && !loadingMore && (
                 <p className="text-center text-gray-500 py-4">아직 작성된 리뷰가 없습니다.</p>
             )}
            {reviews.length > 0 && <ReviewList reviews={reviews} />}

            {totalReviews > REVIEWS_PER_PAGE && (
                 <div ref={observerRef} className="h-10 flex justify-center items-center">
                    {loadingMore && <ThreeDots color="#4f46e5" height={40} width={40} />}
                    {!loadingMore && !hasMoreReviews && reviews.length > 0 && (
                        <p className="text-sm text-gray-500">모든 리뷰를 불러왔습니다.</p>
                    )}
                </div>
            )}
        </div>
    );
};
export default ReviewsSection;
