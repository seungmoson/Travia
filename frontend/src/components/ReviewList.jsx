import React from 'react';

// --- Review Item Component (Updated Field Names) ---
// Props: review (object from API: id, user, profileAge, rating, text)
const ReviewItem = ({ review }) => {
    // Basic check for review data
    if (!review || !review.user) {
        return null; // Or render some placeholder/error
    }

    // Calculate rating stars
    const ratingStars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

    return (
        <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-md border border-gray-100">
            <div className="flex-shrink-0">
                {/* User profile icon using the first letter of the username */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {review.user[0]?.toUpperCase() || '?'} {/* Add fallback for safety */}
                </div>
            </div>
            <div className="flex-grow">
                <div className="flex justify-between items-center">
                    {/* Use review.user from API */}
                    <p className="font-bold text-gray-800">{review.user}</p>
                    {/* API doesn't provide date, so remove or add logic later if needed */}
                    {/* <p className="text-xs text-gray-500">{review.date}</p> */}
                </div>
                {/* Use review.profileAge from API */}
                <p className="text-xs text-indigo-600">{review.profileAge}</p>
                <div className="text-sm text-yellow-500 my-1">
                    {ratingStars}
                    {/* Use review.rating */}
                    <span className="ml-2 text-xs text-gray-500">{review.rating?.toFixed(1) || 'N/A'}점</span>
                </div>
                {/* Use review.text from API */}
                <p className="text-gray-700 leading-snug mt-1">{review.text}</p>
            </div>
        </div>
    );
};


// --- Review List Component (Uses Props) ---
// Props: reviews (array from DetailPage.jsx)
const ReviewList = ({ reviews }) => {
    // 🚨 Remove internal mock data
    // const mockReviews = [ ... ];

    // Handle cases where reviews might not be an array or is empty
    if (!Array.isArray(reviews) || reviews.length === 0) {
        return (
             <div className="space-y-4">
                 {/* Title is already rendered in DetailPage.jsx */}
                 {/* <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">사용자 리뷰 (0개)</h2> */}
                 <p className="text-sm text-gray-500 p-4 text-center">작성된 리뷰가 없습니다.</p>
             </div>
         );
    }

    return (
        <div className="space-y-4">
            {/* Title is already rendered in DetailPage.jsx, so remove this h2 */}
            {/* <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">사용자 리뷰 ({reviews.length}개)</h2> */}

            {/* Map over the reviews array received from props */}
            {reviews.map(review => (
                <ReviewItem key={review.id} review={review} />
            ))}
        </div>
    );
};

export default ReviewList;