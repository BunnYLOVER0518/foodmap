import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function EditProfile() {
    const userId = localStorage.getItem("user_id");
    const [form, setForm] = useState({ name: '', password: '' });
    const [imageFile, setImageFile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`http://localhost:5000/user/${userId}`)
            .then(res => {
                setForm({
                    name: res.data.name,
                    password: ''
                });
            });
    }, []);

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
        data.append("name", form.name);
        data.append("password", form.password);
        data.append("id", userId);
        if (imageFile) data.append("image", imageFile);

        try {
            await axios.put(`http://localhost:5000/user/${userId}`, data);
            alert("회원정보 수정 완료!");
            navigate("/mypage");
        } catch (err) {
            alert("수정 실패");
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
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <h2>회원정보 수정</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>이름: </label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} />



                </div>
                <div>
                    <label>비밀번호: </label>
                    <input type="password" name="password" value={form.password} onChange={handleChange} />
                </div>
                <div>
                    <label>프로필 이미지 변경: </label>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                </div>
                <button type="submit" style={{ marginTop: '20px' }}>수정하기</button>
            </form>
            <br />
            <button onClick={() => navigate("/")}>메인으로 이동</button>
        </div>
    );
}

export default EditProfile;
