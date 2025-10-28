import React, { useState } from 'react';

// FastAPI 서버의 주소
const API_BASE_URL = 'http://localhost:8000'; 

// ▼▼▼ [신규] App.jsx에서 decodeToken 함수 복사 ▼▼▼
/**
 * 토큰 디코딩 함수 (단순 Base64 디코딩)
 * @param {string} token - JWT 토큰
 * @returns {object | null} 디코딩된 페이로드 (또는 오류 시 null)
 */
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
// ▲▲▲ [신규] 함수 복사 완료 ▲▲▲


/**
 * 로그인 페이지 컴포넌트
 * @param {function} login - App.jsx에서 받은 'handleLogin' 함수 (인자 없음)
 * @param {function} navigateTo - 페이지 이동 함수
 */
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
            // --- 1단계: 로그인 API 호출 (토큰 받기) ---
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
            
            // --- 2단계: 토큰 확보 및 디코딩 ---
            const token = loginResult.access_token;
            const payload = decodeToken(token); // [수정] 토큰 즉시 디코딩

            if (!payload) {
                setErrorMessage("토큰 디코딩에 실패했습니다. 토큰 형식이 잘못되었습니다.");
                setLoading(false);
                return;
            }

            // --- 3단계: 모든 정보 localStorage에 저장 ---
            
            // [수정] payload에서 직접 사용자 정보를 추출합니다.
            // (백엔드 스키마/JWT 설정에 따라 키 이름이 다를 수 있습니다)
            // 가정: 'sub' = id, 'nickname' = username, 'user_type' = user_type
            const userId = payload.id || payload.sub; // 'id' 혹은 'sub' (표준)
            const username = payload.nickname; // 스키마(models.py)의 'nickname'
            const userType = payload.user_type; // 스키마(models.py)의 'user_type'

            if (userId && username && userType) {
                localStorage.setItem('token', token);
                localStorage.setItem('username', username);
                localStorage.setItem('user_id', userId);
                localStorage.setItem('user_type', userType);

                // --- 4단계: App.jsx 상태 업데이트 ---
                login(); // App.jsx의 handleLogin이 localStorage에서 모든 정보를 읽어감
            
            } else {
                console.error("Token payload missing required fields:", payload);
                setErrorMessage("로그인 성공했으나, 토큰에 필수 정보(id, nickname, user_type)가 없습니다.");
            }

        } catch (error) {
            // 1단계 (로그인) 네트워크 오류
            console.error('Login request failed:', error);
            setErrorMessage('네트워크 연결 또는 서버 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl space-y-6">
                <h2 className="text-3xl font-extrabold text-gray-900 text-center">
                    Travia 로그인
                </h2>
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
                <div className="text-center text-sm">
                    <button 
                        onClick={() => navigateTo('main')}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        아직 회원이 아니신가요? (메인으로 돌아가기)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;