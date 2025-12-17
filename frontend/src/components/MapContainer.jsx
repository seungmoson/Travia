import React, { useState, useCallback, useEffect } from 'react';
import { useMap } from '../contexts/MapProvider'; 
import { useGeoJsonData } from '../hooks/useGeoJsonData';
import { useMapPolygons } from '../hooks/useMapPolygons';
import { useMapMarkers } from '../hooks/useMapMarkers';

const fetchContentByArea = async (areaName = null) => {
    const BASE_URL = "https://guidie.duckdns.org/content/map-data";
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

function MapContainer({ navigateTo, onMarkerSelected, onRegionDataLoaded }) {
    const { kakaoMap: map } = useMap(); // MapProvider로부터 kakao 맵 객체를 받음
    const geoJsonData = useGeoJsonData('korea_ver3.geojson');
    const [contentData, setContentData] = useState([]);

    useEffect(() => {
        if (!map) return;

        const loadAllMarkers = async () => {
            console.log("맵 로드 완료. 전체 마커를 불러옵니다.");
            const allData = await fetchContentByArea(null);
            setContentData(allData);
            if (onRegionDataLoaded) {
                onRegionDataLoaded(allData);
            }
        };
        loadAllMarkers();
    }, [map, onRegionDataLoaded]); 

    const handlePolygonClick = useCallback(async (areaName) => {
        console.log(`'${areaName}'이 클릭되었습니다. 이 지역의 컨텐츠를 불러옵니다.`);
        const areaData = await fetchContentByArea(areaName);
        setContentData(areaData);
        if (onRegionDataLoaded) {
            onRegionDataLoaded(areaData);
        }

        if (areaData.length === 0) {
            console.log(`'${areaName}'에 대한 컨텐츠 데이터가 없습니다.`);
        }
    }, [onRegionDataLoaded]);

    useMapPolygons(map, geoJsonData, handlePolygonClick);
    useMapMarkers(map, contentData, onMarkerSelected);
    return null;
}
export default MapContainer;
