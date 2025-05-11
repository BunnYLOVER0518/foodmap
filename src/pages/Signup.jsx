import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function Signup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        id: '',
        password: '',
        name: '',
    });
    const [imageFile, setImageFile] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('id', form.id);
        data.append('password', form.password);
        data.append('name', form.name);
        if (imageFile) data.append('image', imageFile);

        try {
            await axios.post('http://localhost:5000/signup', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert('회원가입 성공!');
            navigate('/login');
        } catch (err) {
            alert('회원가입 실패');
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
            <h2>회원가입</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="id" placeholder="아이디" onChange={handleChange} /><br />
                <input type="password" name="password" placeholder="비밀번호" onChange={handleChange} /><br />
                <input type="text" name="name" placeholder="이름" onChange={handleChange} /><br />
                <input type="file" accept="image/*" onChange={handleFileChange} /><br />
                <button type="submit">회원가입</button>
            </form>

            <div style={{ marginTop: '20px' }}>
                <Link to="/">
                    <button>메인으로 이동</button>
                </Link>
            </div>
        </div>
    );
}

export default Signup;
