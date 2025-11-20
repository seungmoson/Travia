import React from 'react';
import { Heart, Star } from 'lucide-react';

// 이미지 없을 때 보여줄 기본 이미지
const DEFAULT_IMAGE_URL = 'https://placehold.co/400x250/374151/ffffff?text=Image+Unavailable';
const DUMMY_STORAGE_DOMAIN = 'travia-storage.com';

// ==============================================================
// 1. [내부 컴포넌트] ContentCard (안전장치 추가됨)
// ==============================================================
const ContentCard = ({ content, navigateTo }) => {
    // [안전장치 1] content 자체가 없으면 아무것도 그리지 않음
    if (!content) return null;

    // [안전장치 2] Elasticsearch 데이터(_source)와 일반 DB 데이터 호환
    // data가 undefined일 경우를 대비해 빈 객체 {}를 할당
    const data = content._source || content || {};

    // [안전장치 3] 옵셔널 체이닝 (?.) 사용
    // data.image_url이 없을 때 에러가 나지 않도록 ?. 연산자 사용
    const mainImage = data?.image_url || data?.main_image_url;

    // URL 유효성 검사
    const isUrlValid = mainImage && 
        (mainImage.startsWith('http') || mainImage.startsWith('/')) && 
        !mainImage.includes(DUMMY_STORAGE_DOMAIN);

    const imageUrl = isUrlValid ? mainImage : DEFAULT_IMAGE_URL;

    // ID 추출
    const contentId = content.id || content._id || data?.id;

    return (
        <div 
            className="group cursor-pointer bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            onClick={() => navigateTo('detail', contentId)}
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
                </div>
            </div>
        </div>
    );
};

// ==============================================================
// 2. [메인 컴포넌트] ContentList
// ==============================================================
const ContentList = ({ contents, navigateTo }) => {
    // 리스트가 비어있거나 없을 경우 처리
    if (!contents || !Array.isArray(contents) || contents.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {contents.map((content, index) => {
                // 데이터가 null인 요소는 렌더링하지 않음
                if (!content) return null;

                // 고유 키값 생성 (ID가 없으면 인덱스 사용)
                const key = content.id || content._id || index;
                
                return (
                    <ContentCard 
                        key={key} 
                        content={content} 
                        navigateTo={navigateTo} 
                    />
                );
            })}
        </div>
    );
};

export default ContentList;