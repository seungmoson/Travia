// hooks/useMapMarkers.js

import { useState, useEffect } from 'react';

/**
 * contentData 배열을 받아 지도에 마커를 그리는 훅
 * @param {object} kakaoMap - 카카오맵 객체 (from useKakaoMap)
 * @param {array} contentData - 마커를 그릴 데이터 배열 (예: [{ id, title, latitude, longitude }...])
 * @param {function} navigateTo - (옵션) 마커 클릭 시 실행될 네비게이션 함수
 */
export const useMapMarkers = (kakaoMap, contentData = [], navigateTo) => {
    // 현재 지도에 그려진 마커(들)을 관리
    const [currentMarkers, setCurrentMarkers] = useState([]);

    useEffect(() => {
        if (!kakaoMap) return;

        // 1. contentData가 변경되면 (폴리곤이 클릭되거나 전체 로드 시) 기존 마커(들) 제거
        if (currentMarkers.length > 0) {
            currentMarkers.forEach(marker => marker.setMap(null));
        }

        // 2. 새 contentData로 새 마커(들) 생성
        const infowindow = new window.kakao.maps.InfoWindow({ zIndex: 1 });
        const newMarkers = [];

        contentData.forEach((content) => {
            
            // [수정] content.lat -> content.latitude, content.lng -> content.longitude
            if (!content.latitude || !content.longitude) {
                console.warn("Content data is missing latitude/longitude:", content.title);
                return; // 좌표 없으면 스킵
            }

            const marker = new window.kakao.maps.Marker({
                map: kakaoMap,
                // [수정] content.lat -> content.latitude, content.lng -> content.longitude
                position: new window.kakao.maps.LatLng(content.latitude, content.longitude),
                title: content.title,
            });

            // 마커 클릭 이벤트
            window.kakao.maps.event.addListener(marker, 'click', () => {
                const contentHtml = `<div style="padding:5px;font-size:12px;width:150px;text-align:center;">
                                       ${content.title}
                                     </div>`;
                infowindow.setContent(contentHtml);
                infowindow.open(kakaoMap, marker);

                // [확장] 마커 클릭 시 상세 페이지로 이동 (navigateTo가 전달된 경우)
                // if (navigateTo) {
                //     navigateTo('detail', content.id);
                // }
            });
            newMarkers.push(marker);
        });

        // 3. 새로 생성된 마커들을 state에 저장 (다음 업데이트 시 제거하기 위해)
        setCurrentMarkers(newMarkers);

        // 4. [중요] 훅이 unmount 될 때 마커 제거
        return () => {
             if (newMarkers.length > 0) {
                 newMarkers.forEach(marker => marker.setMap(null));
             }
        };

    }, [kakaoMap, contentData, navigateTo]); // contentData가 바뀔 때마다 이 useEffect가 다시 실행됨
};