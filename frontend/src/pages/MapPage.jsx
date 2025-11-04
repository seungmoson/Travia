import React from 'react';
// [수정] MapContainer.jsx의 경로를 './components/'가 아닌 '../components/'로 수정
// (pages 폴더에서 components 폴더로 이동하기 위해)
import MapContainer from '../components/MapContainer'; // 지도 로직 컴포넌트

/**
 * 지도 페이지 (MapContainer의 래퍼)
 * App.jsx로부터 navigateTo 함수를 받아서 MapContainer에 넘겨줍니다.
 */
const MapPage = ({ navigateTo }) => {
    return (
        <div className="relative w-full h-screen">
            {/* 지도 페이지 상단에 '뒤로가기' 또는 '홈' 버튼을 추가할 수 있습니다.
                Tailwind를 사용한 예시: 
            */}
            <button
                onClick={() => navigateTo('main')}
                className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold hover:bg-gray-100 transition"
            >
                &larr; 메인으로 돌아가기
            </button>

            {/* 실제 지도 컴포넌트 */}
            <MapContainer navigateTo={navigateTo} />
        </div>
    );
};

export default MapPage;

