//front/src/pages/Mypage.jsx
import React, { useState, useEffect } from 'react';
import ReviewModal from '../components/ReviewModal';

// 백엔드 API 주소
const API_BASE_URL = '/api';
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
    const [cancelingId, setCancelingId] = useState(null);

    //리뷰 모달 관련 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    // 모달에 전달할 예약 정보 (id, title 등)
    const [selectedBooking, setSelectedBooking] = useState(null); 
    // reviewedBookingIds 상태 제거
    // (이제 API가 is_reviewed를 직접 제공하므로 이 상태는 필요 없음)
    // const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set());

    // 컴포넌트 마운트 시 "내 예약 목록" API 호출
    useEffect(() => {
        const fetchMyBookings = async () => {
            // setLoading(true)가 handleReviewSuccess에서도 호출되므로
            // 여기서는 fetchMyBookings가 호출될 때마다 로딩 상태를 보장
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            if (!token) {
                setError('로그인이 필요합니다. 다시 로그인해주세요.');
                setLoading(false);
                navigateTo('login');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/bookings/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        setError('인증이 만료되었습니다. 다시 로그인해주세요.');
                        navigateTo('login');
                    } else {
                        const errData = await response.json();
                        throw new Error(errData.detail || `데이터 로딩 실패 (상태: ${response.status})`);
                    }
                    return; 
                }
                const data = await response.json();
                setBookings(data); 
            } catch (err) {
                console.error('Failed to fetch my bookings:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMyBookings();
    }, [navigateTo]); // navigateTo만 의존성으로 유지

    // [예약 취소] 버튼 클릭 핸들러 (기존과 동일)
    const handleCancelBooking = async (bookingId) => {
        if (cancelingId) return;
        if (!window.confirm('정말로 이 예약을 취소하시겠습니까?')) {
            return;
        }
        setCancelingId(bookingId); 
        setError(null); 

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.');
            }

            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: '알 수 없는 오류가 발생했습니다.' }));
                throw new Error(errData.detail || `예약 취소 실패 (상태: ${response.status})`);
            }

            // 취소 시 반환되는 데이터는 is_reviewed가 포함된 MyBookingSchema임
            const canceledBooking = await response.json(); 
            // setBookings(prevBookings =>
            //     prevBookings.filter(booking => booking.booking_id !== canceledBooking.booking_id)
            // );
            
            // filter 대신 map을 사용하여 상태를 'Canceled'로 즉시 업데이트
            //       (API가 Canceled된 객체를 반환하므로)
            setBookings(prevBookings =>
                prevBookings.map(b => 
                    b.booking_id === canceledBooking.booking_id ? canceledBooking : b
                )
            );

            window.alert('예약이 성공적으로 취소되었습니다.');

        } catch (err) {
            console.error('Failed to cancel booking:', err);
            setError(err.message); 
            window.alert(`오류 발생: ${err.message}`); 
        } finally {
            setCancelingId(null); 
        }
    };


    // 리뷰 모달 핸들러
    //[리뷰 작성] 버튼 클릭 시 모달 여는 함수
    //@param {object} booking - 클릭된 예약 정보
    const handleOpenReviewModal = (booking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    // 모달 닫기 함수
    const handleCloseReviewModal = () => {
        setSelectedBooking(null);
        setIsModalOpen(false);
    };

    //리뷰 제출 성공 시 ReviewModal에서 호출할 콜백 함수
    //@param {int} submittedBookingId - 리뷰가 작성된 예약 ID
    const handleReviewSuccess = (submittedBookingId) => {
        // 1. 모달 닫기
        handleCloseReviewModal();
        
        // reviewedBookingIds 상태 업데이트 로직 제거
        // setReviewedBookingIds(prevIds => new Set(prevIds).add(submittedBookingId));
        // 백엔드 데이터를 다시 불러와 화면 갱신
        // (가장 확실한 방법: 백엔드의 is_reviewed 값을 다시 가져옴)
        alert('리뷰가 등록되었습니다! 목록을 갱신합니다.');
        
        // bookings 상태를 직접 업데이트하여 'is_reviewed'를 true로 변경
        // (네트워크 호출을 줄이고 즉각적인 UI 반응)
        setBookings(prevBookings =>
            prevBookings.map(b =>
                b.booking_id === submittedBookingId 
                    ? { ...b, is_reviewed: true } 
                    : b
            )
        );
        
        // [주석 처리] 즉각적인 UI 반응을 위해 아래의 재호출 로직 대신 위 로직 사용
        // setLoading(true); 
        // const fetchAgain = async () => {
        //      const token = localStorage.getItem('token');
        //      if (!token) { /* 로그인 필요 처리 */ return; }
        //      try {
        //          const response = await fetch(`${API_BASE_URL}/bookings/me`, {
        //              method: 'GET',
        //              headers: { 'Authorization': `Bearer ${token}` },
        //          });
        //          if (!response.ok) { throw new Error('Failed to refetch bookings'); }
        //          const data = await response.json();
        //          setBookings(data);
        //      } catch (err) {
        //          setError('예약 목록 갱신 중 오류 발생: ' + err.message);
        //      } finally {
        //          setLoading(false);
        //      }
        //  };
        //  fetchAgain();
    };

    // 로딩 중 뷰 (기존과 동일)
    if (loading) {
        return <div className="text-center p-10">내 예약 목록을 불러오는 중입니다...</div>;
    }

    // 에러 발생 시 뷰 (기존과 동일)
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
    
    // 날짜 포맷팅 헬퍼 함수 (기존과 동일)
    const formatDateTime = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch (e) { return isoString; }
    };
    
    // 상태(status)별 색상 헬퍼 (기존과 동일)
    const getStatusChip = (status) => {
        const lowerStatus = status ? status.toLowerCase() : 'unknown';
        switch (lowerStatus) {
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'pending':   return 'bg-yellow-100 text-yellow-800';
            case 'canceled':  return 'bg-red-100 text-red-800';
            default:          return 'bg-gray-100 text-gray-800';
        }
    };

    // 메인 렌더링
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-4">
                {/* user 객체가 null일 수 있으므로 안전 접근 연산자 사용 */}
                {user?.username || '사용자'}님의 예약 내역 
            </h1>

            {/* 취소 API 호출 중 또는 목록 갱신 중 발생한 에러 메시지 표시 */}
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
                            className="flex items-start bg-white rounded-xl shadow-lg overflow-hidden transition duration-300 hover:shadow-xl p-6 space-x-6"
                        >
                            {/* 1. 이미지 (기존과 동일) */}
                            <div className="flex-shrink-0 w-40 h-32 rounded-lg overflow-hidden">
                                <img 
                                    src={booking.content_main_image_url || DEFAULT_IMAGE_URL}
                                    alt={booking.content_title}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => navigateTo('detail', booking.content_id)}
                                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE_URL; }}
                                />
                            </div>
                            
                            {/* 2. 정보 및 액션 버튼 (기존과 동일) */}
                            <div className="flex-grow flex justify-between items-start gap-4">
                            
                                {/* 2-1. 예약 정보 (기존과 동일) */}
                                <div className="flex-grow space-y-2">
                                    <div className="flex justify-between items-center">
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

                                {/* 2-2. 액션 버튼 (기존과 동일) */}
                                <div className="flex-shrink-0 flex flex-col justify-start space-y-2 w-32">
                                    
                                    {/* --- [예약 취소] 버튼 (기존과 동일) --- */}
                                    {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
                                        <button 
                                            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => handleCancelBooking(booking.booking_id)}
                                            disabled={cancelingId === booking.booking_id}
                                        >
                                            {cancelingId === booking.booking_id ? '취소 중...' : '예약 취소'}
                                        </button>
                                    )}
                                    
                                    
                                    {/*[리뷰 작성] 버튼 로직 변경*/}
                                    {/* 조건 1: 상태가 'Completed'인가? */}
                                    {booking.status === 'Completed' && (
                                        <>
                                            {/* 조건 2: API가 보내준 is_reviewed가 false인가? */}
                                            {!booking.is_reviewed ? (
                                                // 리뷰 안 씀 -> 버튼 활성화
                                                <button 
                                                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
                                                    onClick={() => handleOpenReviewModal(booking)} 
                                                >
                                                    리뷰 작성
                                                </button>
                                            ) : (
                                                // 리뷰 씀 -> "작성 완료" 텍스트 표시
                                                <div className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-lg font-medium text-center text-sm">
                                                    리뷰 작성 완료
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/*모달 렌더링*/}
            {isModalOpen && selectedBooking && (
                <ReviewModal
                    booking={selectedBooking}
                    onClose={handleCloseReviewModal}
                    onReviewSubmitSuccess={handleReviewSuccess} // 리뷰 성공 시 목록 갱신 함수 전달
                />
            )}
        </div>
    );
};
export default MyPage;
