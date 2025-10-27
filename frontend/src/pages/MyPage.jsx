import React, { useState, useEffect } from 'react';

// 백엔드 API 주소
const API_BASE_URL = 'http://localhost:8000';
const DEFAULT_IMAGE_URL = 'https://placehold.co/400x300/666/white?text=No+Image';

/**
 * MyPage (내 예약 목록) 컴포넌트
 * @param {function} navigateTo - 페이지 이동 함수
 * @param {object} user - 현재 사용자 정보 (헤더 표시용)
 */
const MyPage = ({ navigateTo, user }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- 1. 예약 취소 API 호출 상태를 관리할 state 추가 ---
    // (중복 클릭 방지 및 버튼 로딩 텍스트 표시용)
    const [cancelingId, setCancelingId] = useState(null);

    // 컴포넌트 마운트 시 "내 예약 목록" API 호출
    useEffect(() => {
        const fetchMyBookings = async () => {
            setLoading(true);
            setError(null);

            // 1. localStorage에서 토큰 가져오기
            const token = localStorage.getItem('token');
            if (!token) {
                setError('로그인이 필요합니다. 다시 로그인해주세요.');
                setLoading(false);
                // 토큰이 없으면 로그인 페이지로 강제 이동
                navigateTo('login');
                return;
            }

            try {
                // 2. 백엔드 API 호출 (GET /bookings/me)
                // (백엔드에서 "Canceled" 제외, "Completed"로 상태 변경하여 반환)
                const response = await fetch(`${API_BASE_URL}/bookings/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    // 401 (Unauthorized) 등 에러 처리
                    if (response.status === 401) {
                        setError('인증이 만료되었습니다. 다시 로그인해주세요.');
                        navigateTo('login');
                    } else {
                        const errData = await response.json();
                        throw new Error(errData.detail || `데이터 로딩 실패 (상태: ${response.status})`);
                    }
                    return; // 에러 발생 시 더 이상 진행하지 않음
                }

                // 3. 성공 시 데이터 저장
                const data = await response.json();
                setBookings(data); // 백엔드가 반환한 예약 목록 (배열)

            } catch (err) {
                console.error('Failed to fetch my bookings:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMyBookings();
    }, [navigateTo]); // navigateTo가 (App.jsx에서) 바뀔 일은 없지만, 의존성 배열에 추가

    
    // --- 2. [예약 취소] 버튼 클릭 핸들러 ---
    const handleCancelBooking = async (bookingId) => {
        // 이미 다른 예약을 취소 중이면 중복 실행 방지
        if (cancelingId) return;

        // 사용자에게 취소 여부 확인
        if (!window.confirm('정말로 이 예약을 취소하시겠습니까?')) {
            return;
        }

        setCancelingId(bookingId); // API 호출 시작 (로딩 상태)
        setError(null); // 이전 에러 메시지 초기화

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // 이 시점에 토큰이 없을 가능성은 낮지만, 방어 코드
                throw new Error('인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.');
            }

            // 백엔드 예약 취소 API 호출 (DELETE /bookings/{booking_id})
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                // 401, 403, 404 등 에러 처리
                const errData = await response.json().catch(() => ({ detail: '알 수 없는 오류가 발생했습니다.' }));
                throw new Error(errData.detail || `예약 취소 실패 (상태: ${response.status})`);
            }

            // API 호출 성공 시:
            // 백엔드가 취소된 예약 정보(MyBookingSchema)를 반환합니다.
            const canceledBooking = await response.json();

            // 화면(bookings state) 갱신
            // [중요] 백엔드에서 "Canceled"를 제외하고 보내므로,
            // 취소 성공 시 목록에서 해당 항목을 "제거"해야 합니다.
            setBookings(prevBookings =>
                prevBookings.filter(booking => booking.booking_id !== canceledBooking.booking_id)
            );

            // 사용자에게 성공 알림
            window.alert('예약이 성공적으로 취소되었습니다.');

        } catch (err) {
            console.error('Failed to cancel booking:', err);
            setError(err.message); // 에러 상태에 메시지 표시
            window.alert(`오류 발생: ${err.message}`); // 사용자에게 에러 알림
        } finally {
            setCancelingId(null); // API 호출 완료 (로딩 상태 해제)
        }
    };
    // --- (함수 끝) ---


    // 로딩 중 뷰
    if (loading) {
        return <div className="text-center p-10">내 예약 목록을 불러오는 중입니다...</div>;
    }

    // 에러 발생 시 뷰
    if (error && bookings.length === 0) {
        return (
            <div className="p-8 text-center bg-red-100 border border-red-400 text-red-700 rounded-lg m-8">
                <h1 className="text-2xl font-bold mb-2">오류 발생</h1>
                <p>{error}</p>
                <button
                    onClick={() => navigateTo('main')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    메인으로 돌아가기
                </button>
            </div>
        );
    }
    
    // 날짜 포맷팅 헬퍼 함수
    const formatDateTime = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return isoString;
        }
    };
    
    // 상태(status)별 색상 헬퍼
    const getStatusChip = (status) => {
        const lowerStatus = status ? status.toLowerCase() : 'unknown';
        
        switch (lowerStatus) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            // --- [수정] "Completed" 상태 스타일 추가 ---
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'canceled': // (현재 로직 상 보일 일은 없음)
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // 메인 렌더링
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-4">
                {user.username}님의 예약 내역 
            </h1>

            {/* --- 3. 취소 API 호출 중 발생한 에러 메시지 표시 --- */}
            {error && (
                <div className="p-4 text-center bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <p>{error}</p>
                </div>
            )}

            {/* 예약 목록 */}
            <div className="space-y-6">
                {bookings.length === 0 ? (
                    <p className="text-center text-gray-500 p-10 bg-white rounded-lg shadow">
                        아직 예약한 내역이 없습니다.
                    </p>
                ) : (
                    bookings.map((booking) => (
                        <div 
                            key={booking.booking_id}
                            className="flex flex-col md:flex-row bg-white rounded-xl shadow-lg overflow-hidden transition duration-300 hover:shadow-xl"
                        >
                            {/* 1. 이미지 */}
                            <img 
                                src={booking.content_main_image_url || DEFAULT_IMAGE_URL}
                                alt={booking.content_title}
                                className="w-full md:w-1/3 h-48 md:h-auto object-cover cursor-pointer"
                                onClick={() => navigateTo('detail', booking.content_id)}
                                // 이미지 로딩 실패 시 기본 이미지로 대체
                                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE_URL; }}
                            />
                            
                            {/* 2. 예약 정보 */}
                            <div className="p-6 space-y-3 flex-1">
                                <div className="flex justify-between items-start">
                                    <span 
                                        className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${getStatusChip(booking.status)}`}
                                    >
                                        {booking.status}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        예약 ID: {booking.booking_id}
                                    </span>
                                </div>
                                
                                <h2 
                                    className="text-2xl font-bold text-indigo-700 hover:underline cursor-pointer"
                                    onClick={() => navigateTo('detail', booking.content_id)}
                                >
                                    {booking.content_title}
                                </h2>
                                
                                <p className="text-gray-700 text-lg font-semibold">
                                    📅 {formatDateTime(booking.booking_date)}
                                </p>
                                <p className="text-gray-600">
                                    👥 {booking.personnel}명
                                </p>
                            </div>

                            {/* 3. 액션 버튼 (예약 취소 등) */}
                            <div className="p-6 border-t md:border-t-0 md:border-l flex flex-col justify-center space-y-2">
                                
                                {/* --- 4. [예약 취소] 버튼 --- */}
                                {/* 'Pending' 또는 'Confirmed' 상태일 때만 버튼을 렌더링합니다. */}
                                {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
                                    <button 
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => handleCancelBooking(booking.booking_id)}
                                        disabled={cancelingId === booking.booking_id}
                                    >
                                        {cancelingId === booking.booking_id ? '취소 중...' : '예약 취소'}
                                    </button>
                                )}
                                
                                {/* --- 5. [리뷰 작성] 버튼 (수정됨) --- */}
                                {/* 백엔드에서 "Completed"로 보내주는 경우에만 버튼을 렌더링합니다. */}
                                {booking.status === 'Completed' && (
                                    <button 
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
                                        // TODO: 리뷰 작성 페이지로 이동하는 로직 구현
                                        onClick={() => alert('리뷰 작성 기능은 준비 중입니다.')}
                                    >
                                        리뷰 작성
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyPage;

