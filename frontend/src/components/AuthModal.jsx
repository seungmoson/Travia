import React from "react";

const AuthModal = ({ show, onClose, onLogin, onSignup }) => {
    if (!show) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
            onClick={handleBackdropClick}>
            <div className="bg-white rounded-3xl shadow-2xl w-80 p-6 text-center transform transition-all animate-scaleIn">
                <img src="/image3.png" alt="Travia Logo" className="w-32 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Travia에 오신 것을 환영합니다
                </h2>
                <p className="text-gray-500 text-sm mb-5">
                    로그인하거나 회원가입을 진행해주세요.
                </p>

                <button
                    onClick={onLogin}
                    className="w-full bg-indigo-500 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-600 transition">
                    로그인
                </button>

                <button
                    onClick={onSignup}
                    className="w-full mt-2 border border-gray-300 text-gray-800 font-medium py-2.5 rounded-xl hover:bg-gray-100 transition">
                    회원가입
                </button>

                <button
                    onClick={onClose}
                    className="mt-4 text-gray-400 text-xs hover:text-gray-600">
                    닫기
                </button>
            </div>
        </div>
    );
};
export default AuthModal;
