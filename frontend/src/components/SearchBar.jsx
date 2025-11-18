import React, { useState, useMemo, useEffect } from 'react';

/**
 *  검색 입력창, 선택된 태그(알약), 포커스 시 태그 드롭다운을 렌더링하는 UI 컴포넌트
 * (가상 스크롤/무한 스크롤 기능 추가)
 *
 * @param {object} props
 * @param {string} props.inputValue - 입력창에 표시될 현재 값
 * @param {function(string): void} props.onInputChange - 입력창 값이 변경될 때 호출될 함수
 * @param {function(): void} props.onSearchSubmit - 검색 버튼 클릭 또는 Enter 시 호출될 함수
 * @param {string[]} props.tagsToShow - (신규) 포커스 시 드롭다운에 표시할 태그 목록
 * @param {function(string): void} props.onTagClick - (신규) 태그 클릭 시 호출될 함수
 * @param {string[]} props.selectedTags - (신규) 현재 선택된 태그 목록 (알약)
 * @param {function(string): void} props.onRemoveTag - (신규) 태그 알약의 'x' 클릭 시 호출
 * @param {function(): void} props.onClearAllTags - (신규) 모든 태그 지우기 버튼 클릭 시 호출
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
    onClearAllTags, //  prop 추가
    isFocused,
    onFocus
}) => {

    // --- ▼  가상 스크롤/무한 스크롤을 위한 설정 ▼ ---
    // 한 번에 렌더링할 태그 수
    const TAG_SLICE_SIZE = 50; 
    
    // 현재 화면에 보여줄 태그 개수를 관리하는 상태
    const [visibleTagCount, setVisibleTagCount] = useState(TAG_SLICE_SIZE);

    //  useMemo를 사용해 필터링 계산을 최적화
    // (props가 변경되지 않으면 이전에 계산된 값을 재사용)
    const filteredTags = useMemo(() => {
        return tagsToShow.filter(tag => 
            tag.toLowerCase().includes(inputValue.toLowerCase()) &&
            !selectedTags.includes(tag)
        );
    }, [tagsToShow, inputValue, selectedTags]);

    //  필터링된 태그 목록이 변경되면(예: 검색어 입력), 
    // 화면에 보여줄 태그 개수를 초기화
    useEffect(() => {
        setVisibleTagCount(TAG_SLICE_SIZE);
    }, [filteredTags]);

    //  현재 실제로 렌더링할 태그 목록 (전체 목록에서 visibleTagCount만큼 자름)
    const tagsToRender = filteredTags.slice(0, visibleTagCount);

    //  더 로드할 태그가 남아있는지 여부
    const hasMoreTags = filteredTags.length > visibleTagCount;

    //  드롭다운 스크롤 이벤트 핸들러
    const handleScroll = (e) => {
        const { scrollHeight, scrollTop, clientHeight } = e.currentTarget;
        const buffer = 50; // 하단에 50px 남았을 때 미리 로드

        // 스크롤이 하단에 거의 도달했는지 확인
        if (scrollHeight - scrollTop <= clientHeight + buffer) {
            // 더 로드할 태그가 있다면,
            if (hasMoreTags) {
                // 보여줄 태그 개수를 50개(TAG_SLICE_SIZE) 늘림
                setVisibleTagCount(count => count + TAG_SLICE_SIZE);
            }
        }
    };

    // 폼 제출 이벤트를 처리하는 핸들러
    const handleSubmit = (e) => {
        e.preventDefault(); // 페이지 새로고침 방지
        onSearchSubmit();   // 부모(MainPage)의 검색 실행 함수 호출
    };

    return (
        //  onFocus 이벤트를 감지하기 위해 wrapper div에 onFocus props 연결
        <div className="search-bar-container space-y-4 relative" onFocus={onFocus}>
            
            {/* --- ▼  레이아웃 구조 변경 ▼ --- */}
            {/*  form은 flex-wrap 제거, items-center 유지 */}
            <form onSubmit={handleSubmit} className="flex items-center border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-indigo-500 transition duration-200">
                
                {/*  태그와 입력을 묶는 래퍼 div 추가 (flex-grow로 남은 공간 차지) */}
                <div className="flex-grow flex flex-wrap items-center gap-y-1 gap-x-2 pr-2">
                    
                    {/*  태그 맵핑은 래퍼 div 안으로 이동 */}
                    {selectedTags.map((tag) => (
                        <span key={tag} className="flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-base font-semibold"> {/*  text-sm -> text-base */}
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

                    {/*  입력창도 래퍼 div 안으로 이동 */}
                    <input
                        type="search"
                        placeholder={selectedTags.length > 0 ? "태그 추가 또는 키워드 검색" : "여행지 또는 #태그로 검색"}
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value)}
                        //  text-sm -> text-base (높이/폰트 크기 일치)
                        className="flex-grow min-w-0 text-base focus:outline-none py-1" 
                        //  onFocus는 wrapper div로 이동
                    />
                </div>

                {/* --- ▼  '모두 지우기' 버튼 ▼ --- */}
                {/* 선택된 태그가 1개 이상일 때만 표시 */}
                {selectedTags.length > 0 && (
                    <button
                        type="button"
                        onClick={onClearAllTags} // 부모의 함수 호출
                        className="flex-shrink-0 p-1 ml-2 rounded-lg bg-gray-200 text-gray-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors duration-200"
                        aria-label="Remove all tags"
                    >
                        {/* X 아이콘 (검색 버튼과 크기 통일) */}
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                )}

                {/*  검색 버튼 (form의 직계 자식으로 변경) */}
                {/*  p-1 (유지), 아이콘 w-5 h-5 -> w-6 h-6 (높이 일치) */}
                <button 
                    type="submit" 
                    className="flex-shrink-0 bg-indigo-600 text-white p-1 rounded-lg hover:bg-indigo-700 transition duration-200 ml-2" //  ml-2 추가
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>
            </form>

            {/* --- ▼  태그 드롭다운 목록 ▼ --- */}
            {/* isFocused가 true일 때만 드롭다운 표시 */}
            {isFocused && (
                <div 
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto"
                    onScroll={handleScroll} //  스크롤 이벤트 리스너 추가
                >
                    
                    {/*  filteredTags.length -> tagsToRender.length로 변경 
                        (아니요, filteredTags.length가 맞습니다. 0개일 때를 확인해야 하므로) */}
                    {filteredTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 p-4">
                            
                            {/*  filteredTags.map -> tagsToRender.map로 변경 */}
                            {tagsToRender.map((tag) => (
                                <button
                                    key={tag}
                                    type="button" // form 제출 방지
                                    onClick={() => onTagClick(tag)} // 클릭 시 태그 선택
                                    className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition duration-200 cursor-pointer"
                                >
                                    #{tag}
                                </button>
                            ))}

                            {/*  더 로드할 태그가 있으면 로딩 중 표시 */}
                            {hasMoreTags && (
                                <div className="w-full text-center p-2 text-sm text-gray-500">
                                    태그 불러오는 중...
                                </div>
                            )}

                        </div>
                    ) : (
                        // 필터된 태그가 없을 때
                        <div className="p-4 text-gray-500">
                            {tagsToShow.length === 0 ? "태그 로딩 중..." : "일치하는 태그 없음"}
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default SearchBar;

