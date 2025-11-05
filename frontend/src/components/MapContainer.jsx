// components/MapContainer.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { useKakaoMap } from '../hooks/useKakaoMap';
import { useGeoJsonData } from '../hooks/useGeoJsonData';
import { useMapPolygons } from '../hooks/useMapPolygons';
import { useMapMarkers } from '../hooks/useMapMarkers';

// --- ▼ [수정] API 호출 헬퍼 함수 ▼ ---
const fetchContentByArea = async (areaName = null) => {
    
    // [수정] /api/v1/... 상대 경로가 아닌, http://... 절대 경로로 변경
    // [수정] main.py의 prefix="/content"에 맞춤
    const BASE_URL = "http://127.0.0.1:8000/content/map-data";

    const url = areaName 
        ? `${BASE_URL}?area=${encodeURIComponent(areaName)}`
        : BASE_URL; // (전체 마커)
        
    try {
        const response = await fetch(url); 
        if (!response.ok) {
            throw new Error(`API call failed for ${areaName || 'all'}. Status: ${response.status}`);
        }
        const data = await response.json();
        return data; 
        
    } catch (error) {
        console.error("Failed to fetch content data:", error);
        return [];
    }
};
// --- ▲ ---


function MapContainer({ navigateTo }) {
    
    const { kakaoMap } = useKakaoMap();
    const geoJsonData = useGeoJsonData('korea.geojson');
    const [contentData, setContentData] = useState([]);

    
    // --- 4. 맵 로드 시 '전체' 마커 불러오기 ---
    useEffect(() => {
        if (!kakaoMap) return;
        
        const loadAllMarkers = async () => {
            console.log("맵 로드 완료. 전체 마커를 불러옵니다.");
            const allData = await fetchContentByArea(null);
            setContentData(allData);
        };
        
        loadAllMarkers();
    }, [kakaoMap]);
    // --- ▲ ---


    // --- 5. 폴리곤 클릭 시 '지역' 마커 불러오기 ---
    const handlePolygonClick = useCallback(async (areaName) => {
        console.log(`'${areaName}'이 클릭되었습니다. 이 지역의 컨텐츠를 불러옵니다.`);
        
        // [수정] 하드코딩 데이터를 실제 API 호출로 변경
        const areaData = await fetchContentByArea(areaName);
        setContentData(areaData);

        if (areaData.length === 0) {
             console.log(`'${areaName}'에 대한 컨텐츠 데이터가 없습니다.`);
        }
        
    }, []);
    // --- ▲ ---

    // 6. 폴리곤 훅 호출
    useMapPolygons(kakaoMap, geoJsonData, handlePolygonClick);

    // 7. 마커 훅 호출
    useMapMarkers(kakaoMap, contentData, navigateTo);

    return null;
}

export default MapContainer;