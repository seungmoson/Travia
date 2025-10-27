import React from 'react';
import ContentCard from './ContentCard.jsx'; 
// import { MOCK_CONTENT } from '../data/mockData.js'; // 🚨 Mock 데이터 임포트 제거!

/**
 * 콘텐츠 목록 컴포넌트 (그리드 레이아웃 및 데이터 매핑 담당)
 * @param {Array<object>} contents - MainPage에서 API를 통해 전달받은 실제 콘텐츠 목록 배열
 * @param {object} user - 사용자 로그인 상태
 * @param {function} navigateTo - 페이지 이동 함수
 */
const ContentList = ({ contents, user, navigateTo }) => {
    // contents prop을 사용하여 DB에서 가져온 실제 데이터를 맵핑합니다.
    return (
        // Tailwind CSS 클래스를 사용하여 반응형 3열 그리드 레이아웃 설정
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.map((content) => (
                <ContentCard 
                    key={content.id} 
                    content={content} 
                    user={user} 
                    navigateTo={navigateTo} 
                />
            ))}
        </div>
    );
};

export default ContentList;
