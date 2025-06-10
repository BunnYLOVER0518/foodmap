import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MapContainer from '../components/MapContainer';

function Main() {
    const navigate = useNavigate();
    const userId = localStorage.getItem("user_id");
    const [userName, setUserName] = useState("");

    useEffect(() => {
        if (userId) {
            fetch(`http://localhost:5000/user/${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.name) {
                        setUserName(data.name);
                    }
                })
                .catch(err => console.error("사용자 정보 불러오기 실패:", err));
        }
    }, [userId]);

    const handleLogout = () => {
        localStorage.removeItem("user_id");
        localStorage.removeItem("name");
        navigate('/');
    };

    return (
        <>
            <style>{`
.container {
                    text-align: center;
                    margin-top: 50px;
                    font-family: Arial, sans-serif;
                }

                .form-group {
                    margin-bottom: 15px;
                }

                input[type="text"],
                input[type="password"],
                input[type="file"] {
                    padding: 8px;
                    width: 250px;
                    margin-top: 5px;
                }

                button {
                    margin-top: 10px;
                    padding: 8px 16px;
                    background-color: #357edd;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                button:hover {
                    background-color: #2a5db0;
                }

                .button-group {
                    margin-top: 20px;
                }

                img.profile {
                    width: 150px;
                    height: 150px;
                    object-fit: cover;
                    border-radius: 50%;
                    margin-top: 15px;
                }

                body {
                    margin: 0;
                    height: 100vh;
                    font-family: Arial, sans-serif;
                }

                .sidebar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 60px;
                    background: #357edd;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding-top: 20px;
                    transition: width 0.3s ease;
                    overflow: hidden;
                    z-index: 1000;
                }

                .sidebar:hover {
                    width: 200px;
                }

                .sidebar-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 20px;
                    width: 100%;
                    cursor: pointer;
                    transition: background 0.2s;
                    text-decoration: none;
                    color: white;
                }

                .sidebar-item:hover {
                    background: #2a5db0;
                }

                .sidebar-icon {
                    width: 24px;
                    height: 24px;
                    margin-right: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .sidebar-label {
                    white-space: nowrap;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .sidebar:hover .sidebar-label {
                    opacity: 1;
                }

                .container {
                    margin-left: 60px;
                    transition: margin-left 0.3s ease;
                    padding: 20px;
                }

                .sidebar:hover ~ .container {
                    margin-left: 200px;
                }
            `}</style>

            <div className="sidebar">
                {userId ? (
                    <>
                        <div className="sidebar-item" onClick={handleLogout}>
                            <div className="sidebar-icon">⏻</div>
                            <div className="sidebar-label">로그아웃</div>
                        </div>
                        <Link to="/mypage" className="sidebar-item">
                            <div className="sidebar-icon">👤</div>
                            <div className="sidebar-label">마이페이지</div>
                        </Link>
                        <Link to="/myreviews" className="sidebar-item">
                            <div className="sidebar-icon">📝</div>
                            <div className="sidebar-label">내 리뷰</div>
                        </Link>
                        <Link to="/reviewlist" className="sidebar-item">
                            <div className="sidebar-icon">✏️</div>
                            <div className="sidebar-label">리뷰 작성</div>
                        </Link>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="sidebar-item">
                            <div className="sidebar-icon">🔐</div>
                            <div className="sidebar-label">로그인</div>
                        </Link>
                        <Link to="/signup" className="sidebar-item">
                            <div className="sidebar-icon">🆕</div>
                            <div className="sidebar-label">회원가입</div>
                        </Link>
                    </>
                )}
            </div>

            <div className="container">
                <MapContainer key={userId || "guest"} />
            </div>
        </>
    );
}

export default Main;
