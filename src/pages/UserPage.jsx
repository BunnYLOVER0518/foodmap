import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const UserPage = () => {
    const { username } = useParams();
    const [userInfo, setUserInfo] = useState(null);
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        // 사용자 정보 조회
        fetch(`http://localhost:5000/user_info/${username}`)
            .then(res => res.json())
            .then(data => {
                setUserInfo(data);

                // 사용자 ID 기반 리뷰 조회
                if (data?.id) {
                    fetch(`http://localhost:5000/reviews/by_user/${data.id}`)
                        .then(res => res.json())
                        .then(reviewData => setReviews(reviewData))
                        .catch(err => console.error("리뷰 불러오기 실패:", err));
                }
            });
    }, [username]);

    // 리뷰 데이터 병합: review_id 기준으로 이미지 묶기
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

    return (
        <>
            {userInfo && (
                <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
                    <div style={{ display: "inline-block", textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                            <img
                                src={`http://localhost:5000/images/${userInfo.image_path || 'default.jpg'}`}
                                alt="profile"
                                style={{
                                    width: "150px",
                                    objectFit: "cover",
                                    marginRight: "20px"
                                }}
                            />
                            <div>
                                <h2 style={{ marginTop: "5px" }}>👤 {userInfo.name}님의 마이페이지</h2>
                            </div>
                        </div>


                        <p style={{ margin: 0 }}>🆔 ID: {userInfo.id}</p>
                        <p>📅 가입일: {userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString() : "정보 없음"}</p>

                        <hr style={{ margin: "40px 0" }} />

                        <h3>📝 작성한 리뷰</h3>
                        {Object.keys(groupedReviews).length === 0 ? (
                            <p>작성한 리뷰가 없습니다.</p>
                        ) : (
                            <ul>
                                {Object.values(groupedReviews).map((review, idx) => (
                                    <li key={idx} style={{ marginBottom: "30px" }}>
                                        <strong>{review.place_name}</strong> - ⭐ {review.rating}<br />
                                        🖋 작성자: {review.writer_name} <br />
                                        🕒 작성일: {new Date(review.created_at).toLocaleString()}<br />
                                        👁 조회수: {review.view_count}<br />
                                        <p>{review.description}</p>

                                        {review.images.length > 0 && (
                                            <div style={{ marginTop: '10px' }}>
                                                {review.images.map((img, i) => (
                                                    <img
                                                        key={i}
                                                        src={`http://localhost:5000/images/${img}`}
                                                        alt={`review-${review.id}-${i}`}
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
                            <a href="/"><button style={{ padding: "8px 16px", backgroundColor: "#357edd", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>메인으로 이동</button></a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserPage;
