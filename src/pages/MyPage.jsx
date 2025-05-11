import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function MyPage() {
    const [user, setUser] = useState(null);
    const userId = localStorage.getItem("user_id");
    const navigate = useNavigate();

    useEffect(() => {
        if (!userId) {
            alert("로그인이 필요합니다.");
            navigate('/login');
        } else {
            axios.get(`http://localhost:5000/user/${userId}`)
                .then(res => setUser(res.data))
                .catch(err => console.error(err));
        }
    }, []);

    if (!user) return <div>불러오는 중...</div>;

    const formattedDate = new Date(user.created_at).toLocaleString('ko-KR', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
    });

    <style>
        {`
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
`}
    </style>

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>마이페이지</h2>
            <p><strong>아이디:</strong> {user.id}</p>
            <p><strong>이름:</strong> {user.name}</p>
            <p><strong>가입일:</strong> {formattedDate}</p>
            <img
                src={`http://localhost:5000/images/${user.image_path ? user.image_path : 'default.jpg'}`}
                alt="profile"
                style={{ width: '150px', objectFit: 'cover' }}
            />

            <div style={{ marginTop: '20px' }}>
                <Link to="/"><button style={{ marginRight: '10px' }}>메인으로 이동</button></Link>
                <Link to="/mypage/edit"><button>회원정보 수정</button></Link>
            </div>
        </div>
    );
}

export default MyPage;
