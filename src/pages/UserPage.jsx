import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const UserPage = () => {
    const { username } = useParams();
    const [userInfo, setUserInfo] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const reviewsPerPage = 4;

    useEffect(() => {
        fetch(`http://localhost:5000/user_info/${username}`)
            .then(res => res.json())
            .then(data => {
                setUserInfo(data);
                if (data?.id) {
                    fetch(`http://localhost:5000/reviews/user/${data.id}`)
                        .then(res => res.json())
                        .then(setReviews)
                        .catch(err => console.error("리뷰 불러오기 실패:", err));
                }
            });
    }, [username]);

    const groupedReviews = {};
    reviews.forEach((r) => {
        if (!groupedReviews[r.id]) {
            groupedReviews[r.id] = {
                ...r,
                images: []
            };
        }
        if (r.image_path) {
            groupedReviews[r.id].images.push(r.image_path);
        }
    });

    const reviewList = Object.values(groupedReviews);
    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentReviews = reviewList.slice(indexOfFirstReview, indexOfLastReview);
    const totalPages = Math.ceil(reviewList.length / reviewsPerPage);

    return (
        <>
            {userInfo && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        paddingTop: "50px",
                        fontFamily: "Arial, sans-serif"
                    }}
                >
                    <div style={{ width: "800px" }}>
                        {/* 유저 정보 */}
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                            <img
                                src={`http://localhost:5000/images/${userInfo.image_path || 'default.jpg'}`}
                                alt="profile"
                                style={{
                                    width: "150px",
                                    height: "150px",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    marginRight: "20px"
                                }}
                            />
                            <div>
                                <h2 style={{ marginTop: "5px" }}>👤 {userInfo.name}님의 마이페이지</h2>
                                <p>🆔 ID: {userInfo.id}</p>
                                <p>📅 가입일: {userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString() : "정보 없음"}</p>
                            </div>
                        </div>

                        <hr style={{ margin: "40px 0" }} />

                        {/* 리뷰 */}
                        <h3>📝 작성한 리뷰</h3>
                        {reviewList.length === 0 ? (
                            <p>작성한 리뷰가 없습니다.</p>
                        ) : (
                            <>
                                <ul style={{ paddingLeft: "0" }}>
                                    {currentReviews.map((review, idx) => (
                                        <li key={idx} style={{ marginBottom: "30px", listStyle: "none" }}>
                                            <a
                                                href={`/review/${review.id}`}
                                                style={{ textDecoration: "none", color: "black" }}
                                            >
                                                {review.place_name}
                                            </a> - ⭐ {review.rating}<br />
                                            🕒 작성일: {new Date(review.created_at).toLocaleString()}<br />
                                            <p>{review.description}</p>

                                            {review.images.length > 0 && (
                                                <div style={{ marginTop: '10px', display: "flex", gap: "10px", overflowX: "auto" }}>
                                                    {review.images.map((img, i) => (
                                                        <img
                                                            key={i}
                                                            src={`http://localhost:5000/images/${img}`}
                                                            alt={`review-${review.id}-${i}`}
                                                            style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "4px" }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>

                                {/* 페이지네이션 */}
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
                            </>
                        )}

                        <div style={{ textAlign: "center", marginTop: "40px" }}>
                            <a href="/">
                                <button style={{ padding: "8px 16px", backgroundColor: "#357edd", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                                    메인으로 이동
                                </button>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserPage;
