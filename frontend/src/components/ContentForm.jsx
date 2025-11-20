// src/components/ContentForm.jsx
import React, { useState } from 'react';
import { createContent, uploadImage } from '../utils/API.js';
import MapContainer from './MapContainer.jsx'; // 이미 있음
// 선택 모드: onSelect({lat,lng,address})를 부모로 올려보내게 MapContainer를 살짝 확장하세요.

const REGIONS = ['서울', '부산', '제주', '경주', '강릉', '여수', '전주'];

export default function ContentForm({ user, onSuccess }) {
    const [form, setForm] = useState({
        title: '',
        description: '',
        region: '',
        price: '',
        capacity: 10,
        start_date: '',
        end_date: '',
        meeting_point: { lat: null, lng: null, address: '' },
        tags: [],
    });
    const [tagInput, setTagInput] = useState('');
    const [mainImageFile, setMainImageFile] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const addTag = () => {
        const t = tagInput.trim();
        if (!t) return;
        if (!form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
        setTagInput('');
    };
    const removeTag = (t) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));

    const handleSelectPoint = ({ lat, lng, address }) => {
        setForm(f => ({ ...f, meeting_point: { lat, lng, address: address || f.meeting_point.address } }));
    };

    const validate = () => {
        if (!form.title || form.title.length < 4) return '제목을 4자 이상 입력하세요.';
        if (!form.description || form.description.length < 20) return '설명을 20자 이상 입력하세요.';
        if (!form.region) return '지역을 선택하세요.';
        if (!form.price || Number(form.price) <= 0) return '가격을 올바르게 입력하세요.';
        if (!form.start_date || !form.end_date) return '일정(시작/종료)을 입력하세요.';
        if (!form.meeting_point.lat || !form.meeting_point.lng) return '집결 위치를 지도에서 선택하세요.';
        if (!mainImageFile) return '대표 이미지를 업로드하세요.';
        return '';
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const v = validate();
        if (v) { setErr(v); return; }
        setErr('');
        setLoading(true);
        try {
            // 1) 이미지 업로드
            const token = localStorage.getItem('token');
            const mainImageUrl = await uploadImage(mainImageFile, token);
            const galleryUrls = [];
            for (const f of galleryFiles) {
                const url = await uploadImage(f, token);
                galleryUrls.push(url);
            }
            // 2) 본문 생성
            const payload = {
                title: form.title,
                description: form.description,
                region: form.region,
                price: Number(form.price),
                capacity: Number(form.capacity),
                start_date: form.start_date,
                end_date: form.end_date,
                meeting_point: form.meeting_point,       // {lat,lng,address}
                tags: form.tags,
                main_image_url: mainImageUrl,
                gallery_image_urls: galleryUrls,
                author_id: user.id,                       // 서버가 토큰으로도 확인하지만 함께 보냄
            };
            const created = await createContent(payload, token);
            onSuccess?.(created.id);
        } catch (e2) {
            console.error(e2);
            setErr('등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6 bg-white rounded-xl shadow p-6">
            {err && <div className="text-red-600 text-sm">{err}</div>}

            <div>
                <label className="block font-semibold">제목</label>
                <input className="mt-1 w-full border rounded p-2"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div>
                <label className="block font-semibold">설명</label>
                <textarea rows={6} className="mt-1 w-full border rounded p-2"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block font-semibold">지역</label>
                    <select className="mt-1 w-full border rounded p-2"
                        value={form.region}
                        onChange={e => setForm(f => ({ ...f, region: e.target.value }))}>
                        <option value="">선택</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block font-semibold">가격(원)</label>
                    <input type="number" className="mt-1 w-full border rounded p-2"
                        value={form.price}
                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                    <label className="block font-semibold">정원(명)</label>
                    <input type="number" className="mt-1 w-full border rounded p-2"
                        value={form.capacity}
                        onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block font-semibold">시작일</label>
                    <input type="date" className="mt-1 w-full border rounded p-2"
                        value={form.start_date}
                        onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                    <label className="block font-semibold">종료일</label>
                    <input type="date" className="mt-1 w-full border rounded p-2"
                        value={form.end_date}
                        onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
            </div>

            {/* 지도에서 집결 위치 선택 */}
            <div>
                <label className="block font-semibold mb-2">집결 위치</label>
                <div className="h-72 rounded overflow-hidden border relative">
                    <MapProvider selectionMode={true}>
                        <MapContainer
                            selectionMode
                            onSelect={handleSelectPoint}
                            initialCenter={{ lat: 37.5665, lng: 126.9780 }}
                        />
                    </MapProvider>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    선택: {form.meeting_point.address || `${form.meeting_point.lat ?? '-'}, ${form.meeting_point.lng ?? '-'}`}
                </p>
            </div>

            {/* 태그 */}
            <div>
                <label className="block font-semibold">태그</label>
                <div className="flex gap-2 mt-2">
                    <input className="flex-1 border rounded p-2"
                        value={tagInput}
                        placeholder="#야경 / #온천"
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                    <button type="button" onClick={addTag}
                        className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">추가</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                    {form.tags.map(t => (
                        <span key={t} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                            #{t}
                            <button type="button" className="ml-2" onClick={() => removeTag(t)}>×</button>
                        </span>
                    ))}
                </div>
            </div>

            {/* 이미지 업로드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block font-semibold">대표 이미지</label>
                    <input type="file" accept="image/*" onChange={e => setMainImageFile(e.target.files?.[0] || null)} />
                </div>
                <div>
                    <label className="block font-semibold">갤러리 (여러 장)</label>
                    <input multiple type="file" accept="image/*" onChange={e => setGalleryFiles(Array.from(e.target.files || []))} />
                </div>
            </div>

            <div className="pt-2">
                <button disabled={loading}
                    className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                    {loading ? '등록 중...' : '등록하기'}
                </button>
            </div>
        </form>
    );
}
