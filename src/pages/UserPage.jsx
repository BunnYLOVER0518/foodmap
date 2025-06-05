import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const UserPage = () => {
    const { username } = useParams();
    const [userInfo, setUserInfo] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [openCommentMap, setOpenCommentMap] = useState({});
    const [commentMap, setCommentMap] = useState({});
    const [loadingCommentId, setLoadingCommentId] = useState(null);
    const [newCommentMap, setNewCommentMap] = useState({});
    const [commentPageMap, setCommentPageMap] = useState({});
    const commentsPerPage = 5;
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

    const toggleCommentSection = (reviewId) => {
        setOpenCommentMap(prev => ({
            ...prev,
            [reviewId]: !prev[reviewId]
        }));
    };

    const fetchCommentsForReview = (reviewId) => {
        if (commentMap[reviewId]) {
            toggleCommentSection(reviewId); // 이미 로딩된 경우에는 열고 닫기만
            return;
        }

        setLoadingCommentId(reviewId);
        fetch(`http://localhost:5000/review/${reviewId}`)
            .then(res => res.json())
            .then(data => {
                setCommentMap(prev => ({
                    ...prev,
                    [reviewId]: data.comments
                }));
                setLoadingCommentId(null);
                toggleCommentSection(reviewId);
            })
            .catch(err => {
                console.error("댓글 로딩 실패:", err);
                setLoadingCommentId(null);
            });
    };

    const submitComment = (reviewId) => {
        const userId = localStorage.getItem("user_id");
        const content = newCommentMap[reviewId]?.trim();

        if (!userId) return alert("로그인이 필요합니다.");
        if (!content) return alert("댓글 내용을 입력하세요.");

        fetch(`http://localhost:5000/review/${reviewId}/comment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, description: content })
        })
            .then(res => res.json())
            .then(() => {
                setNewCommentMap(prev => ({ ...prev, [reviewId]: "" }));
                return fetch(`http://localhost:5000/review/${reviewId}`);
            })
            .then(res => res.json())
            .then(data => {
                setCommentMap(prev => ({
                    ...prev,
                    [reviewId]: data.comments
                }));
            });
    };

    const changeCommentPage = (reviewId, newPage) => {
        setCommentPageMap(prev => ({
            ...prev,
            [reviewId]: newPage
        }));
    };

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

                                            {/* 💬 댓글 보기 버튼 */}
                                            <button
                                                onClick={() => fetchCommentsForReview(review.id)}
                                                style={{
                                                    marginTop: "10px",
                                                    padding: "6px 12px",
                                                    backgroundColor: "#3182f6",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                {openCommentMap[review.id] ? "댓글 숨기기 ▲" : "💬 댓글 보기 ▼"}
                                            </button>

                                            {/* 💬 댓글 영역 */}
                                            {openCommentMap[review.id] && (
                                                <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "6px" }}>
                                                    {loadingCommentId === review.id ? (
                                                        <p>댓글 불러오는 중...</p>
                                                    ) : (
                                                        <>
                                                            {commentMap[review.id]?.length === 0 ? (
                                                                <p>아직 댓글이 없습니다.</p>
                                                            ) : (
                                                                <>
                                                                    {(() => {
                                                                        const page = commentPageMap[review.id] || 1;
                                                                        const startIdx = (page - 1) * commentsPerPage;
                                                                        const currentComments = commentMap[review.id].slice(startIdx, startIdx + commentsPerPage);
                                                                        return currentComments.map((c, i) => (
                                                                            <div key={i} style={{ marginBottom: "10px", borderBottom: "1px solid #ddd", paddingBottom: "8px" }}>
                                                                                <strong>{c.commenter_name}</strong> ({new Date(c.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })})<br />
                                                                                {c.description}
                                                                            </div>
                                                                        ));
                                                                    })()}

                                                                    <div style={{ textAlign: "center", marginTop: "10px" }}>
                                                                        {Array.from({ length: Math.ceil(commentMap[review.id].length / commentsPerPage) }, (_, i) => (
                                                                            <button
                                                                                key={i}
                                                                                onClick={() => changeCommentPage(review.id, i + 1)}
                                                                                style={{
                                                                                    margin: "0 5px",
                                                                                    padding: "5px 10px",
                                                                                    backgroundColor: (commentPageMap[review.id] || 1) === i + 1 ? "#3182f6" : "#eee",
                                                                                    color: (commentPageMap[review.id] || 1) === i + 1 ? "white" : "black",
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

                                                            {/* 댓글 작성 */}
                                                            <div style={{ marginTop: "10px" }}>
                                                                <textarea
                                                                    rows="3"
                                                                    placeholder="댓글을 입력하세요..."
                                                                    value={newCommentMap[review.id] || ""}
                                                                    onChange={(e) =>
                                                                        setNewCommentMap(prev => ({
                                                                            ...prev,
                                                                            [review.id]: e.target.value
                                                                        }))
                                                                    }
                                                                    style={{ width: "100%", padding: "8px", borderRadius: "4px", resize: "none" }}
                                                                />
                                                                <button
                                                                    onClick={() => submitComment(review.id)}
                                                                    style={{
                                                                        marginTop: "6px",
                                                                        padding: "6px 12px",
                                                                        backgroundColor: "#3182f6",
                                                                        color: "white",
                                                                        border: "none",
                                                                        borderRadius: "4px",
                                                                        cursor: "pointer"
                                                                    }}
                                                                >
                                                                    댓글 등록
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
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
