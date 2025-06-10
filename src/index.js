import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginSignup from './pages/LoginSignup.jsx';
import Main from './pages/Main.jsx'
import MyPage from './pages/MyPage.jsx';
import EditProfile from './pages/EditProfile.jsx';
import UserPage from './pages/UserPage.jsx';
import ReviewList from './pages/ReviewList';
import WriteReview from './pages/WriteReview';
import MyReviews from './pages/MyReviews.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<LoginSignup />} />
        <Route path="/signup" element={<LoginSignup />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/mypage/edit" element={<EditProfile />} />
        <Route path="/user/:username" element={<UserPage />} />
        <Route path="/reviewlist" element={<ReviewList />} />
        <Route path="/write-review/:placeId" element={<WriteReview />} />
        <Route path="/myreviews" element={<MyReviews />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
