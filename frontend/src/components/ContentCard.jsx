import React from 'react';
import { Heart, Star } from 'lucide-react';

// 유효하지 않은 로컬 경로를 대체할 범용적인 플레이스홀더 URL
const DEFAULT_IMAGE_URL = 'https://placehold.co/400x250/374151/ffffff?text=Image+Unavailable';
const DUMMY_STORAGE_DOMAIN = 'travia-storage.com';

const ContentCard = ({ content, navigateTo }) => {
    // 1. [안전장치] content가 없으면 렌더링하지 않음
    if (!content) return null;

    // 2. [데이터 정규화] Elasticsearch(_source) 또는 일반 DB 구조 처리
    // content가 있어도 _source가 없을 수 있으므로 빈 객체 {}를 fallback으로 추가
    const data = content._source || content || {};

    // 3. ID 추출 (안전하게 접근)
    const contentId = content.id || content._id || data.id;

    // 4. 이미지 URL 추출 (옵셔널 체이닝 ?. 사용으로 에러 방지)
    // data가 비어있어도 에러가 나지 않도록 ?. 연산자 사용
    const mainImage = data?.image_url || data?.main_image_url;
    
    const isUrlValid = mainImage && 
        (mainImage.startsWith('http') || mainImage.startsWith('/')) && 
        !mainImage.includes(DUMMY_STORAGE_DOMAIN);

    const imageUrl = isUrlValid ? mainImage : DEFAULT_IMAGE_URL;

    return (
        <div 
            className="group cursor-pointer bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            onClick={(e) => {
                // e.stopPropagation(); // 필요시 주석 해제 (상위 이벤트 전파 방지)
                navigateTo('detail', contentId);
            }}
        >
            {/* 이미지 영역 */}
            <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                <img 
                    src={imageUrl} 
                    alt={data?.title || "제목 없음"} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_IMAGE_URL;
                    }}
                />
                <button className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/20 text-white hover:text-rose-500 transition-colors">
                    <Heart size={24} />
                </button>
                
                {data?.status === 'Active' && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 text-gray-800 text-xs font-bold rounded shadow-sm backdrop-blur-sm">
                        예약 가능
                    </div>
                )}
            </div>
            
            {/* 텍스트 정보 */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 truncate text-lg flex-1 mr-2">
                        {data?.title || "제목 없음"}
                    </h3>
                    <div className="flex items-center gap-1 text-sm flex-shrink-0">
                        <Star size={14} className="fill-black text-black" /> 
                        <span>{data?.rating || "4.8"}</span>
                    </div>
                </div>
                
                <p className="text-gray-500 text-sm mb-1">{data?.location || '대한민국'}</p>
                <p className="text-gray-400 text-xs line-clamp-1 mb-3">{data?.description}</p>
                
                <div className="flex items-baseline gap-1 pt-2 border-t border-gray-50">
                    <span className="font-bold text-lg text-gray-900">
                        {data?.price ? `₩${Number(data.price).toLocaleString()}` : '가격 문의'}
                    </span>
                    <span className="text-gray-500 text-sm">/ 박</span>
                </div>
            </div>
        </div>
    );
};

export default ContentCard;