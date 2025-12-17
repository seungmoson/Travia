import React, { useState, useCallback } from 'react'; 
import MapContainer from '../components/MapContainer';
import MapProvider from '../contexts/MapProvider';
import MapSidebar from '../components/MapSidebar';

const MapPage = ({ navigateTo }) => {
  const [selectedContent, setSelectedContent] = useState(null); 
  const [regionContentList, setRegionContentList] = useState([]);
  const handleContentSelect = useCallback((content) => {
    setSelectedContent(content); 
    setRegionContentList([]);
  }, []);

  const handleRegionDataLoaded = useCallback((dataList) => {
    setRegionContentList(dataList);
    setSelectedContent(null); 
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSelectedContent(null);
    setRegionContentList([]);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden"> 
      <div className="w-[350px] flex-shrink-0 bg-white shadow-lg z-20 overflow-y-auto"> 
          <MapSidebar
            content={selectedContent}
            list={regionContentList}       
            onClose={handleCloseSidebar}   
            onItemClick={handleContentSelect}
            navigateTo={navigateTo}/>
      </div>
      
      <div className="relative flex-grow"> 
        <MapProvider>
          <button
            onClick={() => navigateTo('main')}
            className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold hover:bg-gray-100 transition">
            &larr; 메인으로 돌아가기
          </button>

          <MapContainer 
            navigateTo={navigateTo} 
            onMarkerSelected={handleContentSelect}
            onRegionDataLoaded={handleRegionDataLoaded}/>
        </MapProvider>
      </div>
    </div>
  );
};

export default MapPage;
