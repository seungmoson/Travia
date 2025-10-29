import React, { useState } from 'react';

// 백엔드 API 주소
const API_BASE_URL = 'http://localhost:8000';

/**
 * 별점 선택 컴포넌트
 */
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
          onClick={() => setRating(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
};

/**
 * 리뷰 작성 모달
 * @param {object} booking - 리뷰할 예약 정보 (booking_id, content_title 필요)
 * @param {function} onClose - 모달 닫기 함수
 * @param {function} onReviewSubmitSuccess - 리뷰 제출 성공 시 호출될 콜백 (bookingId 전달)
 */
const ReviewModal = ({ booking, onClose, onReviewSubmitSuccess }) => {
  // 1. 상품(Content) 리뷰 상태
  const [contentRating, setContentRating] = useState(0);
  const [contentComment, setContentComment] = useState('');

  // 2. 가이드(Guide) 리뷰 상태
  const [guideRating, setGuideRating] = useState(0);
  const [guideComment, setGuideComment] = useState('');

  // 3. API 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사
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
      onClose(); // 모달 닫고 로그인 페이지로 유도
      return;
    }

    // API 요청 헤더
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 요청 DTO (스키마 참고)
    const contentReviewData = {
      booking_id: booking.booking_id,
      rating: contentRating,
      comment: contentComment,
    };

    const guideReviewData = {
      booking_id: booking.booking_id,
      rating: guideRating,
      comment: guideComment,
    };

    try {
      // 두 개의 API를 동시에 요청
      const [contentResponse, guideResponse] = await Promise.all([
        // 1. 상품 리뷰 API 호출
        fetch(`${API_BASE_URL}/reviews/content`, {
          method: 'POST',
          headers,
          body: JSON.stringify(contentReviewData),
        }),
        // 2. 가이드 리뷰 API 호출
        fetch(`${API_BASE_URL}/reviews/guide`, {
          method: 'POST',
          headers,
          body: JSON.stringify(guideReviewData),
        }),
      ]);

      // 둘 중 하나라도 실패하면 에러 처리
      if (!contentResponse.ok || !guideResponse.ok) {
        // 에러 메시지를 좀 더 상세하게 가져오기 시도
        const contentError = !contentResponse.ok ? await contentResponse.json().catch(() => ({})) : {};
        const guideError = !guideResponse.ok ? await guideResponse.json().catch(() => ({})) : {};
        
        throw new Error(
          contentError.detail || guideError.detail || '리뷰 등록에 실패했습니다.'
        );
      }

      // 성공!
      alert('리뷰가 성공적으로 등록되었습니다.');
      onReviewSubmitSuccess(booking.booking_id); // MyPage의 상태 갱신
      onClose(); // 모달 닫기

    } catch (err) {
      console.error('Failed to submit reviews:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // 1. 모달 배경 (어둡게)
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      
      {/* 2. 모달 컨텐츠 (흰색 박스) */}
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* 3. 모달 헤더 */}
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            "{booking.content_title}" 리뷰 작성
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 text-3xl"
          >
            &times;
          </button>
        </div>

        {/* 4. 모달 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          
          {/* 상품 리뷰 섹션 */}
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
              disabled={isSubmitting}
            />
          </div>

          {/* 가이드 리뷰 섹션 */}
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
              disabled={isSubmitting}
            />
          </div>

          {/* 에러 메시지 표시 */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* 5. 모달 푸터 (버튼) */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isSubmitting ? '등록 중...' : '리뷰 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;