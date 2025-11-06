import { useEffect } from 'react'; // [수정] useState가 더 이상 필요 없으므로 제거

/**
 * [수정] contentData 배열을 받아 마커를 그리고,
 * 마커 클릭 시 onMarkerSelected 함수를 호출하는 훅
 * @param {object} map - 카카오맵 객체 (from useMap context)
 * @param {array} contentData - 마커를 그릴 데이터 배열 (main_image_url, price 등 포함)
 * @param {function} onMarkerSelected - 마커 클릭 시 실행될 (content) => void 함수
 */
export const useMapMarkers = (map, contentData = [], onMarkerSelected) => { // [수정] 인수 변경

    // [수정] currentMarkers state는 useEffect의 cleanup 로직으로 대체 (더 명확함)
    // const [currentMarkers, setCurrentMarkers] = useState([]);

    useEffect(() => {
        if (!map) return; // [수정] kakaoMap -> map

        // [수정] 1. contentData가 변경되면 (useEffect cleanup) 기존 마커 제거 (아래 return 참고)
        // if (currentMarkers.length > 0) { ... } (제거)

        // [수정] 2. InfoWindow 로직 삭제
        // const infowindow = new window.kakao.maps.InfoWindow({ zIndex: 1 });
        
        // 3. 새 contentData로 새 마커(들) 생성
        const newMarkers = [];

        contentData.forEach((content) => {
            
            // (좌표값 키는 이미 'latitude', 'longitude'로 올바르게 되어있음)
            if (!content.latitude || !content.longitude) {
                console.warn("Content data is missing latitude/longitude:", content.title);
                return; // 좌표 없으면 스킵
            }

            const marker = new window.kakao.maps.Marker({
                map: map, // [수정] kakaoMap -> map
                position: new window.kakao.maps.LatLng(content.latitude, content.longitude),
                title: content.title,
            });

            // [수정] 마커 클릭 이벤트: InfoWindow -> onMarkerSelected 호출
            window.kakao.maps.event.addListener(marker, 'click', () => {
                
                // InfoWindow 로직 (삭제)
                // const contentHtml = ...
                // infowindow.setContent(contentHtml);
                // infowindow.open(kakaoMap, marker);

                // 사이드바 상태를 업데이트하는 함수 호출
                if (onMarkerSelected) {
                    // 백엔드에서 받은 모든 데이터(price, image 등)가 담긴
                    // 'content' 객체를 그대로 전달
                    onMarkerSelected(content);
                }
            });
            newMarkers.push(marker);
        });

        // 4. [수정] state에 저장하는 대신 cleanup 함수가 newMarkers를 직접 참조
        // setCurrentMarkers(newMarkers); (제거)

        // 5. [중요] 훅이 unmount 되거나 contentData가 변경될 때 마커 정리
        // 이 useEffect가 다시 실행되기 *직전*에 이 cleanup 함수가 실행되어
        // newMarkers (이전 실행의 마커)를 지도에서 제거합니다.
        return () => {
             if (newMarkers.length > 0) {
                 newMarkers.forEach(marker => marker.setMap(null));
             }
        };

    }, [map, contentData, onMarkerSelected]); // [수정] 의존성 배열 변경
};