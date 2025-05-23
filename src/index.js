import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Signup from './pages/Signup.jsx'
import Login from './pages/Login.jsx';
import Main from './pages/Main.jsx' 
import MyPage from './pages/MyPage.jsx';
import EditProfile from './pages/EditProfile.jsx';
import UserPage from './pages/UserPage.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} /> 
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/mypage/edit" element={<EditProfile />} />
        <Route path="/user/:username" element={<UserPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
