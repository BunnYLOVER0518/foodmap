// src/pages/ReviewList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ReviewList() {
  const userId = localStorage.getItem("user_id");
  const [places, setPlaces] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    fetch(`http://localhost:5000/api/user/${userId}/reviewable-places`)
      .then(res => res.json())
      .then(data => setPlaces(data))
      .catch(err => console.error("리뷰 가능 장소 불러오기 실패:", err));
  }, [userId, navigate]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>📝 리뷰 작성 가능한 장소</h2>
      {places.length === 0 ? (
        <p>작성할 리뷰가 없습니다.</p>
      ) : (
        <ul>
          {places.map(place => (
            <li key={place.id} style={{ marginBottom: '10px' }}>
              <strong>{place.name}</strong><br />
              📍 {place.address}<br />
              <button onClick={() => navigate(`/write-review/${place.id}`)}>리뷰 쓰기</button>
            </li>
          ))}
        </ul>
      )}
    
      
    </div>
    
  );
}

export default ReviewList;
