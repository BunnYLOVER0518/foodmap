import React, { useEffect, useState } from 'react';

function MyReviews() {
  const userId = localStorage.getItem("user_id");
  const [groupedReviews, setGroupedReviews] = useState([]);

  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:5000/reviews/user/${userId}`)
      .then(res => res.json())
      .then(data => {
        const grouped = {};
        data.forEach(item => {
          const reviewId = item.id;
          if (!grouped[reviewId]) {
            grouped[reviewId] = {
              id: reviewId,
              place_name: item.place_name,
              rating: item.rating,
              description: item.description,
              created_at: item.created_at,
              images: []
            };
          }
          if (item.image_path) {
            grouped[reviewId].images.push(item.image_path);
          }
        });
        setGroupedReviews(Object.values(grouped));
      })
      .catch(err => console.error("작성한 리뷰 불러오기 실패:", err));
  }, [userId]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>📝 내가 작성한 리뷰</h2>
      {groupedReviews.length === 0 ? (
        <p>작성한 리뷰가 없습니다.</p>
      ) : (
        <ul>
          {groupedReviews.map((r) => (
            <li key={r.id} style={{ marginBottom: '25px' }}>
              <strong>{r.place_name}</strong> - ⭐ {r.rating}<br />
              {r.description}<br />
              <small>{new Date(r.created_at).toLocaleString()}</small>

              {r.images.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  {r.images.map((img, i) => (
                    <img
                      key={i}
                      src={`http://localhost:5000/images/${img}`}
                      alt={`review-${r.id}-${i}`}
                      style={{ maxWidth: "200px", maxHeight: "150px", marginRight: "10px", marginTop: "5px" }}
                    />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

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

export default MyReviews;
