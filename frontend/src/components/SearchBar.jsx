import React from 'react';

/**
 * [수정됨] 검색 입력창, 선택된 태그(알약), 포커스 시 태그 드롭다운을 렌더링하는 UI 컴포넌트
 *
 * @param {object} props
 * @param {string} props.inputValue - 입력창에 표시될 현재 값
 * @param {function(string): void} props.onInputChange - 입력창 값이 변경될 때 호출될 함수
 * @param {function(): void} props.onSearchSubmit - 검색 버튼 클릭 또는 Enter 시 호출될 함수
 * @param {string[]} props.tagsToShow - (신규) 포커스 시 드롭다운에 표시할 태그 목록
 * @param {function(string): void} props.onTagClick - (신규) 태그 클릭 시 호출될 함수
 * @param {string[]} props.selectedTags - (신규) 현재 선택된 태그 목록 (알약)
 * @param {function(string): void} props.onRemoveTag - (신규) 태그 알약의 'x' 클릭 시 호출
 * @param {boolean} props.isFocused - (신규) 현재 컴포넌트가 포커스되었는지 여부
 * @param {function(): void} props.onFocus - (신규) 컴포넌트 포커스 시 호출될 함수
 */
const SearchBar = ({ 
    inputValue, 
    onInputChange, 
    onSearchSubmit, 
    tagsToShow = [],
    onTagClick,
    selectedTags = [],
    onRemoveTag,
    isFocused,
    onFocus
}) => {
    
    // 폼 제출 이벤트를 처리하는 핸들러
    const handleSubmit = (e) => {
        e.preventDefault(); // 페이지 새로고침 방지
        onSearchSubmit();   // 부모(MainPage)의 검색 실행 함수 호출
    };

    // [신규] 드롭다운에 표시할 태그 필터링
    // (이미 선택된 태그는 제외, 입력 중인 텍스트와 일치하는 태그만 표시)
    const filteredTags = tagsToShow.filter(tag => 
        tag.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.includes(tag)
    );

    return (
        // [수정] onFocus 이벤트를 감지하기 위해 wrapper div에 onFocus props 연결
        <div className="search-bar-container space-y-4 relative" onFocus={onFocus}>
            
            {/* --- ▼ [수정] 선택된 태그(알약) 및 입력창 ▼ --- */}
            <form onSubmit={handleSubmit} className="flex items-center border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-indigo-500 transition duration-200">
                
                {/* [신규] 선택된 태그(알약) 렌더링 영역 */}
                <div className="flex flex-wrap gap-2 pr-2">
                    {selectedTags.map((tag) => (
                        <span key={tag} className="flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                            {tag}
                            <button
                                type="button"
                                onClick={() => onRemoveTag(tag)} // 'X' 클릭 시 태그 제거
                                className="ml-2 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                                aria-label={`Remove ${tag} filter`}
                            >
                                &times; {/* 'X' 아이콘 */}
                            </button>
                        </span>
                    ))}
                </div>

                {/* [수정] 입력창 */}
                <input
                    type="search"
                    placeholder={selectedTags.length > 0 ? "태그 추가 또는 키워드 검색" : "여행지 또는 #태그로 검색"}
                    value={inputValue}
                    onChange={(e) => onInputChange(e.target.value)}
                    className="w-full text-lg p-1 focus:outline-none"
                    // [수정] onFocus는 wrapper div로 이동
                />

                {/* 검색 버튼 (변경 없음) */}
                <button type="submit" className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition duration-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>
            </form>
            {/* --- ▲ [수정 완료] ▲ --- */}


            {/* --- ▼ [신규] 태그 드롭다운 목록 ▼ --- */}
            {/* isFocused가 true일 때만 드롭다운 표시 */}
            {isFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                    
                    {/* 필터된 태그가 있으면 렌더링 */}
                    {filteredTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 p-4">
                            {filteredTags.map((tag) => (
                                <button
                                    key={tag}
                                    type="button" // form 제출 방지
                                    onClick={() => onTagClick(tag)} // 클릭 시 태그 선택
                                    className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition duration-200 cursor-pointer"
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    ) : (
                        // 필터된 태그가 없을 때
                        <div className="p-4 text-gray-500">
                            {tagsToShow.length === 0 ? "태그 로딩 중..." : "일치하는 태그 없음"}
                        </div>
                    )}

                </div>
            )}
            {/* --- ▲ [신규] 태그 드롭다운 완료 ▲ --- */}

        </div>
    );
};

export default SearchBar;

