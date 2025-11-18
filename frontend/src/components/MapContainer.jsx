import React, { useState, useCallback, useEffect } from 'react';
//  import 구문에서 .jsx, .js 확장자 모두 제거
import { useMap } from '../contexts/MapProvider'; 
import { useGeoJsonData } from '../hooks/useGeoJsonData';
import { useMapPolygons } from '../hooks/useMapPolygons';
import { useMapMarkers } from '../hooks/useMapMarkers';

// --- API 호출 헬퍼 함수 (변경 없음) ---
const fetchContentByArea = async (areaName = null) => {
    
    const BASE_URL = "http://127.0.0.1:8000/content/map-data";

    const url = areaName 
        ? `${BASE_URL}?area=${encodeURIComponent(areaName)}`
        : BASE_URL; // (전체 마커)
        
    try {
        const response = await fetch(url); 
        if (!response.ok) {
            throw new Error(`API call failed for ${areaName || 'all'}. Status: ${response.status}`);
        }
        //  이 data에는 백엔드에서 수정한 main_image_url, price 등이 포함됨
        const data = await response.json();
        return data; 
        
    } catch (error) {
        console.error("Failed to fetch content data:", error);
        return [];
    }
};


// MapPage로부터 새로운 props(onMarkerSelected, onRegionDataLoaded)를 받음
function MapContainer({ navigateTo, onMarkerSelected, onRegionDataLoaded }) {
    
    //  useMap()은 { kakaoMap } 객체를 반환하므로, 구조분해할당으로 받음
    const { kakaoMap: map } = useMap(); // MapProvider로부터 kakao 맵 객체를 받음
    
    const geoJsonData = useGeoJsonData('korea_ver3.geojson');
    const [contentData, setContentData] = useState([]);

    
    // --- 4. 맵 로드 시 '전체' 마커 불러오기 ---
    useEffect(() => {
        //  kakaoMap -> map
        if (!map) return;
        
        const loadAllMarkers = async () => {
            console.log("맵 로드 완료. 전체 마커를 불러옵니다.");
            const allData = await fetchContentByArea(null); // (1) 전체 데이터 로드
            setContentData(allData); // (2) 마커를 그리기 위해 state 설정

            // 초기 로드 시, 불러온 전체 데이터를 사이드바(MapPage)로 전달
            if (onRegionDataLoaded) {
                onRegionDataLoaded(allData); // (3) 빈 배열 대신 allData 전달
            }
        };
        
        loadAllMarkers();
        // MapPage에서 onRegionDataLoaded가 useCallback으로 안정화되었으므로
        // 이 useEffect는 이제 최초 1회만 실행됩니다. (무한 루프 해결)
    }, [map, onRegionDataLoaded]); 

    // --- 5. 폴리곤 클릭 시 '지역' 마커 불러오기 ---
    const handlePolygonClick = useCallback(async (areaName) => {
        console.log(`'${areaName}'이 클릭되었습니다. 이 지역의 컨텐츠를 불러옵니다.`);
        
        const areaData = await fetchContentByArea(areaName);
        setContentData(areaData);

        //  폴리곤 클릭 시, 부모(MapPage)에 지역 목록 데이터 전달
        if (onRegionDataLoaded) {
            onRegionDataLoaded(areaData);
        }

        if (areaData.length === 0) {
            console.log(`'${areaName}'에 대한 컨텐츠 데이터가 없습니다.`);
        }
        
    }, [onRegionDataLoaded]); // (무한 루프 해결)

    // 6. 폴리곤 훅 호출
    //  kakaoMap -> map
    useMapPolygons(map, geoJsonData, handlePolygonClick);

    // 7. 마커 훅 호출
    //  navigateTo 대신 onMarkerSelected를 전달
    useMapMarkers(map, contentData, onMarkerSelected);

    return null;
}

export default MapContainer;