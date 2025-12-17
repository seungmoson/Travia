// src/utils/API.js
const API_BASE = 'https://guidie.duckdns.org';

async function fetchJson(url, init = {}) {
    const res = await fetch(url, init);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`[API] ${init.method || 'GET'} ${url} 실패 (status ${res.status}) ${text?.slice(0, 200)}`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return {};
    return res.json();
}

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
    return data.url;
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

export async function getGuide(guideId) {
    return tryPaths([
        `/guides/${guideId}`,
        `/guide/${guideId}`, // 폴백
    ]);
}

export async function getGuideReviews(guideId, opts = {}) {
    const { page = 1, perPage = 10, sort = 'latest' } = opts;
    const qs = `?page=${page}&per_page=${perPage}&sort=${encodeURIComponent(sort)}`;
    return tryPaths(
        [`/guides/${guideId}/reviews${qs}`, `/guide/${guideId}/reviews${qs}`]
    );
}

export async function getGuideContents(guideId, opts = {}) {
    const { page = 1, perPage = 8 } = opts;
    const qs = `?page=${page}&per_page=${perPage}`;
    return tryPaths(
        [`/guides/${guideId}/contents${qs}`, `/guide/${guideId}/contents${qs}`]
    );
}

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
