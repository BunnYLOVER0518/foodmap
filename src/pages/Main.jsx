import React from 'react';
import './Main.css';
import { Link, useNavigate } from 'react-router-dom';
import MapContainer from '../components/MapContainer';

function Main() {
    const navigate = useNavigate();
    const userId = localStorage.getItem("user_id");
    const name = localStorage.getItem("name");

    const handleLogout = () => {
        localStorage.removeItem("user_id");
        localStorage.removeItem("name");
        navigate('/');
    };

    return (
        <div className="container">
            <h1>메인 페이지입니다</h1>

            {userId ? (
                <>
                    <p><strong>{name}</strong>님 환영합니다!</p>
                    <button onClick={handleLogout} style={{ marginRight: '10px' }}>로그아웃</button>
                    <Link to="/mypage"><button>마이페이지</button></Link>
                </>
            ) : (
                <>
                    <Link to="/login"><button style={{ marginRight: '10px' }}>로그인</button></Link>
                    <Link to="/signup"><button>회원가입</button></Link>
                </>
            )}
        <MapContainer key={localStorage.getItem("user_id") || "guest"} />
        </div>
        
    );
}

export default Main;
