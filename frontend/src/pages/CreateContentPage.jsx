// src/pages/CreateContentPage.jsx
import React from 'react';
import ContentForm from '../components/ContentForm.jsx';

export default function CreateContentPage({ user, navigateTo, setShowAuthModal }) {
    // 접근 제어
    if (!user?.isLoggedIn) {
        setShowAuthModal?.(true);
        return <div className="p-6">로그인이 필요합니다.</div>;
    }
    if (user.user_type !== 'guide') {
        return <div className="p-6 text-red-600">가이드만 상품을 등록할 수 있습니다.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">여행 게시글 등록</h1>
            <ContentForm
                user={user}
                onSuccess={(newId) => navigateTo('detail', newId)}
            />
        </div>
    );
}
