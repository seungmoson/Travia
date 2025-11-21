import React, { useState, useRef, useEffect } from 'react';
import { Search, Map as MapIcon, X } from 'lucide-react';
import { LocationModal, TagsModal, CharacterModal } from './SearchModals';

const SearchBar = ({ 
    options, 
    searchParams, 
    onUpdateSearch, 
    navigateTo,
    isExpanded, 
    onExpand
}) => {
    const [activeSection, setActiveSection] = useState(null);
    const searchRef = useRef(null);
    const [localParams, setLocalParams] = useState(searchParams);

    useEffect(() => {
        setLocalParams(searchParams);
    }, [searchParams]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setActiveSection(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleTag = (tag) => {
        const currentTags = localParams.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];
        setLocalParams(prev => ({ ...prev, tags: newTags }));
    };

    const handleClear = (e, field) => {
        e.stopPropagation(); 
        if (field === 'location') setLocalParams(prev => ({ ...prev, location: '' }));
        if (field === 'tags') setLocalParams(prev => ({ ...prev, tags: [], keywords: [] }));
        if (field === 'character') setLocalParams(prev => ({ ...prev, character: null }));
    };

    const executeSearch = (e) => {
        e.stopPropagation();
        setActiveSection(null); 
        onUpdateSearch(localParams); 
    };

    // [핵심] 섹션별 모달 위치 결정 함수
    const getModalPositionClass = () => {
        switch (activeSection) {
            case 'location':
                return 'left-0'; // 왼쪽 끝 정렬
            case 'tags':
                return 'left-1/2 -translate-x-1/2'; // 중앙 정렬
            case 'character':
                return 'right-0'; // 오른쪽 끝 정렬
            default:
                return 'left-0';
        }
    };

    // --- 축소 모드 UI ---
    if (!isExpanded) {
        return (
            <div 
                onClick={onExpand}
                className="flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer py-2.5 px-4 gap-4 animate-in fade-in zoom-in-95 duration-200"
            >
                <span className="font-medium text-sm text-gray-900 truncate max-w-[100px]">{localParams.location || '어디든지'}</span>
                <span className="h-4 w-[1px] bg-gray-300"></span>
                <span className="font-medium text-sm text-gray-900 truncate max-w-[100px]">{(localParams.tags?.length > 0 || localParams.keywords?.length > 0) ? '태그 선택됨' : '어떤 여행?'}</span>
                <span className="h-4 w-[1px] bg-gray-300"></span>
                <span className={`text-sm truncate max-w-[100px] ${localParams.character ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{localParams.character?.name || '누구와?'}</span>
                <div className="w-8 h-8 bg-[#4f46e5] rounded-full flex items-center justify-center text-white ml-2" onClick={executeSearch}><Search size={14} strokeWidth={3} /></div>
            </div>
        );
    }

    // --- 확장 모드 UI ---
    return (
        <div className="relative w-full max-w-4xl animate-in fade-in slide-in-from-top-4 duration-300" ref={searchRef}>
            <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow divide-x divide-gray-100 h-[66px]">

                {/* 1. 여행지 */}
                <div onClick={() => setActiveSection(activeSection === 'location' ? null : 'location')} className={`group flex-1 pl-8 pr-4 cursor-pointer hover:bg-gray-100 rounded-l-full h-full flex flex-col justify-center relative ${activeSection === 'location' ? 'bg-gray-100' : ''}`}>
                    <div className="text-xs font-bold text-gray-800 mb-0.5">여행지</div>
                    <div className={`text-sm truncate pr-6 ${localParams.location ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>{localParams.location || '어디로 떠나시나요?'}</div>
                    {localParams.location && <button onClick={(e) => handleClear(e, 'location')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-300 rounded-full"><X size={12} /></button>}
                </div>

                {/* 2. 태그 */}
                <div onClick={() => setActiveSection(activeSection === 'tags' ? null : 'tags')} className={`group flex-1 px-6 cursor-pointer hover:bg-gray-100 h-full flex flex-col justify-center relative ${activeSection === 'tags' ? 'bg-gray-100' : ''}`}>
                    <div className="text-xs font-bold text-gray-800 mb-0.5">취향 태그</div>
                    <div className={`text-sm truncate pr-6 ${((localParams.tags?.length > 0) || (localParams.keywords?.length > 0)) ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>{((localParams.tags?.length > 0) || (localParams.keywords?.length > 0)) ? '태그 선택됨' : '어떤 여행을 원하세요?'}</div>
                    {((localParams.tags?.length > 0) || (localParams.keywords?.length > 0)) && <button onClick={(e) => handleClear(e, 'tags')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-300 rounded-full"><X size={12} /></button>}
                </div>

                {/* 3. 캐릭터 */}
                <div onClick={() => setActiveSection(activeSection === 'character' ? null : 'character')} className={`group flex-[1.2] px-6 cursor-pointer hover:bg-gray-100 h-full flex flex-col justify-center relative ${activeSection === 'character' ? 'bg-gray-100' : ''}`}>
                    <div className="text-xs font-bold text-gray-800 mb-0.5">동행 캐릭터</div>
                    <div className={`text-sm truncate pr-6 ${localParams.character ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>{localParams.character?.name || '누구와 함께할까요?'}</div>
                    {localParams.character && <button onClick={(e) => handleClear(e, 'character')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-300 rounded-full"><X size={12} /></button>}
                </div>

                {/* 버튼 그룹 */}
                <div className="pr-2 pl-2 flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); navigateTo('map'); }} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full"><MapIcon size={20} /></button>
                    <button className="w-12 h-12 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-full flex items-center justify-center shadow-md" onClick={executeSearch}><Search size={20} strokeWidth={3} /></button>
                </div>
            </div>

            {/* 모달 표시 영역 (위치 동적 적용) */}
            {activeSection && (
                <div className={`absolute top-full mt-4 w-auto bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${getModalPositionClass()}`}>
                    {activeSection === 'location' && <LocationModal locations={options.locations} onSelect={(loc) => { setLocalParams(prev => ({ ...prev, location: loc })); setActiveSection('tags'); }} />}
                    {activeSection === 'tags' && <TagsModal tags={options.tags} selectedTags={localParams.tags || []} selectedKeywords={localParams.keywords || []} onToggle={toggleTag} onUpdateKeywords={(newK) => setLocalParams(prev => ({ ...prev, keywords: newK }))} />}
                    {activeSection === 'character' && <CharacterModal characters={options.characters} selectedChar={localParams.character} onSelect={(char) => { setLocalParams(prev => ({ ...prev, character: char })); setActiveSection(null); }} />}
                </div>
            )}
        </div>
    );
};

export default SearchBar;