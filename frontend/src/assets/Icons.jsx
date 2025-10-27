import React from 'react';

// ----------------------------------------------------------------------
// 모든 컴포넌트는 외부에서 불러올 수 있도록 'export const'로 정의됩니다.
// ----------------------------------------------------------------------

/**
 * 마이너스 아이콘 (BookingBox 인원 감소용)
 */
export const MinusIcon = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
    </svg>
);

/**
 * 플러스 아이콘 (BookingBox 인원 증가용)
 */
export const PlusIcon = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
    </svg>
);

/**
 * 로그인 아이콘 (Nav Bar 및 LoginPage에서 사용)
 */
export const LogInIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
);

/**
 * 사용자 아이콘 (로그인/로그아웃 상태 표시)
 */
export const UserIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

/**
 * 체크 아이콘 (확인/완료 표시)
 */
export const CheckIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

/**
 * 비행기 아이콘 (여행/투어 관련 표시)
 */
export const PlaneIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2 22 22l-1.2-4.2c-.3-1.1-1.3-1.8-2.5-1.8H9c-2.2 0-4-1.8-4-4V5c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v3.5c0 1.2-.7 2.2-1.8 2.5L17 13l-4.5 4.5 3.3 3.3z" />
    </svg>
);

/**
 * 별 아이콘 (평점/선호도 표시)
 */
export const StarIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 fill-yellow-400">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);
