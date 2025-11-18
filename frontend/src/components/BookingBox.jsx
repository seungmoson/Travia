import React, { useState } from 'react';
// 아이콘 경로는 실제 프로젝트 구조에 맞게 수정하세요.
// import { MinusIcon, PlusIcon } from '../assets/Icons'; 

// 아이콘 컴포넌트
const MinusIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>;
const PlusIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;


const API_BASE_URL = 'http://localhost:8000';

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

//BookingBox 컴포넌트
 // --- ▼  setShowAuthModal prop 추가 ▼ ---
const BookingBox = ({ contentId, navigateTo, user, contentAuthorId = null, setShowAuthModal }) => {
    const todayString = getTodayDateString();

    const [bookingDate, setBookingDate] = useState(todayString);
    const [bookingTime, setBookingTime] = useState('09:00');
    const [pax, setPax] = useState(1);
    const isAvailable = true; // (목업)

    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingMessage, setBookingMessage] = useState('');
    const [bookingError, setBookingError] = useState('');

    // --- [디버깅 로그 1 & 2] ---
    console.log("BookingBox [비교 데이터 확인]:", { 
        userId: user?.id, 
        authorId: contentAuthorId 
    });
    console.log("BookingBox [타입 확인]:", { 
        userType: typeof user?.id, 
        authorType: typeof contentAuthorId 
    });

    // isOwner 계산 로직
    const isOwner = user.isLoggedIn && 
                    contentAuthorId !== null && 
                    user.id !== null && 
                    String(user.id) === String(contentAuthorId);

    // isOwner 변수가 실제로 어떻게 계산되었는지 확인합니다.
    console.log("BookingBox [isOwner 계산 결과]:", isOwner); 

    const handleReservation = async () => {
        // ... (함수 내용은 이전과 동일) ...
        setBookingMessage('');
        setBookingError('');

        if (isOwner) {
            setBookingError('작성자 본인은 예약할 수 없습니다.');
            return;
        }

        // --- ▼  로그인 안된 경우 모달 띄우기 ▼ ---
        if (!user.isLoggedIn) {
            // navigateTo('login'); // 기존 코드
            setShowAuthModal(true); // 모달을 띄우도록 변경
            return;
        }

        setBookingLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setBookingError('로그인 토큰이 없습니다. 다시 로그인해주세요.');
                navigateTo('login'); // 토큰이 없는 비정상 상황에선 로그인 페이지로 강제 이동
                setBookingLoading(false);
                return;
            }

            if (!bookingDate || !bookingTime) {
                setBookingError('날짜와 시간을 모두 선택해주세요.');
                setBookingLoading(false);
                return;
            }
            const bookingDateISO = `${bookingDate}T${bookingTime}`; 

            const bookingPayload = {
                content_id: parseInt(contentId, 10), 
                booking_date: bookingDateISO,       
                personnel: pax,                  
            };

            const response = await fetch(`${API_BASE_URL}/bookings/`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(bookingPayload),
            });

            const result = await response.json();

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
            
            {/* 상단 주의사항 */}
            {isOwner ? (
                <div className="p-4 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">
                    <span>✏️ 회원님께서 등록하신 콘텐츠입니다.</span>
                </div>
            ) : (
                <div className={`p-4 rounded-lg text-sm font-medium ${isAvailable ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'}`}>
                    {isAvailable ? (
                        <span>📅 이 투어는 현재 예약 가능합니다.</span>
                    ) : (
                        <span>❌ 죄송합니다. 이 투어는 현재 예약이 마감되었습니다.</span>
                    )}
                </div>
            )}

            {/* 날짜 및 인원 선택 영역 */}
            <div className="space-y-4">
                
                <div className="grid grid-cols-2 gap-3 border border-gray-300 rounded-lg p-3"> 
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">예약 날짜</label>
                        <input
                            type="date"
                            value={bookingDate}
                            min={todayString}
                            onChange={(e) => setBookingDate(e.target.value)}
                            disabled={isOwner || bookingLoading} // isOwner일 때 비활성화
                            className="w-full text-lg font-bold focus:outline-none cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div className="pl-3 border-l border-gray-200">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">예약 시간</label>
                        <input
                            type="time"
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            disabled={isOwner || bookingLoading} // isOwner일 때 비활성화
                            className="w-full text-lg font-bold focus:outline-none cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            step="1800"
                        />
                    </div>
                </div>

                {/* 인원 선택 */}
                <div className="border border-gray-300 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-lg font-bold">인원 {pax}명</span>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setPax(p => Math.max(1, p - 1))}
                            disabled={pax <= 1 || bookingLoading || isOwner} // isOwner일 때 비활성화
                            className="p-1 border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50 transition"
                        >
                            <MinusIcon className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="w-6 text-center text-lg font-semibold">{pax}</span>
                        <button
                            onClick={() => setPax(p => p + 1)}
                            disabled={bookingLoading || isOwner} // isOwner일 때 비활성화
                            className="p-1 border border-gray-300 rounded-full hover:bg-gray-100 transition"
                        >
                            <PlusIcon className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 예약 결과 메시지 */}
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
                disabled={bookingLoading || !isAvailable || isOwner} // isOwner일 때 비활성화
                className="w-full py-3 bg-indigo-600 text-white font-extrabold text-lg rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {/* isOwner일 때 텍스트 변경 */}
                {bookingLoading ? '예약 처리 중...' : 
                    isOwner ? '내 콘텐츠 (예약 불가)' : 
                    user.isLoggedIn ? '예약하기' : 
                    '로그인 후 예약하기'}
            </button>

            <div className="pt-2 border-t border-gray-200 text-right">
                <span className="text-sm text-gray-500">결제는 현장에서 진행됩니다.</span>
            </div>
        </div>
    );
};

export default BookingBox;

