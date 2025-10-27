import React, { useState } from 'react';

// FastAPI 서버의 주소
const API_BASE_URL = 'http://localhost:8000'; 

/**
 * 로그인 페이지 컴포넌트
 * @param {function} login - App.jsx에서 받은 'handleLogin' 함수
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

        // 🚨 Seed Data에 정의된 계정으로 테스트하세요: traveler@travia.com / testpass123
        const loginPayload = {
            email: email,
            password: password, // 평문 비밀번호 전송
        };

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginPayload),
            });

            const result = await response.json();

            if (response.ok) {
                // [수정] 
                // 1. 로그인 성공 시 받은 JWT 토큰과 username을 localStorage에 저장합니다.
                if (result.access_token) {
                    const username = email.split('@')[0]; // 임시 닉네임
                    
                    localStorage.setItem('token', result.access_token);
                    // [추가] username도 localStorage에 저장
                    localStorage.setItem('username', username); 
                    
                    // 2. App.jsx의 상태 업데이트
                    login(username);

                } else {
                    // 서버가 200 OK를 보냈지만 토큰이 없는 예외 케이스
                    setErrorMessage(result.detail || '로그인 응답 형식이 올바르지 않습니다.');
                    return; 
                }
                
            } else {
                // 로그인 실패 (400 Bad Request 등)
                setErrorMessage(result.detail || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.');
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
                        // [수정] App.jsx의 라우팅 키에 맞게 '/' -> 'main'으로 변경
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

