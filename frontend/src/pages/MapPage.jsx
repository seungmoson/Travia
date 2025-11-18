import React, { useState, useCallback } from 'react'; 
import MapContainer from '../components/MapContainer';
import MapProvider from '../contexts/MapProvider';
import MapSidebar from '../components/MapSidebar';

const MapPage = ({ navigateTo }) => {
  const [selectedContent, setSelectedContent] = useState(null); 
  const [regionContentList, setRegionContentList] = useState([]);

  // --- ▼  사용감을 위해 이전 로직으로 되돌립니다 ▼ ---
  // 마커나 목록 클릭 시, '페이지 이동'이 아니라 '사이드바 상세 뷰'를 엽니다.
  const handleContentSelect = useCallback((content) => {
    //  navigateTo(...) 대신, state를 설정하여 사이드바 뷰를 변경
    setSelectedContent(content); 
    setRegionContentList([]); // 목록 뷰는 닫음
  }, []); // 의존성 배열에서 navigateTo 제거

  // 이 함수는 MapContainer가 지역 데이터를 로드할 때 호출
  const handleRegionDataLoaded = useCallback((dataList) => {
    setRegionContentList(dataList);
    setSelectedContent(null); 
  }, []);

  // 이 함수는 사이드바의 'X' 버튼 클릭 시 호출
  const handleCloseSidebar = useCallback(() => {
    setSelectedContent(null);
    setRegionContentList([]);
  }, []);

  return (
    // 사이드바 + 지도 레이아웃
    <div className="flex h-screen w-screen overflow-hidden"> 
      
      {/* 사이드바 영역 (너비 350px 고정) */}
      <div className="w-[350px] flex-shrink-0 bg-white shadow-lg z-20 overflow-y-auto"> 
          <MapSidebar
            content={selectedContent} // 👈 상세 뷰를 띄우기 위해 다시 사용
            list={regionContentList}       
            onClose={handleCloseSidebar}   
            onItemClick={handleContentSelect} // 👈 수정된 함수 전달
            navigateTo={navigateTo} // 👈  상세 뷰의 "버튼"이 사용할 수 있도록 전달
          />
      </div>
      
      {/* 지도 영역 (남은 공간 모두 차지) */}
      <div className="relative flex-grow"> 
        <MapProvider>
          {/* '뒤로가기' 버튼 */}
          <button
            onClick={() => navigateTo('main')}
            className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold hover:bg-gray-100 transition"
          >
            &larr; 메인으로 돌아가기
          </button>

          <MapContainer 
            navigateTo={navigateTo} 
            onMarkerSelected={handleContentSelect} // 👈 마커 클릭 시에도 동일하게 전달됨
            onRegionDataLoaded={handleRegionDataLoaded}
          />
        </MapProvider>
      </div>
    </div>
  );
};

export default MapPage;