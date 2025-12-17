import React, { useState } from 'react';
import { MinusIcon, PlusIcon } from '../assets/Icons.jsx';

// 백엔드 API 주소
const API_BASE_URL = 'https://guidie.duckdns.org';

/**
 * BookingBox 컴포넌트: 상세 페이지 우측 예약 박스 (API 호출 기능 포함)
 * @param {string | number} contentId - 상세 콘텐츠 ID
 * @param {function} navigateTo - 페이지 이동 함수
 * @param {object} user - 사용자 정보 (로그인 상태 확인용)
 */
const BookingBox = ({ contentId, navigateTo, user }) => {
    const [startDate, setStartDate] = useState('2025-12-12');
    const [pax, setPax] = useState(1); // 인원수
    const isAvailable = true;
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingMessage, setBookingMessage] = useState('');
    const [bookingError, setBookingError] = useState('');

    console.log("BookingBox received user prop:", user);

    const handleReservation = async () => {
        setBookingMessage('');
        setBookingError('');

        console.log("handleReservation checking user.isLoggedIn:", user?.isLoggedIn);

        if (!user?.isLoggedIn) {
            console.log("User not logged in, navigating to login.");
            navigateTo('login');
            return;
        }

        console.log("User is logged in, proceeding with booking API call.");
        setBookingLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.error("Auth token not found.");
                setBookingError('로그인 토큰이 없습니다. 다시 로그인해주세요.');
                navigateTo('login');
                return;
            }
            console.log("Auth token found.");

            const bookingDateISO = `${startDate}T09:00:00`;
            console.log("Booking Date ISO:", bookingDateISO);
            console.log("Content ID:", contentId, "Personnel:", pax);

            const bookingPayload = {
                content_id: parseInt(contentId, 10),
                booking_date: bookingDateISO,
                personnel: pax,
            };
            console.log("Booking Payload:", bookingPayload);

            const response = await fetch(`${API_BASE_URL}/bookings/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(bookingPayload),
            });
            console.log("API Response Status:", response.status);

            const result = await response.json();
            console.log("API Response Body:", result);

            if (response.ok) {
                setBookingMessage(`예약 성공! 예약 ID: ${result.booking_id} (${result.status})`);
            } else {
                setBookingError(result.detail || `예약 실패 (상태: ${response.status})`);
            }

        } catch (error) {
            console.error('Booking request failed:', error);
            setBookingError('예약 요청 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요.');
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-2xl p-6 space-y-5 border border-gray-100">
            {console.log(">>> BookingBox rendering JSX, user:", user)}

            <div className={`p-4 rounded-lg text-sm font-medium ${isAvailable ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'}`}>
                 {isAvailable
                     ? '💡 예약 가능: 이 가이드는 보통 예약 기록이 있습니다.'
                     : '🚨 예약 불가능: 현재 예약이 마감되었습니다.'
                 }
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 border border-gray-300 rounded-lg p-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">예약 날짜</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full text-lg font-bold focus:outline-none cursor-pointer border-none p-0"/>
                    </div>
                </div>

                <div className="border border-gray-300 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-lg font-bold">인원 {pax}명</span>
                    <div className="flex items-center space-x-2">
                         <button
                             onClick={() => setPax(p => Math.max(1, p - 1))}
                             disabled={pax <= 1 || bookingLoading}
                             className="p-1 border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50 transition">
                             <MinusIcon className="w-5 h-5 text-gray-600" />
                         </button>
                         <span className="w-6 text-center text-lg font-semibold">{pax}</span>
                         <button
                             onClick={() => setPax(p => p + 1)}
                             disabled={bookingLoading}
                             className="p-1 border border-gray-300 rounded-full hover:bg-gray-100 transition">
                             <PlusIcon className="w-5 h-5 text-gray-600" />
                         </button>
                     </div>
                </div>
            </div>

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

            <button
                onClick={handleReservation} // 👈 API 호출 함수 연결
                disabled={bookingLoading || !isAvailable}
                className="w-full py-3 bg-indigo-600 text-white font-extrabold text-lg rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300 disabled:opacity-70 disabled:cursor-not-allowed">
                {bookingLoading ? '예약 처리 중...' : (user?.isLoggedIn ? '예약하기' : '로그인 후 예약하기')}
            </button>

            <div className="pt-2 border-t border-gray-200 text-right">
                 <p className="text-sm text-gray-500">
                     최종 금액: <span className="text-lg font-bold text-gray-800">₩ 55,000</span> {/* TODO: 실제 가격 계산 */}
                 </p>
            </div>
        </div>
    );
};

export default BookingBox;

