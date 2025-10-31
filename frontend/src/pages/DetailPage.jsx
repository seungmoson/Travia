import React, { useState, useEffect } from 'react';
// --- ▼ [수정] import 경로에서 .jsx 확장자 제거 ▼ ---
import BookingBox from '../components/BookingBox';
import ContentInfo from '../components/ContentInfo'; // 콘텐츠 정보 표시
import ReviewsSection from '../components/ReviewsSection'; // 리뷰 무한 스크롤 담당
import RelatedContentSection from '../components/RelatedContentSection'; // 관련 콘텐츠 무한 스크롤 담당
// --- ▲ [수정 완료] ▲ ---
import { ThreeDots } from 'react-loader-spinner';

// 백엔드 기본 URL 및 설정값
const API_BASE_URL = 'http://localhost:8000';
const DUMMY_STORAGE_DOMAIN = 'travia-storage.com';
const DEFAULT_IMAGE_URL = 'https://placehold.co/800x500/374151/ffffff?text=DETAIL+IMAGE+PLACEHOLDER';
const REVIEWS_PER_PAGE = 5; // 첫 페이지에 로드할 리뷰 개수
const RELATED_PER_PAGE = 4; // 첫 페이지에 로드할 관련 콘텐츠 개수

/**
 * 이미지 URL 유효성 검사 및 Placeholder 반환 (하위 컴포넌트로 전달)
 */
const getImageUrl = (url) => {
    const isUrlValid =
        url &&
        (url.startsWith('http') || url.startsWith('https') || url.startsWith('/')) &&
        !url.includes(DUMMY_STORAGE_DOMAIN);
    return isUrlValid ? url : DEFAULT_IMAGE_URL;
};

/**
 * 상세 페이지 컴포넌트 (리팩토링 버전)
 * - 초기 데이터 로딩 담당
 * - 하위 컴포넌트에 props 전달
 */
function DetailPage({ contentId, navigateTo, user }) {
    // --- ▼ [수정] 상태 단순화: 초기 데이터만 관리 ▼ ---
    const [content, setContent] = useState(null); // 콘텐츠 상세 정보
    const [initialReviews, setInitialReviews] = useState([]); // 초기 리뷰 목록
    const [totalReviews, setTotalReviews] = useState(0); // 전체 리뷰 개수
    const [initialRelatedContents, setInitialRelatedContents] = useState([]); // 초기 관련 콘텐츠 목록
    const [totalRelated, setTotalRelated] = useState(0); // 전체 관련 콘텐츠 개수
    const [loading, setLoading] = useState(true); // 초기 로딩 상태
    const [error, setError] = useState(null); // 에러 상태
    // --- ▲ [수정 완료] ▲ ---

    // --- ▼ [수정] 초기 데이터 페칭 로직 (props 준비) ▼ ---
    useEffect(() => {
        if (!contentId) {
            setError("콘텐츠 ID가 유효하지 않습니다.");
            setLoading(false);
            return;
        }

        const fetchContentDetail = async () => {
            setLoading(true);
            setError(null);
            // 상태 초기화
            setContent(null);
            setInitialReviews([]);
            setTotalReviews(0);
            setInitialRelatedContents([]);
            setTotalRelated(0);

            try {
                // 초기 로드 시 1페이지 리뷰 및 1페이지 관련 콘텐츠 요청
                // --- ▼ [FIX 1] 404 오류 해결: API 경로 수정 ▼ ---
                // 백엔드 prefix 중복이 해결되었으므로, 원래 경로(/content/{id})로 수정
                const response = await fetch(`${API_BASE_URL}/content/${contentId}?reviews_page=1&reviews_per_page=${REVIEWS_PER_PAGE}&related_page=1&related_per_page=${RELATED_PER_PAGE}`);
                // --- ▲ [FIX 1] 수정 완료 ▲ ---

                if (!response.ok) {
                    const errorData = await response.text().catch(() => '서버 응답 없음');
                    throw new Error(`데이터 로딩 실패 (상태: ${response.status}, 응답: ${errorData.substring(0, 100)}...)`);
                }

                const data = await response.json();

                // --- ▼ [FIX 2] 'Objects are not valid' 오류 해결 ▼ ---
                // API는 태그를 [{id: 1, name: '태그1'}] 객체로 반환합니다.
                // 하위 컴포넌트(ContentInfo)가 문자열 배열을 기대하므로,
                // .name만 추출하여 ['태그1', '태그2'] 형태로 변환합니다.
                const fixedData = {
                    ...data,
                    tags: data.tags ? data.tags.map(tag => tag.name) : []
                };
                setContent(fixedData); // 변환된 데이터로 콘텐츠 정보 설정
                // --- ▲ [FIX 2] 수정 완료 ▲ ---

                // 하위 컴포넌트에 전달할 초기 데이터 및 전체 개수 설정
                setInitialReviews(data.reviews || []);
                setTotalReviews(data.review_count || 0);
                setInitialRelatedContents(data.related_contents || []);
                setTotalRelated(data.total_related_count || 0);

            } catch (err) {
                console.error(`상세 데이터 로딩 중 오류 발생 (ID: ${contentId}):`, err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchContentDetail();
    }, [contentId]);
    // --- ▲ [수정 완료] ▲ ---

    // --- ▼▼▼ [신규 추가] 스크롤 상단 이동 useEffect ▼▼▼ ---
    useEffect(() => {
        // contentId가 변경될 때마다 (즉, 새 콘텐츠가 로드될 때마다)
        // 윈도우 스크롤을 맨 위(0, 0)로 즉시 이동시킵니다.
        try {
            window.scrollTo(0, 0);
        } catch (e) {
            console.error("스크롤을 맨 위로 이동하는 데 실패했습니다:", e);
        }
    }, [contentId]); // 👈 contentId가 바뀔 때마다 실행
    // --- ▲▲▲ [신규 추가] ▲▲▲ ---

    // --- 로딩 및 오류 상태 렌더링 ---
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <ThreeDots color="#4f46e5" height={80} width={80} />
            </div>
        );
    }

    if (error) {
         return (
             <div className="p-8 text-center bg-red-100 border border-red-400 text-red-700 rounded-lg m-8">
                 <h1 className="text-2xl font-bold mb-2">상세 정보 로딩 오류</h1>
                 <p>{error}</p>
                 <button
                     onClick={() => navigateTo('main')}
                     className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                 >
                     메인으로 돌아가기
                 </button>
             </div>
         );
    }

    if (!content) {
         return <div className="p-8 text-center">요청하신 콘텐츠를 찾을 수 없습니다. (ID: {contentId})</div>;
    }

    // --- ▼ [수정] 최종 렌더링: 하위 컴포넌트 사용 ▼ ---
    return (
        <div className="p-4 sm:p-8">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* --- 왼쪽 메인 콘텐츠 --- */}
                <div className="w-full lg:w-8/12 space-y-8">
                    {/* 1. 콘텐츠 정보 표시 (ContentInfo 컴포넌트 사용) */}
                    <ContentInfo content={content} getImageUrl={getImageUrl} />
                    
                    {/* 2. 리뷰 섹션 (ReviewsSection 컴포넌트 사용) */}
                    <ReviewsSection
                        contentId={contentId}
                        initialReviews={initialReviews}
                        totalReviews={totalReviews}
                    />
                </div>

                {/* --- 오른쪽 예약 박스 및 관련 콘텐츠 --- */}
                <div className="w-full lg:w-4/12">
                    <div className="lg:sticky lg:top-8 space-y-6">
                        {/* 3. 예약 박스 (기존과 동일) */}
                        <BookingBox
                            user={user}
                            navigateTo={navigateTo}
                            contentId={contentId}
                            contentAuthorId={content?.guide_id}
                        />
                        {/* 4. 관련 콘텐츠 섹션 (RelatedContentSection 컴포넌트 사용) */}
                         <RelatedContentSection
                            contentId={contentId}
                            initialRelatedContents={initialRelatedContents}
                            totalRelated={totalRelated}
                            navigateTo={navigateTo}
                         />
                    </div>
                </div>

            </div> {/* --- 메인 레이아웃 종료 --- */}
        </div>
    );
    // --- ▲ [수정 완료] ▲ ---
}

export default DetailPage;
