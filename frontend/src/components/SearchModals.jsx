import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';

// 1. [여행지 모달]
export const LocationModal = ({ locations, onSelect }) => (
    <div className="p-6 w-[360px]">
        <div className="relative mb-4">
            <input
                type="text"
                placeholder="여행지 검색"
                className="w-full bg-gray-100 p-3 pl-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500 font-bold text-gray-700"
            />
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
            {locations.map((loc, idx) => (
                <div
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); onSelect(loc); }}
                    className="flex items-center p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                >
                    <div className="p-2 bg-gray-200 rounded-lg mr-3">
                        <MapPin size={18} className="text-gray-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{loc}, 대한민국</span>
                </div>
            ))}
        </div>
    </div>
);

// 2. [태그 모달]
export const TagsModal = ({ tags, selectedTags, selectedKeywords, onToggle, onUpdateKeywords }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTags = tags.filter(tag => {
        const tagName = typeof tag === 'string' ? tag : tag.name;
        return tagName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            e.preventDefault();
            const newKeyword = searchTerm.trim();
            if (!selectedKeywords.includes(newKeyword)) {
                onUpdateKeywords([...selectedKeywords, newKeyword]);
            }
            setSearchTerm('');
        }
    };

    const removeKeyword = (keyword) => {
        onUpdateKeywords(selectedKeywords.filter(k => k !== keyword));
    };

    return (
        <div className="p-6 w-[400px]">
            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder="태그 검색 또는 직접 입력 (Enter)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-gray-100 p-3 pl-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500 font-bold text-gray-700"
                />
            </div>

            {/* 선택된 키워드 */}
            {selectedKeywords && selectedKeywords.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {selectedKeywords.map((keyword, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                            #{keyword}
                            <button onClick={(e) => { e.stopPropagation(); removeKeyword(keyword); }} className="ml-1.5 hover:text-rose-900">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <h4 className="text-xs text-gray-500 font-bold mb-3">추천 태그</h4>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                {filteredTags.map((tag, idx) => {
                    const tagName = typeof tag === 'string' ? tag : tag.name;
                    const isSelected = selectedTags.includes(tagName);
                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggle(tagName); }}
                            className={`px-4 py-2 rounded-full text-sm border transition-all ${isSelected
                                    ? 'border-black bg-black text-white font-medium'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                                }`}
                        >
                            {tagName}
                        </button>
                    );
                })}
                {filteredTags.length === 0 && (
                    <div className="text-gray-400 text-sm w-full text-center py-4">검색 결과가 없습니다.</div>
                )}
            </div>
        </div>
    );
};

// 3. [캐릭터 모달]
export const CharacterModal = ({ characters, selectedChar, onSelect }) => (
    <div className="p-6 w-[500px]">
        <h3 className="text-sm font-bold text-gray-800 mb-1">여행 캐릭터를 선택하세요</h3>
        <p className="text-xs text-gray-500 mb-4">당신의 여행 스타일에 맞는 가이드나 여행자 특성을 선택해주세요</p>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {characters.map((char) => (
                <div
                    key={char.id}
                    onClick={(e) => { e.stopPropagation(); onSelect(char); }}
                    className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedChar?.id === char.id
                            ? 'border-rose-500 ring-1 ring-rose-500 bg-gray-50'
                            : 'border-gray-200 bg-white'
                        }`}
                >
                    <img
                        src={char.image_url || "https://via.placeholder.com/100"}
                        alt={char.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-gray-200"
                    />
                    <div className="ml-4 flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-gray-900">{char.name}</h4>
                        </div>
                        <p className="text-sm text-gray-500 mb-3 leading-snug">{char.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {char.relatedTags?.slice(0, 3).map((t, i) => (
                                <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);