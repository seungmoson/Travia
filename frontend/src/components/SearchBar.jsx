import React, { useState, useRef, useEffect } from 'react';
import { Search, Map as MapIcon, X } from 'lucide-react'; // X 아이콘 추가
import { LocationModal, TagsModal, CharacterModal } from './SearchModals';

const SearchBar = ({ options, searchParams, onUpdateSearch, navigateTo }) => {
    const [activeSection, setActiveSection] = useState(null);
    const searchRef = useRef(null);

    // 외부 클릭 시 모달 닫기
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setActiveSection(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 태그 토글 로직
    const toggleTag = (tag) => {
        const currentTags = searchParams.tags || [];
        const newTags = currentTags.includes(tag) 
            ? currentTags.filter(t => t !== tag) 
            : [...currentTags, tag];
        onUpdateSearch({ tags: newTags });
    };

    // [신규] 항목 초기화 핸들러 (이벤트 전파 방지 필수)
    const handleClear = (e, field) => {
        e.stopPropagation(); // X 버튼 눌렀을 때 모달이 열리는 것 방지
        if (field === 'location') onUpdateSearch({ location: '' });
        if (field === 'tags') onUpdateSearch({ tags: [] });
        if (field === 'character') onUpdateSearch({ character: null });
    };

    return (
        <div className="relative w-full max-w-4xl" ref={searchRef}>
            {/* 메인 검색바 */}
            <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow divide-x divide-gray-100 h-[66px]">
                
                {/* 1. 여행지 섹션 */}
                <div 
                    onClick={() => setActiveSection(activeSection === 'location' ? null : 'location')}
                    className={`group flex-1 pl-8 pr-4 cursor-pointer hover:bg-gray-100 rounded-l-full h-full flex flex-col justify-center relative ${activeSection === 'location' ? 'bg-gray-100' : ''}`}
                >
                    <div className="text-xs font-bold text-gray-800 mb-0.5">여행지</div>
                    <div className={`text-sm truncate pr-6 ${searchParams.location ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                        {searchParams.location || '어디로 떠나시나요?'}
                    </div>
                    
                    {/* X 버튼: 값이 있을 때만 표시 */}
                    {searchParams.location && (
                        <button 
                            onClick={(e) => handleClear(e, 'location')}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="지우기"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* 2. 태그 섹션 */}
                <div 
                    onClick={() => setActiveSection(activeSection === 'tags' ? null : 'tags')}
                    className={`group flex-1 px-6 cursor-pointer hover:bg-gray-100 h-full flex flex-col justify-center relative ${activeSection === 'tags' ? 'bg-gray-100' : ''}`}
                >
                    <div className="text-xs font-bold text-gray-800 mb-0.5">취향 태그</div>
                    <div className={`text-sm truncate pr-6 ${searchParams.tags && searchParams.tags.length > 0 ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                        {searchParams.tags && searchParams.tags.length > 0 
                            ? `${searchParams.tags[0]} 외 ${searchParams.tags.length - 1}개` 
                            : '어떤 여행을 원하세요?'}
                    </div>

                    {/* X 버튼 */}
                    {searchParams.tags && searchParams.tags.length > 0 && (
                        <button 
                            onClick={(e) => handleClear(e, 'tags')}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="초기화"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* 3. 캐릭터 섹션 */}
                <div 
                    onClick={() => setActiveSection(activeSection === 'character' ? null : 'character')}
                    className={`group flex-[1.2] px-6 cursor-pointer hover:bg-gray-100 h-full flex flex-col justify-center relative ${activeSection === 'character' ? 'bg-gray-100' : ''}`}
                >
                    <div className="text-xs font-bold text-gray-800 mb-0.5">동행 캐릭터</div>
                    <div className={`text-sm truncate pr-6 ${searchParams.character ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                        {searchParams.character?.name || '누구와 함께할까요?'}
                    </div>

                    {/* X 버튼 */}
                    {searchParams.character && (
                        <button 
                            onClick={(e) => handleClear(e, 'character')}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="지우기"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* 버튼 그룹 */}
                <div className="pr-2 pl-2 flex items-center gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); navigateTo('map'); }}
                        className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                        title="지도로 보기"
                    >
                        <MapIcon size={20} />
                    </button>
                    
                    {/* ▼▼▼ [수정된 부분] 돋보기 버튼 색상 변경 (#4f46e5) ▼▼▼ */}
                    <button 
                        className="w-12 h-12 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-full flex items-center justify-center shadow-md transform active:scale-95 transition-all"
                        onClick={() => setActiveSection(null)} 
                    >
                        <Search size={20} strokeWidth={3} />
                    </button>
                    {/* ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ */}
                </div>
            </div>

            {/* 모달 표시 영역 */}
            {activeSection && (
                <div className="absolute top-full mt-4 left-0 w-auto bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {activeSection === 'location' && (
                        <LocationModal 
                            locations={options.locations} 
                            onSelect={(loc) => { onUpdateSearch({ location: loc }); setActiveSection('tags'); }} 
                        />
                    )}
                    {activeSection === 'tags' && (
                        <TagsModal 
                            tags={options.tags} 
                            selectedTags={searchParams.tags || []} 
                            onToggle={toggleTag} 
                        />
                    )}
                    {activeSection === 'character' && (
                        <CharacterModal 
                            characters={options.characters} 
                            selectedChar={searchParams.character} 
                            onSelect={(char) => { onUpdateSearch({ character: char }); setActiveSection(null); }} 
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;