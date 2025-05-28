// src/pages/WriteReview.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function WriteReview() {
  const { placeId } = useParams();
  const userId = localStorage.getItem("user_id");
  const navigate = useNavigate();

  const [placeInfo, setPlaceInfo] = useState(null);
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/place/${placeId}`)
      .then(res => res.json())
      .then(data => setPlaceInfo(data));
  }, [placeId]);

  const handleSubmit = () => {
    if (!rating || !description.trim()) {
      alert("평점과 리뷰 내용을 모두 입력해주세요.");
      return;
    }

    fetch("http://localhost:5000/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place_id: placeId,
        user_id: userId,
        rating,
        description
      })
    })
      .then(res => res.json())
      .then(data => {
        alert("리뷰가 작성되었습니다.");
        navigate("/reviewlist");
      });
  };

  if (!placeInfo) return <p>장소 정보를 불러오는 중...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>✏️ 리뷰 작성: {placeInfo.name}</h2>
      <p>📍 {placeInfo.address}</p>

      <div>
        <label>⭐ 평점:
          <input
            type="number"
            min="1"
            max="5"
            value={rating}
            onChange={(e) => setRating(parseFloat(e.target.value))}
            style={{ marginLeft: '10px', width: '50px' }}
          />
        </label>
      </div>

      <div style={{ marginTop: '10px' }}>
        <textarea
          rows="5"
          cols="50"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="리뷰 내용을 입력하세요"
        />
      </div>

      <button onClick={handleSubmit} style={{ marginTop: '10px' }}>리뷰 등록</button>
    </div>
  );
}

export default WriteReview;
