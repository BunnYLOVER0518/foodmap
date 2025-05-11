import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
    const [form, setForm] = useState({ id: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/login', form);
            if (res.data.success) {
                localStorage.setItem("user_id", form.id);
                localStorage.setItem("name", res.data.name);
                navigate('/');
            }
            else {
                alert("로그인 실패");
                setForm({ id: '', password: '' }); // 실패 시 입력 초기화
            }
        } catch (err) {
            alert("로그인 실패");
            setForm({ id: '', password: '' }); // 예외 발생 시에도 초기화
            console.error(err);
        }
    };

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
            <h2>로그인</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    name="id"
                    placeholder="아이디"
                    value={form.id}
                    onChange={handleChange}
                /><br />
                <input
                    type="password"
                    name="password"
                    placeholder="비밀번호"
                    value={form.password}
                    onChange={handleChange}
                /><br />
                <button type="submit">로그인</button>
            </form>

            <div style={{ marginTop: '20px' }}>
                <Link to="/"><button>메인으로 이동</button></Link>
            </div>
        </div>
    );
}

export default Login;
