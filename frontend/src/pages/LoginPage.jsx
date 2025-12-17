import React, { useState } from 'react';

const API_BASE_URL = 'https://guidie.duckdns.org'; 

const decodeToken = (token) => {
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(decodedJson);
        return payload;
    } catch (error) {
        console.error("Invalid token:", error);
        return null;
    }
};

const LoginPage = ({ login, navigateTo }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setLoading(true);

        const loginPayload = {
            email: email,
            password: password,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginPayload),
            });

            const loginResult = await response.json();

            if (!response.ok || !loginResult.access_token) {
                setErrorMessage(loginResult.detail || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.');
                setLoading(false);
                return;
            }
            
            const token = loginResult.access_token;
            const payload = decodeToken(token);

            if (!payload) {
                setErrorMessage("토큰 디코딩에 실패했습니다. 토큰 형식이 잘못되었습니다.");
                setLoading(false);
                return;
            }

            const userId = payload.id || payload.sub; // 'id' 혹은 'sub' (표준)
            const username = payload.nickname; // 스키마(models.py)의 'nickname'
            const userType = payload.user_type; // 스키마(models.py)의 'user_type'

            if (userId && username && userType) {
                localStorage.setItem('token', token);
                localStorage.setItem('username', username);
                localStorage.setItem('user_id', userId);
                localStorage.setItem('user_type', userType);
                login();
            } else {
                console.error("Token payload missing required fields:", payload);
                setErrorMessage("로그인 성공했으나, 토큰에 필수 정보(id, nickname, user_type)가 없습니다.");
            }

        } catch (error) {
            console.error('Login request failed:', error);
            setErrorMessage('네트워크 연결 또는 서버 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl space-y-6">
                <div className="flex flex-col items-center">
                    <img 
                        src="/image3.png" 
                        alt="Travia Logo" 
                        className="w-48 mb-2" 
                        onError={(e) => { e.target.src = 'https://placehold.co/192x64/6366F1/FFFFFF?text=Travia+Logo'; e.target.onerror = null; }}
                    />
                    <h2 className="text-3xl font-extrabold text-gray-900 text-center mt-4">
                        Travia 로그인
                    </h2>
                </div>

                {errorMessage && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg text-center font-medium">
                        {errorMessage}
                    </div>
                )}
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">이메일</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                            placeholder="traveler@travia.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">비밀번호</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                            placeholder="testpass123"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150"
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </form>
                <div className="text-sm text-gray-500 text-center mt-6">
                    계정이 없으신가요?{" "}
                    <button
                        onClick={() => navigateTo("signup")}
                        className="text-indigo-500 font-medium hover:underline">
                        회원가입
                    </button>
                </div>
            </div>
        </div>
    );
};
export default LoginPage;
