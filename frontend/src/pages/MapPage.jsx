import React from 'react';
// [수정] MapContainer.jsx의 경로를 '../components/MapContainer'로 수정
import MapContainer from '../components/MapContainer'; // 지도 로직 컴포넌트
// [추가] MapProvider를 import하여 MapContainer가 맵 객체를 받을 수 있도록 함
import MapProvider from '../contexts/MapProvider';

/**
 * 지도 페이지 (MapContainer의 래퍼)
 * App.jsx로부터 navigateTo 함수를 받아서 MapContainer에 넘겨줍니다.
 * [수정] MapProvider로 MapContainer를 감싸고, "뒤로가기" 버튼을 추가합니다.
 */
const MapPage = ({ navigateTo }) => {
    return (
        // MapProvider가 <div id="map" ...>을 렌더링합니다.
        // 이 컴포넌트의 자식들(button, MapContainer)은 div#map 내부에 렌더링됩니다.
        <MapProvider>
            
            {/* 지도 페이지 상단에 '뒤로가기' 또는 '홈' 버튼 */}
            {/* MapProvider의 div#map이 position:relative 이므로, 
                이 버튼은 z-10을 통해 지도 위에 표시됩니다. */}
            <button
                onClick={() => navigateTo('main')}
                className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold hover:bg-gray-100 transition"
            >
                &larr; 메인으로 돌아가기
            </button>

            {/* 실제 지도 로직 컴포넌트 (UI 렌더링은 하지 않고 훅만 실행)
              MapProvider의 자식으로 렌더링되어야 useKakaoMap() 훅이 동작합니다.
            */}
            <MapContainer navigateTo={navigateTo} />
            
        </MapProvider>
    );
};

export default MapPage;