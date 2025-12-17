import React, { useState } from 'react';

const API_BASE_URL = 'https://guidie.duckdns.org';
const StarRating = ({ rating, setRating }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button" // form submit 방지
          className={`text-3xl ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
          onClick={() => setRating(star)}>
          ★
        </button>
      ))}
    </div>
  );
};

const ReviewModal = ({ booking, onClose, onReviewSubmitSuccess }) => {
  const [contentRating, setContentRating] = useState(0);
  const [contentComment, setContentComment] = useState('');
  const [guideRating, setGuideRating] = useState(0);
  const [guideComment, setGuideComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (contentRating === 0 || guideRating === 0) {
      setError('상품 및 가이드 별점을 모두 선택해주세요.');
      return;
    }
    if (!contentComment.trim() || !guideComment.trim()) {
      setError('상품 및 가이드 리뷰 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('로그인이 만료되었습니다. 다시 로그인해주세요.');
      setIsSubmitting(false);
      onClose();
      return;
    }

    const headers = {'Content-Type': 'application/json',Authorization: `Bearer ${token}`,};
    const contentReviewData = {booking_id: booking.booking_id,rating: contentRating,comment: contentComment,};
    const guideReviewData = {booking_id: booking.booking_id,rating: guideRating,comment: guideComment,};

    try {
      const [contentResponse, guideResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/reviews/content`, {
          method: 'POST',
          headers,
          body: JSON.stringify(contentReviewData),
        }),
        fetch(`${API_BASE_URL}/reviews/guide`, {
          method: 'POST',
          headers,
          body: JSON.stringify(guideReviewData),
        }),
      ]);

      if (!contentResponse.ok || !guideResponse.ok) {
        const contentError = !contentResponse.ok ? await contentResponse.json().catch(() => ({})) : {};
        const guideError = !guideResponse.ok ? await guideResponse.json().catch(() => ({})) : {};
        throw new Error(
          contentError.detail || guideError.detail || '리뷰 등록에 실패했습니다.'
        );
      }

      alert('리뷰가 성공적으로 등록되었습니다.');
      onReviewSubmitSuccess(booking.booking_id);
      onClose();

    } catch (err) {
      console.error('Failed to submit reviews:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            "{booking.content_title}" 리뷰 작성
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 text-3xl">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="p-4 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-indigo-700">
              1. 상품은 어떠셨나요?
            </h3>
            <StarRating rating={contentRating} setRating={setContentRating} />
            <textarea
              value={contentComment}
              onChange={(e) => setContentComment(e.target.value)}
              placeholder="상품에 대한 솔직한 리뷰를 남겨주세요. (예: 코스가 알찼어요)"
              className="w-full mt-3 p-3 border rounded-md min-h-[100px] focus:ring-2 focus:ring-indigo-300"
              disabled={isSubmitting}/>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-green-700">
              2. 가이드는 어떠셨나요?
            </h3>
            <StarRating rating={guideRating} setRating={setGuideRating} />
            <textarea
              value={guideComment}
              onChange={(e) => setGuideComment(e.target.value)}
              placeholder="가이드님에 대한 리뷰를 남겨주세요. (예: 설명이 친절하고 재미있었어요)"
              className="w-full mt-3 p-3 border rounded-md min-h-[100px] focus:ring-2 focus:ring-green-300"
              disabled={isSubmitting}/>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition">
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50">
              {isSubmitting ? '등록 중...' : '리뷰 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ReviewModal;
