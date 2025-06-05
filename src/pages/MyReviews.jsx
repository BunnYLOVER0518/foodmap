import React, { useEffect, useState } from 'react';

function MyReviews() {
  const userId = localStorage.getItem("user_id");
  const [groupedReviews, setGroupedReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 4;

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

  const indexOfLast = currentPage * reviewsPerPage;
  const indexOfFirst = indexOfLast - reviewsPerPage;
  const currentReviews = groupedReviews.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(groupedReviews.length / reviewsPerPage);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '50px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '800px' }}>
        <h2 style={{ textAlign: "center" }}>📝 내가 작성한 리뷰</h2>
        {groupedReviews.length === 0 ? (
          <p style={{ textAlign: "center" }}>작성한 리뷰가 없습니다.</p>
        ) : (
          <>
            <ul style={{ paddingLeft: 0 }}>
              {currentReviews.map((r) => (
                <li key={r.id} style={{ marginBottom: '30px', listStyle: 'none' }}>
                  <strong>{r.place_name}</strong> - ⭐ {r.rating}<br />
                  <p>{r.description}</p>
                  <small>🕒 작성일: {new Date(r.created_at).toLocaleString()}</small>

                  {r.images.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', overflowX: 'auto' }}>
                      {r.images.map((img, i) => (
                        <img
                          key={i}
                          src={`http://localhost:5000/images/${img}`}
                          alt={`review-${r.id}-${i}`}
                          style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "4px" }}
                        />
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* 페이징 */}
            {totalPages > 1 && (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{
                      margin: "0 5px",
                      padding: "5px 10px",
                      backgroundColor: currentPage === i + 1 ? "#357edd" : "#eee",
                      color: currentPage === i + 1 ? "white" : "black",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
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

export default MyReviews;
