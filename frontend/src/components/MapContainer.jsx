import React, { useEffect, useState } from 'react';

// --- ▼ [Vite 오류 수정] ---
const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;
// --- ▲ [Vite 오류 수정] ---

/**
 * 카카오맵을 렌더링하고, 폴리곤과 마커를 그리는 컴포넌트
 */
function MapContainer({ navigateTo }) {
    
    // 1. 지도 객체를 state로 관리
    const [kakaoMap, setKakaoMap] = useState(null);

    // -----------------------------------------------------------------
    // 1. 카카오맵 스크립트 로드 및 지도 생성
    // -----------------------------------------------------------------
    useEffect(() => {
        // 키가 제대로 로드되었는지 확인
        if (!KAKAO_MAP_KEY) {
            console.error("Kakao Map API Key is not loaded. Check your .env file (VITE_KAKAO_MAP_KEY)");
            return;
        }

        // 이미 스크립트가 로드되었는지 확인
        if (window.kakao && window.kakao.maps) {
            loadMap(); // 이미 로드됨 -> 지도만 생성
            return;
        }

        const script = document.createElement('script');
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false&libraries=services,clusterer,drawing`;
        document.head.appendChild(script);

        script.onload = () => {
            window.kakao.maps.load(() => {
                loadMap(); // 스크립트 로드 완료 -> 지도 생성
            });
        };
    }, []); // [] : 컴포넌트가 처음 렌더링될 때 한 번만 실행

    // 지도 생성 로직
    const loadMap = () => {
        const container = document.getElementById('map');
        const options = {
            // --- ▼ [수정됨] ---
            // 1. 중심좌표를 부산시청으로 변경
            center: new window.kakao.maps.LatLng(35.1795543, 129.0756416), 
            // 2. 맵 레벨을 부산이 잘 보이도록 11로 조정 (숫자가 작을수록 확대)
            level: 11, 
            // --- ▲ [수정됨] ---
        };
        const map = new window.kakao.maps.Map(container, options);
        setKakaoMap(map); // 생성된 지도 객체를 state에 저장
    };

    // -----------------------------------------------------------------
    // 2. 📍 마커 찍기 (DB 데이터)
    // -----------------------------------------------------------------
    useEffect(() => {
        // [중요] 지도가 생성된 *다음에만* 마커를 찍어야 함
        if (!kakaoMap) return;

        // --- ▼ [수정됨] ---
        // (가정) DB에서 가져온 데이터. (예시 데이터를 부산 위치로 변경)
        const contentData = [
            { id: 1, title: "[부산] 해운대 해수욕장", lat: 35.1586, lng: 129.1604 },
            { id: 2, title: "[부산] 광안리 해수욕장", lat: 35.1534, lng: 129.1187 },
            { id: 3, title: "[부산] 서면역", lat: 35.1578, lng: 129.0590 }
        ];
        // --- ▲ [수정됨] ---

        const infowindow = new window.kakao.maps.InfoWindow({ zIndex: 1 });

        contentData.forEach((content) => {
            const marker = new window.kakao.maps.Marker({
                map: kakaoMap,
                position: new window.kakao.maps.LatLng(content.lat, content.lng),
                title: content.title,
            });

            window.kakao.maps.event.addListener(marker, 'click', () => {
                const contentHtml = `<div style="padding:5px;font-size:12px;">${content.title}</div>`;
                infowindow.setContent(contentHtml);
                infowindow.open(kakaoMap, marker);
                
                // [확장] 마커 클릭 시 상세 페이지로 이동 (navigateTo가 전달된 경우)
                // if (navigateTo) {
                //     navigateTo('detail', content.id);
                // }
            });
        });

    }, [kakaoMap, navigateTo]); // navigateTo를 의존성 배열에 추가

    // -----------------------------------------------------------------
    // 3. 🏞️ 폴리곤 그리기 (GeoJSON) - [수정됨: '부산광역시.geojson' 파일 사용]
    // -----------------------------------------------------------------
    useEffect(() => {
        // [중요] 지도가 생성된 *다음에만* 폴리곤을 그려야 함
        if (!kakaoMap) return;

        // [수정] 1. public 폴더에 있는 '부산광역시.geojson' 파일을 불러옵니다.
        const geoJsonFile = '부산광역시.geojson'; // ⬅️ ⚠️ public 폴더의 파일명

        fetch(`/${geoJsonFile}`)
            .then(response => {
                if (!response.ok) {
                    console.error(`Failed to fetch ${geoJsonFile}. Status: ${response.status}`);
                    throw new Error(`Failed to fetch ${geoJsonFile}`);
                }
                return response.json();
            })
            .then(geojson => {
                
                // [수정] 2. '부산광역시.geojson' 파일의 모든 feature(아마도 '동' 단위)를 순회합니다.
                geojson.features.forEach((feature) => {
                    
                    // [중요] '대구' 파일 기준으로, '동' 이름은 'adm_nm' 키였습니다.
                    // '부산' 파일도 동일한지 확인이 필요합니다.
                    const areaName = feature.properties.adm_nm; // ⬅️ ⚠️ '동' 이름 속성 키
                    
                    if (!areaName) {
                        console.warn("Area name (adm_nm) not found in properties. Check the GeoJSON file's property key.");
                    }

                    const coordinates = feature.geometry.coordinates;
                    const geometryType = feature.geometry.type;

                    // [수정] '동' 이름으로 폴리곤을 그립니다.
                    drawPolygon(coordinates, geometryType, areaName || '이름없음');
                });
            })
            .catch((error) => {
                console.error('Error loading or parsing GeoJSON file:', error);
                alert("GeoJSON 파일을 불러오는 데 실패했습니다. public 폴더에 파일이 있는지, 파일 이름이 정확한지 확인하세요.");
            });

        // --- (이 아래는 헬퍼 함수들 - 변경 없음) ---
        
        function getRandomColor() {
            return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        }

        function drawPolygon(coordinates, geometryType, areaName) {
            let polygonPath = [];
            if (geometryType === 'Polygon') {
                polygonPath = convertCoordinates(coordinates[0]);
                displayArea(polygonPath, areaName);
            } else if (geometryType === 'MultiPolygon') {
                coordinates.forEach((polygonCoords) => {
                    polygonPath = convertCoordinates(polygonCoords[0]);
                    displayArea(polygonPath, areaName);
                });
            }
        }

        function convertCoordinates(coords) {
            return coords.map(
                // [경도, 위도] -> LatLng(위도, 경도)
                (coord) => new window.kakao.maps.LatLng(coord[1], coord[0])
            );
        }

        function displayArea(path, areaName) {
            const randomColor = getRandomColor();
            const polygon = new window.kakao.maps.Polygon({
                map: kakaoMap,
                path: path,
                strokeWeight: 2,
                strokeColor: randomColor,
                strokeOpacity: 0.8,
                fillColor: randomColor,
                fillOpacity: 0.3,
            });

            window.kakao.maps.event.addListener(polygon, 'click', () => {
                alert(`'${areaName}' 클릭! (React 컴포넌트에서 이벤트 처리)`);
                // if (navigateTo) {
                //     // navigateTo('list', { district: areaName });
                // }
            });
        }

    }, [kakaoMap, navigateTo]); // navigateTo를 의존성 배열에 추가

    // -----------------------------------------------------------------
    // 4. 렌더링
    // -----------------------------------------------------------------
    return (
        <div
            id="map"
            style={{
                width: '100vw',
                height: '100vh', // 화면 꽉 채우기
            }}
        ></div>
    );
}

export default MapContainer;