import React from 'react';

// --- 관련 콘텐츠 카드 컴포넌트 (수정) ---
// props: id, title, time, price(string), rating, imageUrl, navigateTo
const RelatedContentCard = ({ id, title, time, price, rating, imageUrl, navigateTo }) => {
    // 💡 이미지 URL 처리: DB에서 받은 imageUrl 사용, 없으면 플레이스홀더
    const displayImageUrl = imageUrl || 'https://placehold.co/64x64/f0f4f8/374151?text=R';
    // 💡 평점 처리: null일 경우 대비
    const displayRating = rating ? rating.toFixed(1) : 'N/A';
    // 💡 가격 처리: DB에서 문자열("60,000")로 오므로 그대로 사용, 없으면 "문의"
    const displayPrice = price || '문의';

    return (
        // 💡 카드 전체를 클릭 가능하게 하고 navigateTo 호출
        <div 
            className="flex space-x-3 p-3 bg-white rounded-xl shadow-md border border-gray-100 transition duration-200 hover:shadow-lg cursor-pointer"
            onClick={() => navigateTo('detail', id)} // 💡 클릭 시 상세 페이지 이동
        >
            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                <img
                    src={displayImageUrl} // 💡 DB 이미지 URL 사용
                    alt={title} // 💡 실제 제목으로 alt 텍스트 변경
                    className="w-full h-full object-cover"
                    onError={(e) => { // 💡 이미지 로드 실패 시 플레이스홀더
                        e.target.onerror = null; 
                        e.target.src = 'https://placehold.co/64x64/f0f4f8/374151?text=R';
                    }}
                />
            </div>
            <div className="flex-grow">
                {/* 💡 [금랑저잣거리] 제거, 실제 제목 사용 */}
                <p className="font-semibold text-sm text-gray-800 leading-tight line-clamp-2">
                    {title}
                </p>
                <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                    {/* 💡 시간 정보가 있을 때만 표시 (선택 사항) */}
                    {time && <span>{time}</span>}
                    {/* 💡 가격 정보 표시 (₩ 접두사 추가) */}
                    <span>₩{displayPrice}</span> 
                    {/* 💡 평점 표시 */}
                    <span className="text-yellow-500">⭐ {displayRating}</span>
                </div>
            </div>
        </div>
    );
};


// --- 관련 콘텐츠 목록 컴포넌트 (수정) ---
// props: relatedContents (배열), navigateTo (함수)
const RelatedContentList = ({ relatedContents, navigateTo }) => {
    // 🚨 내부 목업 데이터 삭제
    // const mockRelated = [ ... ];

    // 💡 relatedContents가 배열이 아니거나 비어있을 경우 표시할 내용 (선택 사항)
    if (!Array.isArray(relatedContents) || relatedContents.length === 0) {
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">함께 보면 좋은 콘텐츠</h2>
                <p className="text-sm text-gray-500 p-4 text-center">관련된 콘텐츠가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 💡 DetailPage에서 제목을 이미 렌더링하므로 여기서는 제거 (선택 사항) */}
            {/* <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">함께 보면 좋은 콘텐츠</h2> */}

            {/* 💡 props로 받은 relatedContents 배열을 map()으로 돌림 */}
            {relatedContents.map(item => (
                <RelatedContentCard
                    key={item.id}
                    id={item.id}           // 💡 카드 클릭 시 필요
                    title={item.title}
                    time={item.time}         // 💡 API 응답에 time 필드 필요
                    price={item.price}       // 💡 API 응답 (문자열 "60,000")
                    rating={item.rating}     // 💡 API 응답 (숫자 4.2)
                    imageUrl={item.imageUrl} // 💡 API 응답 (/beach.png 등)
                    navigateTo={navigateTo} // 💡 함수 전달
                />
            ))}
        </div>
    );
};

export default RelatedContentList;