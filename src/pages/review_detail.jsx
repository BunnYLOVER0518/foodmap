import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ReviewDetail = () => {
    const { review_id } = useParams();
    const userId = localStorage.getItem("user_id");

    const [review, setReview] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const commentsPerPage = 5;

    useEffect(() => {
        fetch(`http://localhost:5000/review/${review_id}`)
            .then(res => res.json())
            .then(data => {
                setReview(data.review);
                setComments(data.comments);
            });
    }, [review_id]);

    const submitComment = () => {
        if (!userId) return alert("로그인이 필요합니다.");
        if (!newComment.trim()) return alert("내용을 입력하세요.");

        fetch(`http://localhost:5000/review/${review_id}/comment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                description: newComment
            })
        })
            .then(res => res.json())
            .then(() => {
                setNewComment("");
                return fetch(`http://localhost:5000/review/${review_id}`);
            })
            .then(res => res.json())
            .then(data => {
                setReview(data.review);
                setComments(data.comments);
                setCurrentPage(Math.ceil((data.comments.length || 1) / commentsPerPage)); // 마지막 페이지로 이동
            });
    };

    const paginatedComments = comments.slice(
        (currentPage - 1) * commentsPerPage,
        currentPage * commentsPerPage
    );
    const totalPages = Math.ceil(comments.length / commentsPerPage);

    if (!review) return <p>로딩 중...</p>;

    return (
        <div style={{ maxWidth: "800px", margin: "50px auto", fontFamily: "Arial, sans-serif" }}>
            <h2>{review.place_name} 리뷰</h2>
            <p><strong>작성자:</strong> {review.writer_name}</p>
            <p><strong>평점:</strong> {review.rating} / 5.0</p>
            <p><strong>조회수:</strong> {review.review_count}</p>
            <p>{review.description}</p>

            <div style={{ display: "flex", overflowX: "auto", marginBottom: "20px" }}>
                {(review.images || []).map((img, i) => (
                    <img
                        key={i}
                        src={`http://localhost:5000/images/${img}`}
                        alt={`img-${i}`}
                        style={{ maxHeight: "150px", marginRight: "10px", borderRadius: "6px" }}
                    />
                ))}
            </div>

            <hr />
            <h3>💬 댓글</h3>
            {paginatedComments.length === 0 ? (
                <p>댓글이 없습니다.</p>
            ) : (
                paginatedComments.map((c, i) => (
                    <div key={i} style={{ borderTop: "1px solid #ccc", padding: "10px 0" }}>
                        <strong>{c.commenter_name}</strong> ({new Date(c.created_at).toLocaleString()})<br />
                        {c.description}
                    </div>
                ))
            )}

            {totalPages > 1 && (
                <div style={{ textAlign: "center", marginTop: "10px" }}>
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

            <h4 style={{ marginTop: "30px" }}>✏️ 댓글 작성</h4>
            <textarea
                rows="3"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
            />
            <br />
            <button
                onClick={submitComment}
                style={{
                    padding: "8px 16px",
                    backgroundColor: "#3182f6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                }}
            >
                댓글 등록
            </button>
            <div style={{ textAlign: "center", marginTop: "40px" }}>
                <a href="/" style={{ marginRight: "10px" }}>
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

                {review && (
                    <a href={`/user/${review.writer_name}`}>
                        <button style={{
                            padding: "8px 16px",
                            backgroundColor: "#888",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                        }}>
                            리뷰 목록으로
                        </button>
                    </a>
                )}
            </div>
        </div>
    );
};

export default ReviewDetail;
