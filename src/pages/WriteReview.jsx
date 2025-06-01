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
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/place/${placeId}`)
      .then(res => res.json())
      .then(data => setPlaceInfo(data));
  }, [placeId]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      alert("최대 5개의 이미지만 업로드할 수 있습니다.");
      return;
    }

    const imagePreviews = files.map(file => ({ file, url: URL.createObjectURL(file) }));
    setImages(prev => [...prev, ...imagePreviews]);
  };

  const handleSubmit = () => {
    if (!rating || !description.trim()) {
      alert("평점과 리뷰 내용을 모두 입력해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("place_id", placeId);
    formData.append("user_id", userId);
    formData.append("rating", rating);
    formData.append("description", description);
    images.forEach((imgObj, idx) => {
      formData.append("images", imgObj.file);
    });

    fetch("http://localhost:5000/reviews", {
      method: "POST",
      body: formData
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

      <div style={{ marginTop: '20px' }}>
        <h4>이미지 업로드</h4>
        {images.map((img, idx) => (
          <div key={idx} style={{ marginBottom: "10px" }}>
            <img src={img.url} alt={`preview-${idx}`} style={{ maxWidth: "200px", maxHeight: "150px", display: "block", marginBottom: "5px" }} />
            <small>{img.file.name}</small>
          </div>
        ))}

        {images.length < 5 ? (
          <input type="file" accept="image/*" onChange={handleImageChange} />
        ) : (
          <p style={{ color: "red", marginTop: "10px" }}>
            더 이상 이미지를 추가할 수 없습니다.
          </p>
        )}
      </div>

      <button onClick={handleSubmit} style={{ marginTop: '20px' }}>리뷰 등록</button>
      <div style={{ marginTop: "20px" }}>
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

  );
}

export default WriteReview;
