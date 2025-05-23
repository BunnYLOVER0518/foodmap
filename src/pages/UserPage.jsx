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
                console.log("✅ 사용자 정보 응답:", data); // 콘솔 출력
                setUserInfo(data);
            });

        // 리뷰 목록 조회
        fetch(`http://localhost:5000/reviews/user/${username}`)
            .then(res => res.json())
            .then(data => {
                console.log("📝 리뷰 목록 응답:", data); // 콘솔 출력
                setReviews(data);
            });
    }, [username]);


    return (
        <>
            {userInfo && (
                <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
                    <div style={{ display: "inline-block", textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                            {userInfo.image_path && (
                                <img
                                    src={`http://localhost:5000/images/${userInfo.image_path}`}
                                    alt="profile"
                                    style={{
                                        width: "150px",
                                        objectFit: "cover",
                                        marginRight: "20px",
                                    }}
                                />
                            )}
                            <div>
                                <h2 style={{ marginTop: "5px" }}>👤 {userInfo.name}님의 마이페이지</h2>
                            </div>
                        </div>

                        <p style={{ margin: 0 }}>🆔 ID: {userInfo.id}</p>
                        <p>📅 가입일: {userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString() : "정보 없음"}</p>

                        <h3>📝 작성한 리뷰</h3>
                        <ul>
                            {reviews.map((review, idx) => (
                                <li key={idx} style={{ marginBottom: "10px" }}>
                                    <strong>{review.place_name}</strong> - ⭐ {review.rating}
                                    <p>{review.description}</p>
                                    <small>{new Date(review.created_at).toLocaleString()}</small>
                                </li>
                            ))}
                        </ul>

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
