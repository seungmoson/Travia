import React from 'react';
// (RelatedContentList.jsx는 동일 폴더에 있다고 가정)
import RelatedContentList from './RelatedContentList';

// --- 1. CSS 스타일 (이전과 동일) ---
const SidebarStyles = () => (
  <style>{`
    /* ... (이전 MapSidebar.jsx의 <style> 내용과 동일) ... */
    /* --- 1. 사이드바 기본틀 --- */
    .map-sidebar {
      width: 100%; /* 부모(w-[350px])의 너비를 따름 */
      height: 100%;
      background-color: #ffffff;
      /* border-right: 1px solid #ddd; */ /* MapPage가 shadow를 처리 */
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

    /* --- 2. 상세 뷰 (DetailView) 스타일 --- */
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

    /* --- 3. 목록 뷰 (List View) 스타일 --- */
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


// --- 2. 상세 뷰 (내부 컴포넌트) ---
const DetailView = ({ content, navigateTo }) => (
  <>
    <img
      src={content.main_image_url || 'https://placehold.co/350x200/f0f4f8/374151?text=Image'}
      alt={content.title}
      className="sidebar-image"
    />
    <div className="sidebar-content">
      <h2 className="sidebar-title">{content.title}</h2>
      <p className="sidebar-location">{content.location}</p>
      <p className="sidebar-description">{content.description || '상세 설명이 없습니다.'}</p>
      <p className="sidebar-price">
        {content.price ? `${content.price.toLocaleString()}원` : '가격 정보 없음'}
      </p>

      {/* --- ▼▼▼ [신규] "상세 페이지로 이동" 버튼 ▼▼▼ --- */}
      <button
        onClick={() => navigateTo('detail', content.id)}
        className="w-full mt-4 px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
      >
        상세 페이지로 이동
      </button>
      {/* --- ▲▲▲ [신규] 버튼 추가 완료 ▲▲▲ --- */}

    </div>
  </>
);

// --- 3. 메인 사이드바 컴포넌트 ---
const MapSidebar = ({ content, list, onClose, onItemClick, navigateTo }) => {
  
  // 1. 단일 콘텐츠(content)가 있으면 상세 뷰 렌더링
  if (content) {
    return (
      <>
        <SidebarStyles />
        <div className="map-sidebar">
          {/* [수정] 닫기 버튼 대신 "목록으로" 버튼 (UX 개선) */}
          <button 
            className="absolute top-4 left-4 z-10 bg-white px-3 py-1 rounded-full shadow-md text-sm font-semibold hover:bg-gray-100 transition"
            onClick={onClose}
          >
            &larr; 목록으로
          </button>
          <DetailView content={content} navigateTo={navigateTo} />
        </div>
      </>
    );
  }

  // 2. 목록(list)이 있으면 목록 뷰 렌더링
  // (맵 로드 시 전체 목록을 보여주기 위해 list.length > 0 조건 제거)
  if (list) {
    
    // (어댑터 로직 1: adaptedList)
    const adaptedList = list.map(item => ({
      ...item,
      imageUrl: item.main_image_url,
      price: item.price ? item.price.toLocaleString() : '문의', 
      // rating은 MapContentSchema에서 이미 float으로 전달됨
    }));

    // (어댑터 로직 2: handleCardClick)
    const handleCardClick = (type, id) => {
      const clickedItem = list.find(item => item.id === id);
      if (clickedItem) {
        onItemClick(clickedItem); // MapPage의 handleContentSelect 호출
      }
    };

    return (
      <>
        <SidebarStyles />
        <div className="map-sidebar">
          <div className="sidebar-list-header">
            <h3>콘텐츠 ({list.length}개)</h3>
            {/* 닫기 버튼을 여기에 둘 수도 있습니다. */}
            {/* <button className="close-btn" onClick={onClose}>X</button> */}
          </div>
          
          <div className="sidebar-list-container">
            {list.length > 0 ? (
              <RelatedContentList
                relatedContents={adaptedList}
                navigateTo={handleCardClick} // 👈 클릭 시 handleCardClick 호출
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

  // 3. 둘 다 없으면 로딩 또는 빈 상태 (숨김)
  return null;
};

export default MapSidebar;