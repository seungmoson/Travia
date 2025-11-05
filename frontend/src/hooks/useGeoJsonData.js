// hooks/useGeoJsonData.js

import { useState, useEffect } from 'react';

/**
 * public 폴더의 GeoJSON 파일을 불러와 state로 반환하는 훅
 * @param {string} fileName - public 폴더에 있는 GeoJSON 파일 이름 (예: 'korea.geojson')
 * @returns {object | null} - 불러온 GeoJSON 데이터 또는 null
 */
export const useGeoJsonData = (fileName) => {
    const [geoJsonData, setGeoJsonData] = useState(null);

    useEffect(() => {
        if (!fileName) return;

        fetch(`/${fileName}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${fileName}. Status: ${response.status}`);
                }
                return response.json();
            })
            .then(geojson => {
                setGeoJsonData(geojson);
                console.log(`GeoJSON data (${fileName}) loaded successfully.`);
            })
            .catch((error) => {
                console.error(`Error loading or parsing GeoJSON file (${fileName}):`, error);
                alert(`${fileName} 파일을 불러오는 데 실패했습니다. public 폴더에 파일이 있는지 확인하세요.`);
            });

    }, [fileName]); // fileName이 바뀔 경우에만 다시 실행

    return geoJsonData;
};