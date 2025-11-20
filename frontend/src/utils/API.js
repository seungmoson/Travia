// src/utils/API.js
const API_BASE = 'http://localhost:8000';

/** 내부 공통: JSON 요청 */
async function fetchJson(url, init = {}) {
    const res = await fetch(url, init);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`[API] ${init.method || 'GET'} ${url} 실패 (status ${res.status}) ${text?.slice(0, 200)}`);
    }
    // 204 등 비본문 응답 방지
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return {};
    return res.json();
}

/** 내부 공통: 여러 경로를 순차 시도 (엔드포인트 표기 단/복수 차이 대응) */
async function tryPaths(paths, init) {
    let lastErr;
    for (const p of paths) {
        try {
            return await fetchJson(`${API_BASE}${p}`, init);
        } catch (e) {
            lastErr = e;
        }
    }
    throw lastErr;
}

/* ===========================
 * 기존 함수 (유지)
 * =========================== */
export async function uploadImage(file, token) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/uploads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
    });
    if (!res.ok) throw new Error('이미지 업로드 실패');
    const data = await res.json();
    return data.url; // 서버 응답 스키마에 맞게 수정
}

export async function createContent(payload, token) {
    const res = await fetch(`${API_BASE}/contents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('게시글 생성 실패');
    return await res.json(); // {id: number, ...}
}

/* ===========================
 * 신규: 가이드 프로필/리뷰/콘텐츠
 * =========================== */

/**
 * 가이드 기본 정보 가져오기
 * @param {string|number} guideId
 * @returns {Promise<object>} { id, name, avatarUrl, intro, languages, regions, stats, ... }
 */
export async function getGuide(guideId) {
    return tryPaths([
        `/guides/${guideId}`,
        `/guide/${guideId}`, // 폴백
    ]);
}

/**
 * 가이드 리뷰 목록 가져오기
 * @param {string|number} guideId
 * @param {{page?:number, perPage?:number, sort?:'latest'|'rating_desc'|'rating_asc'}} opts
 * @returns {Promise<{items: any[], total: number, page: number, per_page: number}>}
 */
export async function getGuideReviews(guideId, opts = {}) {
    const { page = 1, perPage = 10, sort = 'latest' } = opts;
    const qs = `?page=${page}&per_page=${perPage}&sort=${encodeURIComponent(sort)}`;
    return tryPaths(
        [`/guides/${guideId}/reviews${qs}`, `/guide/${guideId}/reviews${qs}`]
    );
}

/**
 * 해당 가이드가 올린 다른 콘텐츠 목록
 * @param {string|number} guideId
 * @param {{page?:number, perPage?:number}} opts
 * @returns {Promise<{items: any[], total: number, page: number, per_page: number}>}
 */
export async function getGuideContents(guideId, opts = {}) {
    const { page = 1, perPage = 8 } = opts;
    const qs = `?page=${page}&per_page=${perPage}`;
    return tryPaths(
        [`/guides/${guideId}/contents${qs}`, `/guide/${guideId}/contents${qs}`]
    );
}

/**
 * 가이드에게 리뷰 작성
 * @param {string|number} guideId
 * @param {{rating:number, content:string, images?:string[]}} payload
 * @param {string} token (Bearer)
 */
export async function postGuideReview(guideId, payload, token) {
    if (!token) throw new Error('로그인이 필요합니다.');
    return tryPaths(
        [`/guides/${guideId}/reviews`, `/guide/${guideId}/reviews`],
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        }
    );
}
