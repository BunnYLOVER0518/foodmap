import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

function LoginSignup() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSignupMode, setIsSignupMode] = useState(location.pathname === '/signup');
    const [loginForm, setLoginForm] = useState({ id: '', password: '' });
    const [signupForm, setSignupForm] = useState({ id: '', password: '', name: '' });
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const toggleMode = () => setIsSignupMode(!isSignupMode);

    useEffect(() => {
        setIsSignupMode(location.pathname === '/signup');
    }, [location.pathname]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImageFile(file);
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/login', loginForm);
            if (res.data.success) {
                localStorage.setItem("user_id", loginForm.id);
                localStorage.setItem("name", res.data.name);
                navigate('/');
            } else {
                alert("로그인 실패");
                setLoginForm({ id: '', password: '' });
            }
        } catch (err) {
            alert("로그인 실패");
            setLoginForm({ id: '', password: '' });
            console.error(err);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('id', signupForm.id);
        data.append('password', signupForm.password);
        data.append('name', signupForm.name);
        if (imageFile) data.append('image', imageFile);

        try {
            await axios.post('http://localhost:5000/signup', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert('회원가입 성공!');
            setIsSignupMode(false);
        } catch (err) {
            alert('회원가입 실패');
            console.error(err);
        }
    };

    return (
        <>
            <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
          box-shadow: 0 0 0px 1000px transparent inset !important;
          -webkit-text-fill-color: inherit !important;
          caret-color: inherit !important;
          background-color: transparent !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .login-panel input:-webkit-autofill {
          -webkit-text-fill-color: #5a3e9e !important;
        }

        .signup-panel input:-webkit-autofill {
          -webkit-text-fill-color: #00bfff !important;
        }

        html, body {
          height: 100%;
          font-family: 'Segoe UI', sans-serif;
        }

        .container {
          width: 100%;
          height: 100vh;
          display: flex;
          position: relative;
          overflow: hidden;
        }

        .panel {
          width: 50%;
          height: 100%;
          padding: 60px 40px;
          transition: all 0.5s ease-in-out;
          z-index: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .login-panel {
          background: #f3f3f3;
          color: #5a3e9e;
        }

        .signup-panel {
          background: #1c1f26;
          color: #00bfff;
        }

        h2 {
          margin-bottom: 30px;
          font-weight: 600;
          font-size: 24px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;
        }

        .input-group label {
          font-size: 14px;
          margin-bottom: 5px;
          color: inherit;
        }

        .input-group input {
          width: 100%;
          padding: 12px;
          border: none;
          border-bottom: 2px solid rgba(0, 0, 0, 0.2);
          background: transparent;
          color: inherit;
          font-size: 14px;
        }

        .input-group input:focus {
          outline: none;
          border-bottom-color: currentColor;
        }

        .btn {
          padding: 10px 20px;
          margin-top: 10px;
          border: none;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
        }

        .btn.white {
          background: #5a3e9e;
          color: white;
        }

        .signup-panel .btn.white {
          background: #00bfff;
          color: white;
        }

        .slider {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: white;
          transition: transform 0.5s ease-in-out;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .slider-content {
          text-align: center;
          pointer-events: auto;
        }

        .signup-mode .slider {
          transform: translateX(100%);
        }

        .back-arrow {
          position: absolute;
          top: 20px;
          left: 20px;
          z-index: 10;
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #444;
          transition: color 0.2s;
        }

        .back-arrow:hover {
          color: #222;
        }

        .preview-img {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 10px;
        }

        .preview-img {
          margin-top: 10px;
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 10px;
          cursor: pointer;
          border: 2px solid white;
        }

        .modal {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999;
        }

        .modal img {
          max-width: 80%;
          max-height: 80%;
          border-radius: 10px;
        }
      `}</style>

            <div className={`container ${isSignupMode ? "" : "signup-mode"}`}>
                <button className="back-arrow" onClick={() => navigate('/')}>←</button>

                <div className="panel login-panel">
                    <h2>로그인</h2>
                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label htmlFor="login-id">아이디</label>
                            <input
                                type="text"
                                id="login-id"
                                name="id"
                                autoComplete="new-id"
                                value={loginForm.id}
                                onChange={(e) => setLoginForm({ ...loginForm, id: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="login-pw">비밀번호</label>
                            <input
                                type="password"
                                id="login-pw"
                                name="password"
                                autoComplete="new-id"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            />
                        </div>
                        <button className="btn white" type="submit">로그인</button>
                    </form>
                </div>

                <div className="panel signup-panel">
                    <h2>회원가입</h2>
                    <form onSubmit={handleSignup}>
                        <div className="input-group">
                            <label htmlFor="signup-id">아이디</label>
                            <input
                                type="text"
                                id="signup-id"
                                name="id"
                                autoComplete="new-id"
                                onChange={(e) => setSignupForm({ ...signupForm, id: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="signup-pw">비밀번호</label>
                            <input
                                type="password"
                                id="signup-pw"
                                name="password"
                                autoComplete="new-id"
                                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="signup-name">이름</label>
                            <input
                                type="text"
                                id="signup-name"
                                name="name"
                                autoComplete="new-id"
                                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="signup-img">프로필 이미지</label>
                            {previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt="미리보기"
                                    className="preview-img"
                                    onClick={() => setShowModal(true)}
                                />
                            )}
                            <input
                                type="file"
                                id="signup-img"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>
                        <button className="btn white" type="submit">회원가입</button>
                    </form>
                </div>

                <div className="slider">
                    <div className="slider-content">
                        <h2>{isSignupMode ? "이미 계정이 있으신가요?" : "계정이 없으신가요?"}</h2>
                        <button className="btn" onClick={toggleMode}>
                            {isSignupMode ? "로그인" : "회원가입"}
                        </button>
                    </div>
                </div>
            </div>
            {showModal && (
                <div className="modal" onClick={() => setShowModal(false)}>
                    <img src={previewUrl} alt="modal" />
                </div>
            )}
        </>
    );
}

export default LoginSignup;
