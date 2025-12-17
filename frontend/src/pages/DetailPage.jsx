import React, { useState, useEffect } from 'react';
import BookingBox from '../components/BookingBox';
import ContentInfo from '../components/ContentInfo';
import ReviewsSection from '../components/ReviewsSection';
import RelatedContentSection from '../components/RelatedContentSection';
import { ThreeDots } from 'react-loader-spinner';

const API_BASE_URL = 'https://guidie.duckdns.org';
const DUMMY_STORAGE_DOMAIN = 'travia-storage.com';
const DEFAULT_IMAGE_URL = 'https://placehold.co/800x500/374151/ffffff?text=DETAIL+IMAGE+PLACEHOLDER';
const REVIEWS_PER_PAGE = 5;
const RELATED_PER_PAGE = 4;

const getImageUrl = (url) => {
    const isUrlValid =
        url &&
        (url.startsWith('http') || url.startsWith('https') || url.startsWith('/')) &&
        !url.includes(DUMMY_STORAGE_DOMAIN);
    return isUrlValid ? url : DEFAULT_IMAGE_URL;
};

function DetailPage({ contentId, navigateTo, user, setShowAuthModal }) {
    const [content, setContent] = useState(null);
    const [initialReviews, setInitialReviews] = useState([]);
    const [totalReviews, setTotalReviews] = useState(0);
    const [initialRelatedContents, setInitialRelatedContents] = useState([]);
    const [totalRelated, setTotalRelated] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!contentId) {
            setError("콘텐츠 ID가 유효하지 않습니다.");
            setLoading(false);
            return;
        }

        const fetchContentDetail = async () => {
            setLoading(true);
            setError(null);
            setContent(null);
            setInitialReviews([]);
            setTotalReviews(0);
            setInitialRelatedContents([]);
            setTotalRelated(0);

            try {
                const response = await fetch(`${API_BASE_URL}/content/${contentId}?reviews_page=1&reviews_per_page=${REVIEWS_PER_PAGE}&related_page=1&related_per_page=${RELATED_PER_PAGE}`);
                if (!response.ok) {
                    const errorData = await response.text().catch(() => '서버 응답 없음');
                    throw new Error(`데이터 로딩 실패 (상태: ${response.status}, 응답: ${errorData.substring(0, 100)}...)`);
                }

                const data = await response.json();
                const fixedData = {
                    ...data,
                    tags: data.tags ? data.tags.map(tag => tag.name) : []
                };
                setContent(fixedData);
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

    useEffect(() => {
        try {
            window.scrollTo(0, 0);
        } catch (e) {
            console.error("스크롤을 맨 위로 이동하는 데 실패했습니다:", e);
        }
    }, [contentId]);

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

    return (
        <div className="p-4 sm:p-8">
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-8/12 space-y-8">
                    <ContentInfo content={content} getImageUrl={getImageUrl} />
                    <ReviewsSection
                        contentId={contentId}
                        initialReviews={initialReviews}
                        totalReviews={totalReviews}/>
                </div>
                <div className="w-full lg:w-4/12">
                    <div className="lg:sticky lg:top-8 space-y-6">
                        <BookingBox
                            user={user}
                            navigateTo={navigateTo}
                            contentId={contentId}
                            contentAuthorId={content?.guide_id}
                            setShowAuthModal={setShowAuthModal}/>
                         <RelatedContentSection
                            contentId={contentId}
                            initialRelatedContents={initialRelatedContents}
                            totalRelated={totalRelated}
                            navigateTo={navigateTo}/>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default DetailPage;
