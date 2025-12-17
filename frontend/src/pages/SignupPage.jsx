import React, { useMemo, useState } from "react";

const API_BASE_URL = "https://guidie.duckdns.org";
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);
const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const SignupPage = ({ navigateTo }) => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        user_type: "traveler",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [emailCheckMsg, setEmailCheckMsg] = useState("");
    const [isEmailAvailable, setIsEmailAvailable] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const fieldErrors = useMemo(() => {
        const errs = {};
        if (formData.username.trim().length > 0 && formData.username.trim().length < 2) {
            errs.username = "사용자 이름은 최소 2글자 이상이어야 합니다.";
        }
        const email = formData.email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.length > 0 && !emailRegex.test(email)) {
            errs.email = "올바른 이메일 형식이 아닙니다.";
        }
        if (formData.password.length > 0 && formData.password.length < 8) {
            errs.password = "비밀번호는 최소 8글자 이상이어야 합니다.";
        }
        return errs;
    }, [formData]);

    const hasClientErrors = Object.keys(fieldErrors).length > 0;
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });

        if (message) {
            setMessage("");
            setIsSuccess(false);
        }

        if (e.target.name === "email") {
            setIsEmailAvailable(false);
            setEmailCheckMsg("");
        }
    };

    const handleCheckEmail = async () => {
        if (fieldErrors.email || !formData.email) {
            setEmailCheckMsg("올바른 이메일 형식을 먼저 입력해주세요.");
            return;
        }

        setCheckingEmail(true);
        setEmailCheckMsg("");

        try {
            const response = await fetch(`${API_BASE_URL}/auth/check-email?email=${formData.email}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                setIsEmailAvailable(true);
                setEmailCheckMsg("사용 가능한 이메일입니다.");
            } else {
                setIsEmailAvailable(false);
                setEmailCheckMsg("이미 사용 중인 이메일입니다.");
            }
        } catch (error) {
            console.error(error);
            setEmailCheckMsg("서버 확인 불가 (백엔드 연결 필요)");
        } finally {
            setCheckingEmail(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);
        if (hasClientErrors) {
            setMessage("입력 정보를 다시 확인해주세요.");
            return;
        }

        if (!isEmailAvailable) {
            setMessage("이메일 중복 확인을 해주세요.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                setMessage("회원가입 완료! 잠시 후 로그인 페이지로 이동합니다.");
                setTimeout(() => navigateTo("login"), 2000);
            } else {
                setIsSuccess(false);
                const detail = data?.detail;
                const pretty = typeof detail === "string" ? detail : "회원가입 실패";
                setMessage(pretty);
            }
        } catch (error) {
            console.error(error);
            setMessage("서버 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl space-y-6">
                <div className="flex flex-col items-center">
                    <img
                        src="/image3.png"
                        alt="Travia Logo"
                        className="w-48 mb-2 object-contain"
                        onError={(e) => {
                            e.target.src = "https://placehold.co/192x64/6366F1/FFFFFF?text=Travia+Logo";
                        }}/>
                    <h1 className="text-3xl font-extrabold text-gray-900 mt-4">Travia 회원가입</h1>
                    <p className="text-sm text-gray-500 mt-1">AI 기반 맞춤 여행 플랫폼</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">사용자 이름</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <UserIcon />
                            </div>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                minLength={2}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                placeholder="이름 또는 닉네임"/>
                        </div>
                        {fieldErrors.username && (
                            <p className="mt-1 text-xs text-red-600 pl-1">{fieldErrors.username}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">이메일</label>
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <MailIcon />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 transition ${
                                        isEmailAvailable ? "border-green-500 focus:ring-green-500" : "border-gray-300 focus:ring-indigo-500"
                                    }`}
                                    placeholder="example@email.com"/>
                            </div>
                            <button
                                type="button" // submit 방지
                                onClick={handleCheckEmail}
                                disabled={checkingEmail || !!fieldErrors.email || !formData.email}
                                className="whitespace-nowrap px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl border border-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                {checkingEmail ? "확인 중.." : "중복 확인"}
                            </button>
                        </div>
                        
                        {fieldErrors.email ? (
                            <p className="mt-1 text-xs text-red-600 pl-1">{fieldErrors.email}</p>
                        ) : emailCheckMsg ? (
                            <p className={`mt-1 text-xs pl-1 ${isEmailAvailable ? "text-green-600 font-medium" : "text-red-600"}`}>
                                {emailCheckMsg}
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">비밀번호</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <LockIcon />
                            </div>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={8}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                placeholder="비밀번호 (8자 이상)"/>
                        </div>
                        {fieldErrors.password && (
                            <p className="mt-1 text-xs text-red-600 pl-1">{fieldErrors.password}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50 mt-4 shadow-md">
                        {loading ? "가입 처리 중..." : "회원가입"}
                    </button>
                </form>

                {message && (
                    <div className={`mt-4 text-center text-sm font-medium p-3 rounded-lg ${isSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {message}
                    </div>
                )}

                <p className="text-sm text-gray-500 text-center mt-6">
                    이미 계정이 있으신가요?{" "}
                    <button onClick={() => navigateTo("login")} className="text-indigo-500 font-medium hover:underline">
                        로그인하기
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
