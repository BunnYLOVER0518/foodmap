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
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '50px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '800px' }}>
        <h2 style={{ textAlign: 'center' }}>📝 리뷰 작성 가능한 장소</h2>
        {places.length === 0 ? (
          <p style={{ textAlign: "center" }}>작성할 리뷰가 없습니다.</p>
        ) : (
          <ul style={{ paddingLeft: 0 }}>
            {places.map(place => (
              <li key={place.id} style={{ marginBottom: '20px', listStyle: 'none' }}>
                <strong>{place.name}</strong><br />
                📍 {place.address}<br />
                <button
                  onClick={() => navigate(`/write-review/${place.id}`)}
                  style={{
                    marginTop: "8px",
                    padding: "6px 12px",
                    backgroundColor: "#3182f6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  리뷰 쓰기
                </button>
              </li>
            ))}
          </ul>
        )}

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <a href="/">
            <button style={{
              padding: "8px 16px",
              backgroundColor: "#357edd",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
              메인으로 이동
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default ReviewList;
