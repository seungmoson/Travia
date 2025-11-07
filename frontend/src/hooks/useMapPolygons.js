import { useState, useEffect, useCallback } from 'react';

// 폴리곤의 고정 색상 및 호버(hover) 색상을 정의합니다.
const POLYGON_COLORS = {
    stroke: '#004c80', // 기본 테두리 색상 (진한 파란색)
    fill: '#007bff',   // 기본 채우기 색상 (파란색)
    hoverStroke: '#002640', // 마우스 오버 시 테두리 색상 (더 진한 파란색)
    hoverFill: '#0056b3',   // 마우스 오버 시 채우기 색상 (더 진한 파란색)
};

/**
 * 지도 클릭 시 해당 지역의 폴리곤을 그리고, 폴리곤 클릭 이벤트를 처리하는 훅
 * @param {object} kakaoMap - 카카오맵 객체 (from useKakaoMap)
 * @param {object} geoJsonData - GeoJSON 데이터 (from useGeoJsonData)
 * @param {function} onPolygonClick - 폴리곤 클릭 시 실행될 콜백 (클릭된 지역의 areaName을 인자로 받음)
 */
export const useMapPolygons = (kakaoMap, geoJsonData, onPolygonClick) => {
    // 현재 지도에 그려진 폴리곤(들)을 관리
    const [currentPolygons, setCurrentPolygons] = useState([]);

    // --- 헬퍼 함수들 (useCallback으로 최적화) ---

    const convertCoordinates = useCallback((coords) => {
        // [경도, 위도] -> LatLng(위도, 경도)
        return coords.map(
            (coord) => new window.kakao.maps.LatLng(coord[1], coord[0])
        );
    }, []);

    /** 폴리곤을 그리고, 생성된 폴리곤 객체를 반환 */
    const displayArea = useCallback((path, areaName) => {
        if (!kakaoMap) return null;
        
        // path가 유효하지 않으면 폴리곤을 생성하지 않고 null 반환
        if (!path || path.length === 0) {
            console.warn("displayArea: Invalid or empty path, skipping polygon creation.");
            return null;
        }

        // 'a.addListener is not a function' 오류 방지
        // polygon 생성이 실패할 경우(예: path가 잘못된 경우)를 대비해 try...catch로 감쌉니다.
        try {
            // 고정 색상 (POLYGON_COLORS)을 사용합니다.
            const polygon = new window.kakao.maps.Polygon({
                map: kakaoMap,
                path: path,
                strokeWeight: 2,
                strokeColor: POLYGON_COLORS.stroke,
                strokeOpacity: 0.8,
                fillColor: POLYGON_COLORS.fill,
                fillOpacity: 0.4, // 채우기 투명도 살짝 조절
            });

            // 마우스 호버(mouseover) 이벤트 추가
            window.kakao.maps.event.addListener(polygon, 'mouseover', () => {
                polygon.setOptions({
                    fillColor: POLYGON_COLORS.hoverFill,
                    fillOpacity: 0.6,
                    strokeColor: POLYGON_COLORS.hoverStroke,
                });
            });

            // 마우스 아웃(mouseout) 이벤트 추가
            window.kakao.maps.event.addListener(polygon, 'mouseout', () => {
                polygon.setOptions({
                    fillColor: POLYGON_COLORS.fill,
                    fillOpacity: 0.4,
                    strokeColor: POLYGON_COLORS.stroke,
                });
            });

            // 폴리곤 클릭 시 이벤트 발생
            window.kakao.maps.event.addListener(polygon, 'click', () => {
                if (onPolygonClick) {
                    onPolygonClick(areaName); // MapContainer로 areaName을 전달
                }
            });

            return polygon; // 성공 시 폴리곤 객체 반환

        } catch (e) {
            // 폴리곤 생성 또는 리스너 추가 중 오류 발생 시
            console.error("Failed to create polygon or add listeners:", e, { path, areaName });
            return null; // 실패 시 null 반환
        }

    }, [kakaoMap, onPolygonClick]);

    /** GeoJSON 좌표로 폴리곤 객체(들)의 배열을 생성하여 반환 */
    const drawPolygon = useCallback((coordinates, geometryType, areaName) => {
        let newPolygons = [];
        let polygonPath = [];

        if (geometryType === 'Polygon') {
            polygonPath = convertCoordinates(coordinates[0]);
            const polygon = displayArea(polygonPath, areaName);
            if (polygon) newPolygons.push(polygon); // displayArea가 null을 반환할 수 있으므로 체크
        } else if (geometryType === 'MultiPolygon') {
            coordinates.forEach((polygonCoords) => {
                polygonPath = convertCoordinates(polygonCoords[0]);
                const polygon = displayArea(polygonPath, areaName);
                if (polygon) newPolygons.push(polygon); // displayArea가 null을 반환할 수 있으므로 체크
            });
        }
        return newPolygons;
    }, [convertCoordinates, displayArea]);


    // --- 메인 로직: 지도 클릭 이벤트 핸들러 ---
    useEffect(() => {
        // kakaoMap과 geoJsonData가 모두 준비되었을 때만 실행
        if (!kakaoMap || !geoJsonData) return;

        const geocoder = new window.kakao.maps.services.Geocoder();

        const handleMapClick = (mouseEvent) => {
            const latLng = mouseEvent.latLng;

            geocoder.coord2RegionCode(latLng.getLng(), latLng.getLat(), (result, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    
                    // const clickedAreaName = result[0].region_2depth_name; ///justin
                    const clickedAreaName = `${result[0].region_1depth_name} ${result[0].region_2depth_name}`;
                    const foundFeature = geoJsonData.features.find(
                        f => f.properties.sidonm_sggnm === clickedAreaName   
                    );

                    // 5. 이전에 표시된 폴리곤(들)이 있다면 지도에서 제거
                    if (currentPolygons.length > 0) {
                        currentPolygons.forEach(p => p.setMap(null));
                    }

                    if (foundFeature) {
                        // 6. 일치하는 feature로 새로운 폴리곤 그리기
                        const areaName = foundFeature.properties.sidonm_sggnm;
                        const coordinates = foundFeature.geometry.coordinates;
                        const geometryType = foundFeature.geometry.type;

                        const newPolygons = drawPolygon(coordinates, geometryType, areaName);
                        
                        // 7. 새로 그려진 폴리곤(들)을 state에 저장
                        setCurrentPolygons(newPolygons);
                    } else {
                        console.warn(`'${clickedAreaName}'에 해당하는 GeoJSON feature를 찾지 못했습니다.`);
                        setCurrentPolygons([]); // 일치하는 것이 없으면 빈 배열로 설정
                    }
                }
            });
        };

        // 8. 지도에 클릭 이벤트 리스너 등록
        window.kakao.maps.event.addListener(kakaoMap, 'click', handleMapClick);

        // 9. [중요] 훅이 unmount 될 때 이벤트 리스너 제거
        return () => {
            if (kakaoMap) {
                window.kakao.maps.event.removeListener(kakaoMap, 'click', handleMapClick);
            }
        };

    }, [kakaoMap, geoJsonData, currentPolygons, drawPolygon]);
};