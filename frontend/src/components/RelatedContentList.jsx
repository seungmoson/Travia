import React from 'react';

const RelatedContentCard = ({ id, title, time, price, rating, imageUrl, navigateTo }) => {
    const displayImageUrl = imageUrl || 'https://placehold.co/64x64/f0f4f8/374151?text=R';
    const displayRating = rating ? rating.toFixed(1) : 'N/A';
    const displayPrice = price || '문의';

    return (
        <div 
            className="flex space-x-3 p-3 bg-white rounded-xl shadow-md border border-gray-100 transition duration-200 hover:shadow-lg cursor-pointer"
            onClick={() => navigateTo('detail', id)}
            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                <img
                    src={displayImageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://placehold.co/64x64/f0f4f8/374151?text=R';
                    }}/>
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-sm text-gray-800 leading-tight line-clamp-2">
                    {title}
                </p>
                <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                    {time && <span>{time}</span>}
                    <span>₩{displayPrice}</span> 
                    <span className="text-yellow-500">⭐ {displayRating}</span>
                </div>
            </div>
        </div>
    );
};

const RelatedContentList = ({ relatedContents, navigateTo }) => {
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
            {relatedContents.map(item => (
                <RelatedContentCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    time={item.time}
                    price={item.price}
                    rating={item.rating}
                    imageUrl={item.imageUrl}
                    navigateTo={navigateTo}/>
            ))}
        </div>
    );
};
export default RelatedContentList;
