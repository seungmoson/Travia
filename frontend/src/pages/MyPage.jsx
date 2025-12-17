//front/src/pages/Mypage.jsx
import React, { useState, useEffect } from 'react';
import ReviewModal from '../components/ReviewModal';

const API_BASE_URL = 'https://guidie.duckdns.org';
const DEFAULT_IMAGE_URL = 'https://placehold.co/400x300/666/white?text=No+Image';
const MyPage = ({ navigateTo, user }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelingId, setCancelingId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null); 
    // const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set());

    useEffect(() => {
        const fetchMyBookings = async () => {
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
    }, [navigateTo]);

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

            const canceledBooking = await response.json(); 
            // setBookings(prevBookings =>
            //     prevBookings.filter(booking => booking.booking_id !== canceledBooking.booking_id)
            // );
            
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

    const handleOpenReviewModal = (booking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);};

    const handleCloseReviewModal = () => {
        setSelectedBooking(null);
        setIsModalOpen(false);};

    const handleReviewSuccess = (submittedBookingId) => {
        handleCloseReviewModal();
        // setReviewedBookingIds(prevIds => new Set(prevIds).add(submittedBookingId));
        alert('리뷰가 등록되었습니다! 목록을 갱신합니다.');
        setBookings(prevBookings =>
            prevBookings.map(b =>
                b.booking_id === submittedBookingId 
                    ? { ...b, is_reviewed: true } 
                    : b
            )
        );
        
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

    if (loading) {
        return <div className="text-center p-10">내 예약 목록을 불러오는 중입니다...</div>;
    }

    if (error && bookings.length === 0) {
        return (
             <div className="p-8 text-center bg-red-100 border border-red-400 text-red-700 rounded-lg m-8">
                <h1 className="text-2xl font-bold mb-2">오류 발생</h1>
                <p>{error}</p>
                <button
                    onClick={() => navigateTo('main')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                    메인으로 돌아가기
                </button>
            </div>
        );
    }
    
    const formatDateTime = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch (e) { return isoString; }
    };
    
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

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-4">
                {user?.username || '사용자'}님의 예약 내역 
            </h1>

            {error && (
                <div className="p-4 text-center bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <p>{error}</p>
                </div>
            )}

            <div className="space-y-6">
                {bookings.length === 0 ? (
                    <p className="text-center text-gray-500 p-10 bg-white rounded-lg shadow">
                        아직 예약한 내역이 없습니다.
                    </p>
                ) : (
                    bookings.map((booking) => (
                        <div 
                            key={booking.booking_id}
                            className="flex items-start bg-white rounded-xl shadow-lg overflow-hidden transition duration-300 hover:shadow-xl p-6 space-x-6">
                            <div className="flex-shrink-0 w-40 h-32 rounded-lg overflow-hidden">
                                <img 
                                    src={booking.content_main_image_url || DEFAULT_IMAGE_URL}
                                    alt={booking.content_title}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => navigateTo('detail', booking.content_id)}
                                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE_URL; }}/>
                            </div>
                            
                            <div className="flex-grow flex justify-between items-start gap-4">
                                <div className="flex-grow space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span 
                                            className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${getStatusChip(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            예약 ID: {booking.booking_id}
                                        </span>
                                    </div>
                                    
                                    <h2 
                                        className="text-2xl font-bold text-indigo-700 hover:underline cursor-pointer"
                                        onClick={() => navigateTo('detail', booking.content_id)}>
                                        {booking.content_title}
                                    </h2>
                                    
                                    <p className="text-gray-700 text-lg font-semibold">
                                        📅 {formatDateTime(booking.booking_date)}
                                    </p>
                                    <p className="text-gray-600">
                                        👥 {booking.personnel}명
                                    </p>
                                </div>

                                <div className="flex-shrink-0 flex flex-col justify-start space-y-2 w-32">
                                    {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
                                        <button 
                                            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => handleCancelBooking(booking.booking_id)}
                                            disabled={cancelingId === booking.booking_id}>
                                            {cancelingId === booking.booking_id ? '취소 중...' : '예약 취소'}
                                        </button>
                                    )}
                                    
                                    {booking.status === 'Completed' && (
                                        <>
                                            {!booking.is_reviewed ? (
                                                <button 
                                                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
                                                    onClick={() => handleOpenReviewModal(booking)} >
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
            {isModalOpen && selectedBooking && (
                <ReviewModal
                    booking={selectedBooking}
                    onClose={handleCloseReviewModal}
                    onReviewSubmitSuccess={handleReviewSuccess}
                />
            )}
        </div>
    );
};
export default MyPage;
