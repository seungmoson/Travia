import React from 'react';

/**
 * 검색 입력창과 검색 버튼, 인기 태그 목록을 렌더링하는 UI 컴포넌트
 *
 * @param {object} props
 * @param {string} props.inputValue - 입력창에 표시될 현재 값
 * @param {function(string): void} props.onInputChange - 입력창 값이 변경될 때 호출될 함수
 * @param {function(): void} props.onSearchSubmit - 검색 버튼 클릭 또는 Enter 시 호출될 함수
 * @param {string[]} props.popularTags - (신규) 표시할 인기 태그 문자열 배열
 * @param {function(string): void} props.onTagClick - (신규) 태그 클릭 시 호출될 함수
 */
const SearchBar = ({ 
    inputValue, 
    onInputChange, 
    onSearchSubmit, 
    popularTags = [], // 👈 [신규] props 추가 (기본값 빈 배열)
    onTagClick        // 👈 [신규] props 추가
}) => {
  
  // 폼 제출 이벤트를 처리하는 핸들러
  const handleSubmit = (e) => {
    e.preventDefault(); // 폼 제출 시 페이지가 새로고침되는 것을 방지
    onSearchSubmit();   // 부모로부터 받은 검색 실행 함수 호출
  };

  return (
    // [수정] Tailwind 클래스 적용 및 태그 목록과의 간격(space-y-4) 추가
    <div className="search-bar-container space-y-4">
      {/* [수정] MainPage.jsx의 디자인과 동일하게 Tailwind 클래스 적용 */}
      <form onSubmit={handleSubmit} className="flex items-center border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-indigo-500 transition duration-200">
        <input
          type="search" // [수정] type="text" -> "search" (시맨틱)
          placeholder="여행지 또는 #태그로 검색"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          className="w-full text-lg p-1 focus:outline-none" // [수정] Tailwind 클래스 적용
        />
        <button type="submit" className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition duration-200">
          {/* [수정] 텍스트 대신 아이콘 사용 (MainPage.jsx와 통일) */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </button>
      </form>

      {/* --- ▼ [신규] 인기 태그 목록 렌더링 ▼ --- */}
      {popularTags.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {popularTags.map((tag) => (
            <button
              key={tag}
              type="button" // [중요] form 내부 버튼의 기본 submit 동작 방지
              onClick={() => onTagClick(tag)} // 클릭 시 부모의 onTagClick(태그명) 호출
              className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition duration-200 cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
      {/* --- ▲ [신규] 인기 태그 완료 ▲ --- */}
    </div>
  );
};

export default SearchBar;

