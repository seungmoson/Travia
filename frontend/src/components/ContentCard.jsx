import React from 'react';

// 유효하지 않은 로컬 경로를 대체할 범용적인 플레이스홀더 URL
const DEFAULT_IMAGE_URL = 'https://placehold.co/400x250/374151/ffffff?text=Image+Unavailable';
// 백엔드 Seed 데이터에 사용된 더미 스토리지 도메인
const DUMMY_STORAGE_DOMAIN = 'travia-storage.com';

/**
 * 콘텐츠 목록의 단일 카드를 렌더링하고 클릭 시 상세 페이지로 이동시킵니다.
 */
const ContentCard = ({ content, navigateTo }) => {
    // 💡 개선된 이미지 URL 처리 로직
    // 1. content.main_image_url이 유효한 HTTP/HTTPS URL이 아니거나
    // 2. Seed 데이터에 사용된 더미 도메인(travia-storage.com)을 포함하는 경우
    //    플레이스홀더를 사용합니다.

    // ▼ [수정] 'http'로 시작하거나 '/' (로컬 public 경로)로 시작하는 경우 모두 유효 처리
    const isUrlValid =
        content.main_image_url &&
        (content.main_image_url.startsWith('http') || content.main_image_url.startsWith('/')) &&
        !content.main_image_url.includes(DUMMY_STORAGE_DOMAIN);

    const imageUrl = isUrlValid
        ? content.main_image_url
        : DEFAULT_IMAGE_URL;

    return (
        <div
            className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:translate-y-[-4px] cursor-pointer border border-gray-100"
            // 🎯 이 부분은 이전에 'content.id'로 올바르게 수정되었습니다.
            onClick={() => navigateTo('detail', content.id)}
        >
            <img
                src={imageUrl}
                alt={content.title}
                className="w-full h-48 object-cover"
                // onError 핸들러는 이제 로직에서 처리되므로 단순화하거나 제거할 수 있지만, 
                // 최종 폴백(fallback)을 위해 유지합니다.
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_IMAGE_URL;
                }}
            />
            <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 truncate">{content.title}</h3>
                <p className="text-sm text-indigo-600 font-medium mt-1">{content.location || '국내 투어'}</p>
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{content.description || '상세 설명 없음'}</p>
                <div className="mt-3 flex justify-between items-center">
                    <span className="text-lg font-extrabold text-green-600">{content.price ? `${content.price.toLocaleString()}원` : '문의'}</span>
                    <button
                        // 버튼 클릭 시도 동일한 navigateTo 호출 (Card 영역 클릭 유도)
                        onClick={(e) => {
                            e.stopPropagation(); // 카드 전체 클릭 이벤트와의 중복 방지
                            // 🎯 이 부분도 'content.id'로 올바르게 수정되었습니다.
                            navigateTo('detail', content.id);
                        }}
                        className="text-sm text-indigo-500 font-semibold hover:text-indigo-700 transition duration-150"
                    >
                        상세 보기 →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContentCard;