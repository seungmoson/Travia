// src/pages/GuideProfilePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    getGuide,
    getGuideReviews,
    getGuideContents,
    postGuideReview,
} from "../utils/API.js";

/** 안전한 숫자 처리 */
const toNum = (v, d = 0) => (typeof v === "number" && !Number.isNaN(v) ? v : d);

/** 아바타 이니셜 */
const initialOf = (name) =>
    name && typeof name === "string" && name.length > 0
        ? name.trim()[0].toUpperCase()
        : "?";

/** 별점 표시 */
function Stars({ value = 0 }) {
    const full = Math.round(toNum(value));
    return (
        <div className="inline-flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < full ? "text-yellow-500" : "text-gray-300"}>
                    ★
                </span>
            ))}
            <span className="ml-1 text-sm text-gray-600">({value?.toFixed?.(1) ?? "0.0"})</span>
        </div>
    );
}

/** 가이드 헤더 */
function GuideHeader({ guide }) {
    const name =
        guide.name ||
        guide.guide_name ||
        guide.username ||
        guide.display_name ||
        "가이드";
    const avatar =
        guide.avatarUrl ||
        guide.avatar_url ||
        guide.profile_image_url ||
        guide.profile_img ||
        null;

    const tagline =
        guide.tagline ||
        guide.title ||
        guide.intro_title ||
        (guide.languages ? `언어: ${[].concat(guide.languages).join(", ")}` : "여행 가이드");

    return (
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4">
            {avatar ? (
                <img
                    src={avatar}
                    alt={name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-200"
                />
            ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold ring-2 ring-indigo-200">
                    {initialOf(name)}
                </div>
            )}
            <div className="min-w-0">
                <h1 className="text-2xl font-extrabold text-gray-900 truncate">{name}</h1>
                <p className="text-sm text-gray-600 truncate">{tagline}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {guide.regions && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                            활동지역: {Array.isArray(guide.regions) ? guide.regions.join(", ") : guide.regions}
                        </span>
                    )}
                    {guide.languages && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                            언어: {Array.isArray(guide.languages) ? guide.languages.join(", ") : guide.languages}
                        </span>
                    )}
                    {guide.verified && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                            ✅ 인증 가이드
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

/** 가이드 통계 카드 */
function GuideStats({ guide }) {
    const avg =
        guide.avg_rating ||
        guide.guide_avg_rating ||
        guide.rating ||
        guide.stats?.avg_rating ||
        0;
    const reviews =
        guide.review_count || guide.reviews_count || guide.stats?.review_count || 0;
    const tours =
        guide.completed_tours || guide.tours_completed || guide.stats?.tours_completed || 0;
    const rebook =
        guide.rebook_rate || guide.stats?.rebook_rate || null;

    return (
        <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">가이드 통계</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">평균 평점</p>
                    <div className="mt-1"><Stars value={toNum(avg)} /></div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">리뷰 수</p>
                    <p className="mt-1 text-xl font-bold">{reviews}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">완료 투어</p>
                    <p className="mt-1 text-xl font-bold">{tours}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">재예약률</p>
                    <p className="mt-1 text-xl font-bold">{rebook != null ? `${Math.round(rebook * 100)}%` : "-"}</p>
                </div>
            </div>
        </div>
    );
}

/** 가이드 소개 카드 */
function GuideInfoCard({ guide }) {
    const bio =
        guide.bio || guide.intro || guide.description || "가이드 소개가 아직 없습니다.";
    const responseTime =
        guide.response_time || guide.stats?.response_time || null;
    const oneOnOne = guide.one_on_one === true || guide.is_private_tour === true;

    return (
        <div className="bg-white rounded-xl shadow-md p-5 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">가이드 소개</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{bio}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                {responseTime && <span className="px-2 py-0.5 bg-gray-100 rounded-full">평균 응답: {responseTime}</span>}
                {oneOnOne && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">1:1 맞춤 투어 가능</span>}
            </div>
        </div>
    );
}

/** 액션바 */
function GuideActionBar({ guide, navigateTo }) {
    return (
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
                가이드에게 문의하거나 투어를 예약해보세요.
            </div>
            <div className="flex items-center gap-2">
                <button
                    className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 transition text-sm"
                    onClick={() => alert("문의하기: 채팅/DM 모듈 연동 예정")}
                >
                    문의하기
                </button>
                <button
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition text-sm"
                    onClick={() => {
                        // 가이드의 대표 콘텐츠가 있다면 그 상세로 이동해 예약 흐름 유도
                        // 없다면 안내
                        if (guide?.representative_content_id) {
                            navigateTo("detail", guide.representative_content_id);
                        } else {
                            alert("예약은 투어 상세 페이지에서 진행됩니다. 가이드의 다른 투어를 선택해주세요.");
                            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                        }
                    }}
                >
                    예약하기
                </button>
            </div>
        </div>
    );
}

/** 리뷰 섹션 (가이드 대상 전용, 간단 구현) */
function GuideReviewsSection({ guideId, user }) {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [perPage] = useState(6);
    const [total, setTotal] = useState(0);
    const [sort, setSort] = useState("latest");
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    // 작성용
    const [writing, setWriting] = useState(false);
    const [rating, setRating] = useState(5);
    const [text, setText] = useState("");

    const canWrite = user?.isLoggedIn;

    const load = async (p = page, s = sort) => {
        setLoading(true);
        setErr(null);
        try {
            const res = await getGuideReviews(guideId, { page: p, perPage, sort: s });
            // 백엔드 응답 유연 처리
            const list = res.items || res.data || res.reviews || [];
            const tt = res.total ?? res.total_count ?? list.length;
            setItems(list);
            setTotal(tt);
        } catch (e) {
            console.error(e);
            setErr(e.message || "리뷰 로딩 실패");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1, sort);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guideId, sort]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total, perPage]);

    const submitReview = async () => {
        try {
            const token = localStorage.getItem("token");
            await postGuideReview(guideId, { rating: Number(rating), content: text }, token);
            setWriting(false);
            setText("");
            setRating(5);
            await load(1, sort);
        } catch (e) {
            alert(e.message || "리뷰 작성에 실패했습니다.");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">가이드 리뷰</h2>
                <div className="flex items-center gap-2">
                    <select
                        className="text-sm border rounded-md px-2 py-1"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                    >
                        <option value="latest">최신순</option>
                        <option value="rating_desc">평점 높은순</option>
                        <option value="rating_asc">평점 낮은순</option>
                    </select>
                </div>
            </div>

            {canWrite && (
                <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
                    {!writing ? (
                        <button
                            onClick={() => setWriting(true)}
                            className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
                        >
                            리뷰 작성하기
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">평점</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={rating}
                                    onChange={(e) => setRating(e.target.value)}
                                    className="w-20 border rounded-md px-2 py-1 text-sm"
                                />
                                <Stars value={Number(rating)} />
                            </div>
                            <textarea
                                rows={3}
                                placeholder="가이드와의 경험을 공유해주세요."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={submitReview}
                                    className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
                                >
                                    등록
                                </button>
                                <button
                                    onClick={() => {
                                        setWriting(false);
                                        setText("");
                                        setRating(5);
                                    }}
                                    className="px-3 py-2 rounded-md bg-white border hover:bg-gray-50 text-sm"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="text-center text-gray-500 py-8">리뷰 불러오는 중…</div>
            ) : err ? (
                <div className="text-center text-red-600 py-8">{err}</div>
            ) : items.length === 0 ? (
                <div className="text-center text-gray-500 py-8">아직 리뷰가 없습니다.</div>
            ) : (
                <>
                    <ul className="divide-y">
                        {items.map((rv, idx) => {
                            const nickname = rv.user_name || rv.nickname || rv.author || "익명";
                            const rate = rv.rating || rv.score || 0;
                            const body = rv.content || rv.comment || rv.text || "";
                            const created = rv.created_at || rv.created || rv.date || "";

                            return (
                                <li key={rv.id || idx} className="py-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-indigo-700 font-bold">
                                            {initialOf(nickname)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-semibold text-gray-800 truncate">{nickname}</p>
                                                <span className="text-xs text-gray-500 whitespace-nowrap">{created}</span>
                                            </div>
                                            <div className="mt-0.5"><Stars value={toNum(rate)} /></div>
                                            <p className="mt-2 text-gray-700 whitespace-pre-wrap break-words">{body}</p>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {/* 페이지네이션 */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                            className="px-3 py-1 rounded-md border bg-white hover:bg-gray-50 text-sm disabled:opacity-40"
                            disabled={page <= 1}
                            onClick={() => {
                                const np = Math.max(1, page - 1);
                                setPage(np);
                                load(np, sort);
                            }}
                        >
                            이전
                        </button>
                        <span className="text-sm text-gray-600">
                            {page} / {totalPages}
                        </span>
                        <button
                            className="px-3 py-1 rounded-md border bg-white hover:bg-gray-50 text-sm disabled:opacity-40"
                            disabled={page >= totalPages}
                            onClick={() => {
                                const np = Math.min(totalPages, page + 1);
                                setPage(np);
                                load(np, sort);
                            }}
                        >
                            다음
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

/** 가이드의 다른 투어 목록 (간단 카드) */
function GuideContentList({ items, navigateTo }) {
    if (!items || items.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md p-5 text-gray-500 text-sm">
                이 가이드가 올린 다른 투어가 없습니다.
            </div>
        );
    }
    return (
        <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">이 가이드의 다른 투어</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((c) => {
                    const thumb =
                        c.thumbnail_url || c.main_image_url || c.image_url || "https://placehold.co/600x380?text=TOUR";
                    return (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => navigateTo("detail", c.id)}
                            className="text-left bg-white border rounded-lg overflow-hidden hover:shadow-md transition"
                            title={c.title}
                        >
                            <img src={thumb} alt={c.title} className="w-full h-40 object-cover" />
                            <div className="p-3">
                                <p className="font-semibold text-gray-800 line-clamp-2">{c.title || "제목 없음"}</p>
                                <p className="mt-1 text-sm text-gray-500">{c.location || c.region || "-"}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/** 메인 페이지 */
export default function GuideProfilePage({ guideId, navigateTo, user }) {
    const [guide, setGuide] = useState(null);
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                // 가이드 기본 정보
                const g = await getGuide(guideId);
                // 스키마 차이 대응: g.data 등에 감싸져 있을 수 있음
                const guideData = g?.data || g;
                if (mounted) setGuide(guideData);

                // 다른 투어
                const cont = await getGuideContents(guideId, { page: 1, perPage: 9 });
                const list = cont.items || cont.data || cont.contents || [];
                if (mounted) setContents(list);
            } catch (e) {
                console.error(e);
                if (mounted) setErr(e.message || "가이드 정보를 불러오지 못했습니다.");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [guideId]);

    useEffect(() => {
        try { window.scrollTo(0, 0); } catch { }
    }, [guideId]);

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">가이드 정보를 불러오는 중…</div>
        );
    }
    if (err) {
        return (
            <div className="p-8 text-center">
                <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg p-6 inline-block">
                    {err}
                </div>
                <div className="mt-4">
                    <button
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                        onClick={() => navigateTo("main")}
                    >
                        메인으로
                    </button>
                </div>
            </div>
        );
    }
    if (!guide) {
        return <div className="p-8 text-center text-gray-500">해당 가이드를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
            <GuideHeader guide={guide} />
            <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                    <GuideInfoCard guide={guide} />
                    <GuideReviewsSection guideId={guideId} user={user} />
                </div>
                <div className="space-y-4">
                    <GuideStats guide={guide} />
                    <GuideActionBar guide={guide} navigateTo={navigateTo} />
                </div>
            </div>

            <GuideContentList items={contents} navigateTo={navigateTo} />
        </div>
    );
}
