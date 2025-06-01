CREATE DATABASE foodmap1 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
use foodmap;

-- 사용자 테이블
CREATE TABLE Users (
    id VARCHAR(100) PRIMARY KEY,                  -- 사용자 아이디
    password VARCHAR(200) NOT NULL,               -- 비밀번호
    name VARCHAR(100) NOT NULL,                   -- 이름
    image_path VARCHAR(300),                      -- 프로필 이미지 경로
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,-- 가입 일자
    latitude DOUBLE,                              -- 위도
    longitude DOUBLE                              -- 경도
);

-- 장소 테이블
CREATE TABLE Places (
    id INT AUTO_INCREMENT PRIMARY KEY,           -- 장소 ID
    name VARCHAR(200) NOT NULL,                  -- 장소 이름
    latitude DOUBLE NOT NULL,                    -- 위도
    longitude DOUBLE NOT NULL,                   -- 경도
    address VARCHAR(300),                        -- 주소
    category VARCHAR(100),                       -- 카테고리
    rating FLOAT DEFAULT 0,                       -- 평균 별점
    user_id VARCHAR(100),
    phone VARCHAR(100)
);

-- 리뷰 테이블
CREATE TABLE Reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,           -- 리뷰 ID
    place_id INT,                                -- 장소 ID (FK)
    user_id VARCHAR(100),                        -- 사용자 ID (FK)
    rating FLOAT NOT NULL,                       -- 평점
    description TEXT,                            -- 리뷰 내용
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 작성일
    review_count INT DEFAULT 0,                  -- 조회수
    FOREIGN KEY (place_id) REFERENCES Places(id),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- 댓글 테이블
CREATE TABLE Comments (
    id INT AUTO_INCREMENT PRIMARY KEY,           -- 댓글 ID
    review_id INT,                               -- 리뷰 ID (FK)
    user_id VARCHAR(100),                        -- 사용자 ID (FK)
    description TEXT,                            -- 댓글 내용
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES Reviews(id),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- 이미지 테이블
CREATE TABLE Images (
    id INT AUTO_INCREMENT PRIMARY KEY,           -- 이미지 ID
    review_id INT,                               -- 리뷰 ID (FK)
    image_path VARCHAR(300) NOT NULL,            -- 이미지 경로
    sort_order INT DEFAULT 0,                    -- 리뷰 내 순서
    FOREIGN KEY (review_id) REFERENCES Reviews(id)
);

-- 리뷰 좋아요 테이블
CREATE TABLE Review_likes (
    user_id VARCHAR(100),                        -- 사용자 ID (PK)
    review_id INT,                               -- 리뷰 ID (PK)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, review_id),
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (review_id) REFERENCES Reviews(id)
);


SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE places;
SET FOREIGN_KEY_CHECKS = 1;

select * from users;
select * from places;
select * from reviews;

desc reviews;


