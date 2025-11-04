import React, { useState } from "react";

const API_BASE_URL = "http://localhost:8000";

const SignupPage = ({ navigateTo }) => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        user_type: "traveler", // 기본값은 'traveler' (UI에서 선택 제거됨)
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false); // 성공/실패 메시지 스타일링용

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setIsSuccess(false);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData), // user_type: "traveler"가 포함됨
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                setMessage("회원가입이 완료되었습니다! 2초 후 로그인 페이지로 이동합니다.");
                setTimeout(() => navigateTo("login"), 2000); // 2초 후 이동
            } else {
                setIsSuccess(false);
                setMessage(data.detail || "회원가입 실패. 입력 정보를 확인해주세요.");
            }
        } catch (error) {
            console.error("회원가입 에러:", error);
            setIsSuccess(false);
            setMessage("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl space-y-6">
                {/* 로고 */}
                <div className="flex flex-col items-center">
                    {/* [수정] 스크린샷을 바탕으로 src 경로를 /image3.png로 수정 */}
                    <img 
                        src="/image3.png" 
                        alt="Travia Logo" 
                        className="w-48 mb-2" // [수정] w-24, rounded-full -> w-48
                        onError={(e) => { e.target.src = 'https://placehold.co/192x64/6366F1/FFFFFF?text=Travia+Logo'; e.target.onerror = null; }}
                    />
                    <h1 className="text-3xl font-extrabold text-gray-900 mt-4">Travia 회원가입</h1> {/* [수정] 로고와 간격(mt-4) 추가 */}
                    <p className="text-sm text-gray-500 mt-1">AI 기반 맞춤 여행 플랫폼</p>
                </div>

                {/* 입력 폼 */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">사용자 이름</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="이름 또는 닉네임 입력"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">이메일</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="example@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">비밀번호</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="비밀번호 입력"
                        />
                    </div>
                    
                    {/* --- ▼ [수정] 사용자 유형 선택 UI 제거 ▼ --- */}
                    {/* <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">가입 유형</label>
                        <div className="flex space-x-4">
                            ... (라디오 버튼 UI 제거) ...
                        </div>
                    </div>
                    */}
                    {/* --- ▲ [수정 완료] ▲ --- */}


                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
                    >
                        {loading ? "가입 중..." : "회원가입"}
                    </button>
                </form>

                {/* 메시지 */}
                {message && (
                    <p className={`mt-4 text-center text-sm font-medium ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}


                {/* 하단 */}
                <p className="text-sm text-gray-500 text-center mt-6">
                    이미 계정이 있으신가요?{" "}
                    <button
                        onClick={() => navigateTo("login")}
                        className="text-indigo-500 font-medium hover:underline"
                    >
                        로그인하기
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;

