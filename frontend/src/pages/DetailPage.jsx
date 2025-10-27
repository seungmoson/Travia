import React, { useState, useEffect } from 'react';
// 분리된 컴포넌트 import (pages 폴더 기준 상대 경로로 복원)
import BookingBox from '../components/BookingBox.jsx';
import ReviewList from '../components/ReviewList.jsx';
import RelatedContentList from '../components/RelatedContentList.jsx';

// 백엔드 기본 URL을 정의합니다. (FastAPI 기본 포트 8000 가정)
const API_BASE_URL = 'http://localhost:8000';
// 이미지 로딩 오류를 방지하기 위한 안전 장치
const DUMMY_STORAGE_DOMAIN = 'travia-storage.com';
const DEFAULT_IMAGE_URL = 'https://placehold.co/800x500/374151/ffffff?text=DETAIL+IMAGE+PLACEHOLDER';

/**
 * DB URL을 검사하여 유효하지 않거나 더미 도메인일 경우 Placeholder URL을 반환
 */
const getImageUrl = (url) => {
    // ▼ [수정] 'http' 또는 'https' 뿐만 아니라 '/'로 시작하는 로컬 public 경로도 유효 처리
    const isUrlValid =
        url &&
        (url.startsWith('http') || url.startsWith('https') || url.startsWith('/')) &&
        !url.includes(DUMMY_STORAGE_DOMAIN);

    // 2. 유효하지 않거나 로컬/더미 경로일 경우 Placeholder 이미지를 반환
    return isUrlValid ? url : DEFAULT_IMAGE_URL;
};

/**
 * 상세 페이지 컴포넌트
 * @param {string | number} contentId - App.jsx에서 전달받은 현재 콘텐츠 ID
 * @param {function} navigateTo - 페이지 이동 함수
 * @param {object} user - 현재 사용자 정보
 */
function DetailPage({ contentId, navigateTo, user }) {
    // 상태 관리: 상세 콘텐츠 데이터, 로딩 상태, 에러 메시지
    const [content, setContent] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [relatedContents, setRelatedContents] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- [로그 제거] ---
    // console.log("DetailPage received user prop:", user);

    // 데이터 페칭 로직
    useEffect(() => {
        // --- [로그 제거] ---
        // console.log(`DetailPage useEffect running for contentId: ${contentId}`);

        if (!contentId) {
            setError("콘텐츠 ID가 유효하지 않습니다.");
            setLoading(false);
            return;
        }

        const fetchContentDetail = async () => {
            // --- [로그 제거] ---
            // console.log(`Fetching details for content ID: ${contentId}`);
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${API_BASE_URL}/content/${contentId}`);
                // --- [로그 제거] ---
                // console.log(`API response status for ${contentId}: ${response.status}`);

                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`데이터 로딩 실패 (상태: ${response.status}, 응답: ${errorData.substring(0, 100)}...)`);
                }

                const data = await response.json();
                // --- [로그 제거] ---
                // console.log(`Received data for ${contentId}:`, data);
                setContent(data);
                setReviews(data.reviews || []);
                setRelatedContents(data.related_contents || []);

            } catch (err) {
                // [유지] console.error는 실제 오류 로깅을 위해 유지합니다.
                console.error(`상세 데이터 로딩 중 오류 발생 (ID: ${contentId}):`, err);
                setError(err.message);
            } finally {
                setLoading(false);
                // --- [로그 제거] ---
                // console.log(`Finished fetching details for content ID: ${contentId}`);
            }
        };

        fetchContentDetail();
    }, [contentId]); // contentId가 바뀔 때만 API 호출

    // 로딩 및 오류 상태 렌더링
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl text-indigo-600 font-semibold">상세 데이터 로딩 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-100 border border-red-400 text-red-700 rounded-lg m-8">
                <h1 className="text-2xl font-bold mb-2">상세 정보 로딩 오류</h1>
                <p>{error}</p>
                <button
                    onClick={() => navigateTo('main')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    메인으로 돌아가기
                </button>
            </div>
        );
    }

    // content 데이터 로드 실패 또는 데이터 없음
    if (!content) {
        // --- [로그 제거] ---
        // console.log("Content data is null, rendering 'Not Found'.");
        return <div className="p-8 text-center">요청하신 콘텐츠를 찾을 수 없습니다. (ID: {contentId})</div>;
    }

    // 최종 상세 페이지 렌더링
    const mainImageUrl = getImageUrl(content.main_image_url);
    const guideName = content.guide_name || "공식 가이드";

    return (
        <div className="p-4 sm:p-8">
            {/* --- [로그 제거] --- */}
            {/* {console.log(">>> DetailPage rendering JSX, user:", user)} */}

            <div className="flex flex-col lg:flex-row gap-8">

                {/* 왼쪽 메인 콘텐츠 (너비 8/12) */}
                <div className="w-full lg:w-8/12 space-y-8">

                    {/* 타이틀 및 이미지 */}
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
                            [{content.location || "지역"}] {content.title || "제목 없음"}
                            <span className="ml-3 text-2xl text-yellow-500">✨</span>
                        </h1>
                        <img
                            src={mainImageUrl}
                            alt={content.title}
                            className="w-full h-auto object-cover rounded-xl shadow-xl"
                            style={{ aspectRatio: '16/9' }}
                            // 이미지 로드 실패 시 대체 이미지 (선택 사항, getImageUrl에서 이미 처리)
                            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE_URL; }}
                        />
                    </div>

                    {/* 가이드 정보 및 액션 버튼 */}
                    <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-md">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                {/* 가이드 이름 첫 글자 (없으면 ?) */}
                                <span className="text-lg font-bold text-indigo-600">{guideName ? guideName[0].toUpperCase() : '?'}</span>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">가이드: {guideName}</p>
                                <div className="text-sm text-gray-500 flex items-center space-x-1">
                                    {/* DB에서 가져온 평점/리뷰 수 사용 */}
                                    <span>⭐ {content.rating ? content.rating.toFixed(1) : 'N/A'}</span>
                                    <span>|</span>
                                    <span>{content.review_count || 0} 리뷰</span>
                                </div>
                            </div>
                        </div>
                        {/* 임시 액션 버튼 */}
                        <div className="space-x-2">
                            <button className="text-gray-500 hover:text-red-500 transition">❤️</button>
                            <button className="text-gray-500 hover:text-indigo-600 transition">💬</button>
                        </div>
                    </div>

                    {/* 상세 설명 (Description) */}
                    <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                        <h2 className="text-xl font-bold text-indigo-600 border-b pb-2 mb-4">
                            여행 코스 필수 코스! 🎒
                        </h2>
                        <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                            {content.description || "상세 설명이 제공되지 않았습니다."}
                        </p>

                        {/* 실제 태그 표시 */}
                        <div className="flex flex-wrap gap-2 text-sm pt-4 border-t mt-4">
                            {content.tags && content.tags.length > 0 ? (
                                content.tags.map((tag) => (
                                    <span key={tag} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                                        #{tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500 italic">관련 태그 없음</span>
                            )}
                        </div>
                    </div>

                    {/* 리뷰 목록 (왼쪽 컬럼) */}
                    <div className="pt-8 border-t border-gray-200 space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">
                            리뷰 ({reviews.length}개)
                        </h2>
                        {/* ReviewList 컴포넌트에 reviews 상태 전달 */}
                        <ReviewList reviews={reviews} />
                    </div>

                </div> {/* --- 왼쪽 메인 콘텐츠 (확장 영역) 종료 --- */}


                {/* 오른쪽 예약 박스 (너비 4/12) */}
                <div className="w-full lg:w-4/12">
                    <div className="lg:sticky lg:top-20 space-y-6">
                        {/* BookingBox 컴포넌트에 필요한 props 전달 */}
                        <BookingBox user={user} navigateTo={navigateTo} contentId={contentId} />

                        {/* 관련 콘텐츠 (sticky 내부) */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">
                                함께 보면 좋은 콘텐츠
                            </h2>
                            {/* RelatedContentList 컴포넌트에 relatedContents 상태 전달 */}
                            <RelatedContentList relatedContents={relatedContents} navigateTo={navigateTo} />
                        </div>
                    </div>
                </div> {/* --- 오른쪽 예약 박스 (고정 영역) 종료 --- */}

            </div> {/* --- 1차 2단 레이아웃(메인 레이아웃) 종료 --- */}

        </div>
    );
}

export default DetailPage;

