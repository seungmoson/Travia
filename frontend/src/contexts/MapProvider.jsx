import React, { createContext, useState, useEffect } from 'react';

// --- ▼ [Vite 오류 수정] ---
const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;
// --- ▲ [Vite 오류 수정] ---

// 1. Context 생성
export const MapContext = createContext(null);

/**
 * 카카오맵 스크립트를 로드하고, 생성된 map 객체를 Context로 제공하는 Provider
 */
function MapProvider({ children }) {
    const [kakaoMap, setKakaoMap] = useState(null);

    // -----------------------------------------------------------------
    // 1. 카카오맵 스크립트 로드 및 지도 생성
    // -----------------------------------------------------------------
    useEffect(() => {
        if (!KAKAO_MAP_KEY) {
            console.error("Kakao Map API Key is not loaded. Check your .env file (VITE_KAKAO_MAP_KEY)");
            return;
        }

        // window.kakao 객체가 이미 존재하는지 확인
        if (window.kakao && window.kakao.maps) {
            console.log("Kakao Maps script already loaded.");
            loadMap();
            return;
        }

        const script = document.createElement('script');
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false&libraries=services,clusterer,drawing`;
        script.async = true; // 비동기 로드
        document.head.appendChild(script);

        script.onload = () => {
            console.log("Kakao Maps script loaded successfully.");
            window.kakao.maps.load(() => {
                loadMap(); // 스크립트 로드 완료 -> 지도 생성
            });
        };

        script.onerror = () => {
             console.error("Failed to load Kakao Maps script.");
        };
    }, []); // [] : 컴포넌트가 처음 렌더링될 때 한 번만 실행

    // 지도 생성 로직
    const loadMap = () => {
        const container = document.getElementById('map');
        if (!container) {
            console.error("Map container 'map' not found.");
            return;
        }
        
        const options = {
             // 1. 중심좌표를 부산시청으로 변경
            center: new window.kakao.maps.LatLng(35.1795543, 129.0756416), 
            // 2. 맵 레벨을 부산이 잘 보이도록 11로 조정
            level: 11, 
        };
        const map = new window.kakao.maps.Map(container, options);
        setKakaoMap(map); // 생성된 지도 객체를 state에 저장
        console.log("Kakao Map object created and set in state.");
    };

    return (
        // 2. Context Provider로 kakaoMap 객체를 하위에 제공
        //    value prop에 객체 형태로 { kakaoMap } 전달
        <MapContext.Provider value={{ kakaoMap }}>
            {/* 3. 지도를 렌더링할 div (화면 전체 차지) */}
            <div 
                id="map" 
                style={{ 
                    width: '100vw', 
                    height: '100vh', 
                    position: 'relative' // 자식 요소(MapContainer)의 기준점
                }}
            >
                {/* 4. kakaoMap이 성공적으로 생성된 *후에만* children을 렌더링
                   (children이 바로 MapContainer가 됩니다) */}
                {kakaoMap ? children : <div>Loading Map...</div>}
            </div>
        </MapContext.Provider>
    );
}

export default MapProvider;