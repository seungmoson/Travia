import React, { useState } from 'react';
import { MinusIcon, PlusIcon } from '../assets/Icons'; // 아이콘 경로는 가정된 경로입니다.

// [추가] 백엔드 API 주소
const API_BASE_URL = 'http://localhost:8000';

// [추가] 오늘 날짜를 YYYY-MM-DD 형식으로 반환하는 헬퍼 함수
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * BookingBox 컴포넌트: 상세 페이지 우측에 위치하는 예약/액션 박스
 * [수정] 날짜/시간 선택 기능으로 변경
 * @param {string | number} contentId - 상세 콘텐츠 ID
 * @param {function} navigateTo - 페이지 이동 함수
 * @param {object} user - 사용자 정보 (로그인 상태 확인용)
 */
const BookingBox = ({ contentId, navigateTo, user }) => {
    const todayString = getTodayDateString();

    // [수정] 날짜와 시간을 별도의 state로 관리
    const [bookingDate, setBookingDate] = useState(todayString); // YYYY-MM-DD 형식
    const [bookingTime, setBookingTime] = useState('09:00'); // HH:MM 형식
    
    const [pax, setPax] = useState(1); // 인원수

    const isAvailable = true; // 투어 가능 여부 (목업)

    // [추가] 예약 API 호출 상태
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingMessage, setBookingMessage] = useState('');
    const [bookingError, setBookingError] = useState('');

    // [수정] 예약 버튼 클릭 핸들러 (API 호출)
    const handleReservation = async () => {
        setBookingMessage('');
        setBookingError('');

        if (!user.isLoggedIn) {
            // 로그인 필요 시 로그인 페이지로 이동
            navigateTo('login');
            return; // 함수 종료
        }

        // --- 로그인 상태일 경우 예약 API 호출 ---
        setBookingLoading(true);
        try {
            // 1. [수정] localStorage에서 JWT 토큰 가져오기 (키 이름을 'token'으로 통일)
            const token = localStorage.getItem('token');
            if (!token) {
                setBookingError('로그인 토큰이 없습니다. 다시 로그인해주세요.');
                navigateTo('login'); // 토큰 없으면 로그인 페이지로
                setBookingLoading(false); // 로딩 중지
                return;
            }

            // [수정] 2. API 요청 데이터 준비 (날짜와 시간을 ISO 8601 형식으로 결합)
            if (!bookingDate || !bookingTime) {
                setBookingError('날짜와 시간을 모두 선택해주세요.');
                setBookingLoading(false);
                return;
            }
            // 'YYYY-MM-DD'와 'HH:MM'을 'YYYY-MM-DDTHH:MM' 형식으로 결합
            const bookingDateISO = `${bookingDate}T${bookingTime}`; 

            const bookingPayload = {
                content_id: parseInt(contentId, 10), // contentId를 숫자로 변환
                booking_date: bookingDateISO,      // ISO 8601 형식 날짜/시간
                personnel: pax,                  // 인원수
            };

            // 3. 백엔드 API 호출 (POST /bookings)
            const response = await fetch(`${API_BASE_URL}/bookings/`, { // 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // JWT 토큰을 Authorization 헤더에 포함
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(bookingPayload),
            });

            const result = await response.json();

            if (response.ok) {
                // 4. 예약 성공 처리
                setBookingMessage(`예약 성공! 예약 ID: ${result.booking_id} (${result.status})`);
                // TODO: 예약 완료 후 추가 작업 (예: 예약 내역 페이지 이동 등)
            } else {
                // 5. 예약 실패 처리 (4xx, 5xx 에러)
                setBookingError(result.detail || `예약 실패 (상태: ${response.status})`);
            }

        } catch (error) {
            // 6. 네트워크 오류 등 fetch 자체 실패 처리
            console.error('Booking request failed:', error);
            setBookingError('예약 요청 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요.');
        } finally {
            setBookingLoading(false); // 로딩 상태 해제
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-2xl p-6 space-y-5 border border-gray-100">
            {/* 상단 주의사항 / 예약 가능 여부 */}
            <div className={`p-4 rounded-lg text-sm font-medium ${isAvailable ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'}`}>
                {isAvailable ? (
                    <span>📅 이 투어는 현재 예약 가능합니다.</span>
                ) : (
                    <span>❌ 죄송합니다. 이 투어는 현재 예약이 마감되었습니다.</span>
                )}
            </div>

            {/* 날짜 및 인원 선택 영역 */}
            <div className="space-y-4">
                
                {/* [수정] 날짜 및 시간 선택 (2-column grid) */}
                <div className="grid grid-cols-2 gap-3 border border-gray-300 rounded-lg p-3"> 
                    {/* 날짜 선택 (캘린더) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">예약 날짜</label>
                        <input
                            type="date"
                            value={bookingDate}
                            min={todayString} // 과거 날짜 선택 방지
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full text-lg font-bold focus:outline-none cursor-pointer bg-transparent"
                        />
                    </div>
                    {/* 시간 선택 */}
                    <div className="pl-3 border-l border-gray-200">
                        {/* --- ▼ [오타 수정] --- */}
                        <label className="block text-xs font-semibold text-gray-500 mb-1">예약 시간</label>
                        {/* --- ▲ 오타 수정 ▲ --- */}
                        <input
                            type="time"
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="w-full text-lg font-bold focus:outline-none cursor-pointer bg-transparent"
                            step="1800" // 30분 단위 (선택 사항)
                        />
                    </div>
                </div>

                {/* 인원 선택 */}
                <div className="border border-gray-300 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-lg font-bold">인원 {pax}명</span>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setPax(p => Math.max(1, p - 1))}
                            disabled={pax <= 1 || bookingLoading} // 로딩 중 비활성화
                            className="p-1 border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50 transition"
                        >
                            <MinusIcon className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="w-6 text-center text-lg font-semibold">{pax}</span>
                        <button
                            onClick={() => setPax(p => p + 1)}
                            disabled={bookingLoading} // 로딩 중 비활성화
                            className="p-1 border border-gray-300 rounded-full hover:bg-gray-100 transition"
                        >
                            <PlusIcon className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* [추가] 예약 결과 메시지 표시 */}
            {bookingMessage && (
                <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg text-center font-medium">
                    {bookingMessage}
                </div>
            )}
            {bookingError && (
                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg text-center font-medium">
                    {bookingError}
                </div>
            )}

            {/* 예약 버튼 */}
            <button
                onClick={handleReservation}
                disabled={bookingLoading || !isAvailable} // 로딩 중 또는 예약 불가 시 비활성화
                className="w-full py-3 bg-indigo-600 text-white font-extrabold text-lg rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {/* [수정] 로딩 상태 표시 */}
                {bookingLoading ? '예약 처리 중...' : (user.isLoggedIn ? '예약하기' : '로그인 후 예약하기')}
            </button>

            {/* 결제 정보 (목업) */}
            <div className="pt-2 border-t border-gray-200 text-right">
                <span className="text-sm text-gray-500">결제는 현장에서 진행됩니다.</span>
            </div>
        </div>
    );
};

export default BookingBox;

