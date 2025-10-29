import React, { useState, useEffect, useCallback } from 'react';
// [수정] react-router-dom의 useNavigate import 제거
// import { useNavigate } from 'react-router-dom'; 
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// [추가] 로딩 스피너 (MyPage와 동일)
import { ThreeDots } from 'react-loader-spinner';

// --- Styled Components (기존과 동일) ---
const DashboardContainer = styled.div`
  max-width: 900px;
  margin: 40px auto;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 2rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 1rem;
`;

const BookingList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const BookingItem = styled.li`
  display: flex;
  align-items: flex-start;
  padding: 1.5rem 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const ImageContainer = styled.div`
  flex-shrink: 0;
  width: 160px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 1.5rem;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const BookingDetails = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

const InfoLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ContentTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #222;
  margin: 0;
`;

const BookingDate = styled.p`
  font-size: 1rem;
  color: #555;
  margin: 0;
`;

const BookingInfo = styled.p`
  font-size: 0.9rem;
  color: #777;
  margin: 0;
`;

const TravelerInfo = styled.div`
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #333;
  background-color: #f9f9f9;
  padding: 0.5rem 0.8rem;
  border-radius: 4px;
  display: inline-block;
`;

const InfoRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const StatusBadge = styled.span`
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #fff;
  background-color: ${({ status }) =>
    status === 'Pending' ? '#f39c12' :
    status === 'Confirmed' ? '#2ecc71' :
    status === 'Rejected' ? '#e74c3c' :
    status === 'Completed' ? '#95a5a6' : '#3498db'};
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ApproveButton = styled(ActionButton)`
  background-color: #2ecc71;
  color: white;
  &:hover:not(:disabled) {
    background-color: #27ae60;
  }
`;

const RejectButton = styled(ActionButton)`
  background-color: #e74c3c;
  color: white;
  &:hover:not(:disabled) {
    background-color: #c0392b;
  }
`;

// --- ▼ [신규 추가] '여행 완료' 버튼 스타일 ▼ ---
const CompleteButton = styled(ActionButton)`
  background-color: #3498db; /* 파란색 계열 */
  color: white;
  &:hover:not(:disabled) {
    background-color: #2980b9;
  }
`;
// --- ▲ [신규 추가 완료] ▲ ---

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
`;
// --- Styled Components (기존과 동일) ---


// [수정] App.jsx로부터 user, navigateTo props를 받도록 변경
function GuideDashboard({ user, navigateTo }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // [추가] API 호출 중인 예약 ID (버튼 비활성화용)
  const [processingId, setProcessingId] = useState(null);
  
  // [수정] useNavigate 훅 제거
  // const navigate = useNavigate();

  // [신규] 예약 정렬 함수 (기존과 동일)
  const sortBookings = (bookingArray) => {
    return [...bookingArray].sort((a, b) => {
      // 1순위: Pending
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      // 2순위: Confirmed (새로 추가)
      if (a.status === 'Confirmed' && b.status !== 'Confirmed') return -1;
      if (a.status !== 'Confirmed' && b.status === 'Confirmed') return 1;
      // 3순위: 날짜순
      return new Date(a.booking_date) - new Date(b.booking_date);
    });
  };

  // 데이터 가져오기 (useCallback으로 감싸기)
  const fetchBookings = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('로그인이 필요합니다.');
      setLoading(false);
      // [수정] navigate('/login') 대신 navigateTo('login') 사용
      navigateTo('login');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/bookings/guide/received', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '예약 정보를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setBookings(sortBookings(data.bookings || []));

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // [수정] 의존성 배열에 navigate 대신 navigateTo 추가
  }, [navigateTo]); 

  // 마운트 시 예약 정보 가져오기
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);


  // [신규] 예약 상태 업데이트 공통 함수 (승인 / 거절 / 완료)
  const handleUpdateBookingStatus = async (bookingId, action) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      // [수정] navigate('/login') 대신 navigateTo('login') 사용
      navigateTo('login');
      return;
    }

    setProcessingId(bookingId); // 로딩 시작

    let alertMessage = '';
    switch (action) {
        case 'approve': alertMessage = '승인'; break;
        case 'reject': alertMessage = '거절'; break;
        case 'complete': alertMessage = '완료'; break;
        default: alertMessage = '처리';
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/bookings/${action}/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `예약 ${alertMessage}에 실패했습니다.`);
      }

      const updatedBooking = await response.json(); 

      // 화면 즉시 갱신 (중요)
      setBookings(prevBookings => {
        const updatedList = prevBookings.map(booking =>
          booking.booking_id === bookingId
            ? { ...booking, status: updatedBooking.status }
            : booking
        );
        return sortBookings(updatedList);
      });

    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setProcessingId(null); // 로딩 종료
    }
  };


  // --- 렌더링 로직 ---

  if (loading) {
    return (
      <LoadingContainer>
        <ThreeDots color="#3498db" height={80} width={80} />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <Title>오류</Title>
        <p>{error}</p>
      </DashboardContainer>
    );
  }

  if (bookings.length === 0) {
    return (
      <DashboardContainer>
        <Title>접수된 예약</Title>
        <p>아직 접수된 예약이 없습니다.</p>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Title>접수된 예약 ({bookings.length}건)</Title>
      <BookingList>
        {bookings.map(booking => {
          const isProcessing = processingId === booking.booking_id;
          return (
            <BookingItem key={booking.booking_id}>
              <ImageContainer>
                <img src={booking.content_main_image_url || 'https://via.placeholder.com/160x120?text=No+Image'} alt={booking.content_title} />
              </ImageContainer>
              <BookingDetails>
                <InfoLeft>
                  <ContentTitle>{booking.content_title}</ContentTitle>
                  <BookingDate>
                    {format(new Date(booking.booking_date), 'yyyy년 MM월 dd일 (EEE) HH:mm', { locale: ko })}
                  </BookingDate>
                  <BookingInfo>
                    인원: {booking.personnel}명
                  </BookingInfo>
                  <TravelerInfo>
                    신청자: {booking.traveler.nickname} ({booking.traveler.email})
                  </TravelerInfo>
                </InfoLeft>

                <InfoRight>
                  <StatusBadge status={booking.status}>
                    {booking.status}
                  </StatusBadge>
                  
                  {/* --- ▼ [수정] 'Pending' 상태일 때 ▼ --- */}
                  {booking.status === 'Pending' && (
                    <>
                      <ApproveButton
                        onClick={() => handleUpdateBookingStatus(booking.booking_id, 'approve')}
                        disabled={isProcessing}
                      >
                        {isProcessing ? '처리중...' : '예약 승인'}
                      </ApproveButton>
                      <RejectButton
                        onClick={() => handleUpdateBookingStatus(booking.booking_id, 'reject')}
                        disabled={isProcessing}
                      >
                        {isProcessing ? '처리중...' : '예약 거절'}
                      </RejectButton>
                    </>
                  )}
                  {/* --- ▲ [수정 완료] ▲ --- */}

                  {/* --- ▼ [신규 추가] 'Confirmed' 상태일 때 ▼ --- */}
                  {booking.status === 'Confirmed' && (
                    <CompleteButton
                      onClick={() => handleUpdateBookingStatus(booking.booking_id, 'complete')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? '처리중...' : '여행 완료'}
                    </CompleteButton>
                  )}
                  {/* --- ▲ [신규 추가 완료] ▲ --- */}

                </InfoRight>
              </BookingDetails>
            </BookingItem>
          );
        })}
      </BookingList>
    </DashboardContainer>
  );
}

export default GuideDashboard;

