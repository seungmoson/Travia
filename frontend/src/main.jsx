import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // 메인 App 컴포넌트 import (확장자 명시)
import './index.css'; // 글로벌 CSS import (확장자 명시)

// index.html의 <div id="root">에 React 애플리케이션을 마운트합니다.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
