import React from 'react';

// DetailPage에서 사용할 기본 이미지 URL을 여기에서도 정의 (일관성 유지)
const DEFAULT_IMAGE_URL = 'https://placehold.co/800x500/374151/ffffff?text=DETAIL+IMAGE+PLACEHOLDER';

/**
 * 콘텐츠 상세 정보 표시 컴포넌트
 * @param {object} content - 상세 콘텐츠 데이터 객체
 * @param {function} getImageUrl - 이미지 URL 처리 함수
 */
const ContentInfo = ({ content, getImageUrl }) => {
    // content 데이터가 없으면 렌더링하지 않음 (오류 방지)
    if (!content) {
        return null;
    }

    const mainImageUrl = getImageUrl(content.main_image_url);
    const guideName = content.guide_name || "공식 가이드";

    return (
        <div className="space-y-8">
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
                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE_URL; }}
                />
            </div>

            {/* 가이드 정보 */}
            <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-md">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-indigo-600">{guideName ? guideName[0].toUpperCase() : '?'}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{guideName}</p>
                        <div className="text-sm text-gray-500 flex items-center space-x-1 flex-wrap">
                             {/* DetailPage에서 전달받은 props 사용 */}
                            <span>상품:⭐ {content.rating ? content.rating.toFixed(1) : 'N/A'}</span>
                            <span>({content.review_count || 0} 리뷰)</span> {/* review_count 사용 */}
                            <span className="mx-1">|</span>
                            <span>가이드:⭐ {content.guide_avg_rating ? content.guide_avg_rating.toFixed(1) : 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div className="space-x-2 flex-shrink-0">
                    <button className="text-gray-500 hover:text-red-500 transition text-xl p-1">❤️</button>
                    <button className="text-gray-500 hover:text-indigo-600 transition text-xl p-1">💬</button>
                </div>
            </div>
             
            {/* 상세 설명 */}
            <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                <h2 className="text-xl font-bold text-indigo-600 border-b pb-2 mb-4">
                    여행 코스 필수 코스! 🎒
                </h2>
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed break-words">
                    {content.description || "상세 설명이 제공되지 않았습니다."}
                </p>
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
        </div>
    );
};

export default ContentInfo;
