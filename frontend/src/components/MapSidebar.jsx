import React from 'react';
import RelatedContentList from './RelatedContentList';

const SidebarStyles = () => (
  <style>{`
    .map-sidebar {
      width: 100%;
      height: 100%;
      background-color: #ffffff;
      overflow-y: auto;
      position: relative;
    }
    .close-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      cursor: pointer;
      font-weight: bold;
      z-index: 11;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .close-btn:hover { background-color: #f0f0f0; }
    .sidebar-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    .sidebar-content {
      padding: 20px;
    }
    .sidebar-title {
      font-size: 1.5rem; 
      margin-top: 0; 
      margin-bottom: 10px;
      font-weight: 700;
    }
    .sidebar-location {
      font-size: 0.9rem; 
      color: #666; 
      margin-bottom: 15px;
    }
    .sidebar-description {
      font-size: 1rem; 
      line-height: 1.5; 
      color: #333;
    }
    .sidebar-price {
      font-size: 1.2rem; 
      font-weight: bold; 
      color: #007bff;
      margin-top: 20px;
    }

    .sidebar-list-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
      background-color: #f9f9f9;
      position: sticky;
      top: 0;
      z-index: 5;
    }
    .sidebar-list-header h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }
    .sidebar-list-container {
      padding: 1rem;
    }
  `}</style>
);

const DetailView = ({ content, navigateTo }) => (
  <>
    <img
      src={content.main_image_url || 'https://placehold.co/350x200/f0f4f8/374151?text=Image'}
      alt={content.title}
      className="sidebar-image"/>
    <div className="sidebar-content">
      <h2 className="sidebar-title">{content.title}</h2>
      <p className="sidebar-location">{content.location}</p>
      <p className="sidebar-description">{content.description || '상세 설명이 없습니다.'}</p>
      <p className="sidebar-price">
        {content.price ? `${content.price.toLocaleString()}원` : '가격 정보 없음'}
      </p>

      <button
        onClick={() => navigateTo('detail', content.id)}
        className="w-full mt-4 px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
        상세 페이지로 이동
      </button>
    </div>
  </>
);

const MapSidebar = ({ content, list, onClose, onItemClick, navigateTo }) => {
  if (content) {
    return (
      <>
        <SidebarStyles />
        <div className="map-sidebar">
          <button 
            className="absolute top-4 left-4 z-10 bg-white px-3 py-1 rounded-full shadow-md text-sm font-semibold hover:bg-gray-100 transition"
            onClick={onClose}>
            &larr; 목록으로
          </button>
          <DetailView content={content} navigateTo={navigateTo} />
        </div>
      </>
    );
  }

  if (list) {
    const adaptedList = list.map(item => ({
      ...item,
      imageUrl: item.main_image_url,
      price: item.price ? item.price.toLocaleString() : '문의', 
    }));

    const handleCardClick = (type, id) => {
      const clickedItem = list.find(item => item.id === id);
      if (clickedItem) {
        onItemClick(clickedItem);
      }
    };

    return (
      <>
        <SidebarStyles />
        <div className="map-sidebar">
          <div className="sidebar-list-header">
            <h3>콘텐츠 ({list.length}개)</h3>
          </div>
          
          <div className="sidebar-list-container">
            {list.length > 0 ? (
              <RelatedContentList
                relatedContents={adaptedList}
                navigateTo={handleCardClick}
              />
            ) : (
              <p className="text-gray-500 text-center mt-10 p-4">
                이 지역에는 콘텐츠가 없습니다.
              </p>
            )}
          </div>
        </div>
      </>
    );
  }
  return null;
};
export default MapSidebar;
