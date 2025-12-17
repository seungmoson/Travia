import React from 'react';

const ReviewItem = ({ review }) => {
    if (!review || !review.user) {
        return null;
    }

    const ratingStars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

    return (
        <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-md border border-gray-100">
            <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {review.user[0]?.toUpperCase() || '?'}
                </div>
            </div>
            <div className="flex-grow">
                <div className="flex justify-between items-center">
                    <p className="font-bold text-gray-800">{review.user}</p>
                </div>
                <p className="text-xs text-indigo-600">{review.profileAge}</p>
                <div className="text-sm text-yellow-500 my-1">
                    {ratingStars}
                    <span className="ml-2 text-xs text-gray-500">{review.rating?.toFixed(1) || 'N/A'}점</span>
                </div>
                <p className="text-gray-700 leading-snug mt-1">{review.text}</p>
            </div>
        </div>
    );
};

const ReviewList = ({ reviews }) => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
        return (
             <div className="space-y-4">
                 <p className="text-sm text-gray-500 p-4 text-center">작성된 리뷰가 없습니다.</p>
             </div>
         );
    }

    return (
        <div className="space-y-4">
            {reviews.map(review => (
                <ReviewItem key={review.id} review={review} />
            ))}
        </div>
    );
};
export default ReviewList;
