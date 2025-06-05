import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from datetime import datetime
from pytz import timezone

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

UPLOAD_FOLDER = "C:/images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "fpelgkgo0518",
    'port': 3306,
    "database": "foodmap"
}


@app.route('/signup', methods=['POST'])
def signup():
    id = request.form['id']
    password = request.form['password']
    name = request.form['name']
    image = request.files.get('image')
    created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    image_filename = None
    if image:
        ext = os.path.splitext(image.filename)[1]
        image_filename = f"{id}_{int(datetime.now().timestamp())}{ext}"
        image.save(os.path.join(UPLOAD_FOLDER, image_filename))

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    query = "INSERT INTO Users (id, password, name, image_path, created_at) VALUES (%s, %s, %s, %s, %s)"
    cursor.execute(query, (id, password, name, image_filename, created_at))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "회원가입 완료"})


@app.route('/images/<filename>')
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user_id = data.get('id')
    password = data.get('password')

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    query = "SELECT password, name FROM Users WHERE id = %s"
    cursor.execute(query, (user_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if result and result[0] == password:
        return jsonify({"success": True, "name": result[1]})
    else:
        return jsonify({"success": False})


@app.route('/user/<user_id>', methods=['GET'])
def get_user_info(user_id):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    query = "SELECT id, name, image_path, created_at FROM Users WHERE id = %s"
    cursor.execute(query, (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return jsonify(user)


@app.route('/user/<user_id>', methods=['PUT'])
def update_user(user_id):
    name = request.form.get("name")
    password = request.form.get("password")
    image = request.files.get("image")

    image_filename = None
    if image and image.filename != '':
        ext = os.path.splitext(image.filename)[1]
        image_filename = f"{user_id}_{int(datetime.now().timestamp())}{ext}"
        image.save(os.path.join(UPLOAD_FOLDER, image_filename))

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    if password:
        if image_filename:
            query = "UPDATE Users SET name = %s, password = %s, image_path = %s WHERE id = %s"
            cursor.execute(query, (name, password, image_filename, user_id))
        else:
            query = "UPDATE Users SET name = %s, password = %s WHERE id = %s"
            cursor.execute(query, (name, password, user_id))
    else:
        if image_filename:
            query = "UPDATE Users SET name = %s, image_path = %s WHERE id = %s"
            cursor.execute(query, (name, image_filename, user_id))
        else:
            query = "UPDATE Users SET name = %s WHERE id = %s"
            cursor.execute(query, (name, user_id))

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "수정 완료"})


@app.route('/user/<user_id>/location', methods=['PUT'])
def update_user_location(user_id):
    data = request.get_json()
    lat = data.get('latitude')
    lng = data.get('longitude')

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    query = "UPDATE Users SET latitude = %s, longitude = %s WHERE id = %s"
    cursor.execute(query, (lat, lng, user_id))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "위치 저장 완료"})


@app.route('/user/<user_id>/location', methods=['GET'])
def get_user_location(user_id):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    query = "SELECT latitude, longitude FROM Users WHERE id = %s"
    cursor.execute(query, (user_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if result and result[0] and result[1]:
        return jsonify({"latitude": result[0], "longitude": result[1]})
    else:
        return jsonify({"latitude": None, "longitude": None})


@app.route('/add_place', methods=['POST'])
def add_place():
    data = request.get_json()
    name = data.get('name')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    address = data.get('address')
    category = data.get('category')
    phone = data.get('phone')
    user_id = data.get('user_id')

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    query = "INSERT INTO Places (name, latitude, longitude, address, category, phone, user_id) VALUES (%s, %s, %s, %s, %s, %s, %s)"
    cursor.execute(query, (name, latitude, longitude,
                   address, category, phone, user_id))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "장소 저장 완료"})


@app.route('/user/<user_id>/places', methods=['GET'])
def get_user_places(user_id):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    query = """
      SELECT 
    p1.id,                        
    p1.name,
    p1.latitude,
    p1.longitude,
    p1.address,
    p1.category,
    p1.phone,
    p1.user_id,
    (
        SELECT GROUP_CONCAT(u.name SEPARATOR ', ')
        FROM Places p2
        JOIN Users u ON p2.user_id = u.id
        WHERE p2.name = p1.name
          AND p2.latitude = p1.latitude
          AND p2.longitude = p1.longitude
    ) AS usernames
FROM Places p1
WHERE p1.user_id = %s
    """

    cursor.execute(query, (user_id,))
    places = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(places)


@app.route('/places', methods=['GET'])
def get_all_places():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT 
            MIN(p.id) AS id,  -- 대표 ID 하나만 뽑기
            p.name,
            p.latitude,
            p.longitude,
            p.address,
            p.category,
            p.phone,
            GROUP_CONCAT(DISTINCT u.name ORDER BY u.name SEPARATOR ', ') AS usernames
        FROM Places p
        JOIN Users u ON p.user_id = u.id
        GROUP BY p.name, p.latitude, p.longitude, p.address, p.category, p.phone
    """
    cursor.execute(query)
    places = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(places)


@app.route('/delete_place', methods=['DELETE'])
def delete_place():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "No data received"}), 400

    name = data.get('name')
    user_id = data.get('user_id')

    if not name or not user_id:
        return jsonify({"error": "Missing required fields"}), 400

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT latitude, longitude FROM Places WHERE name = %s AND user_id = %s", (name, user_id))
    coords = cursor.fetchone()

    if not coords:
        cursor.close()
        conn.close()
        return jsonify({"error": "장소 없음"}), 404

    lat, lng = coords

    cursor.execute("""
        SELECT id FROM Places
        WHERE name = %s AND ABS(latitude - %s) < 0.00001 AND ABS(longitude - %s) < 0.00001
    """, (name, lat, lng))
    place_ids = [row[0] for row in cursor.fetchall()]

    if place_ids:
        format_strings = ','.join(['%s'] * len(place_ids))
        cursor.execute(f"""
            DELETE FROM Reviews 
            WHERE user_id = %s AND place_id IN ({format_strings})
        """, (user_id, *place_ids))
        conn.commit()

    cursor.execute(
        "DELETE FROM Places WHERE name = %s AND user_id = %s", (name, user_id))
    conn.commit()

    cursor.execute("""
        SELECT id FROM Places
        WHERE name = %s AND ABS(latitude - %s) < 0.00001 AND ABS(longitude - %s) < 0.00001
    """, (name, lat, lng))
    remaining_ids = [row[0] for row in cursor.fetchall()]

    if remaining_ids:
        format_strings = ','.join(['%s'] * len(remaining_ids))
        cursor.execute(f"""
            SELECT AVG(rating) FROM Reviews WHERE place_id IN ({format_strings})
        """, tuple(remaining_ids))
        avg_rating = cursor.fetchone()[0]

        for pid in remaining_ids:
            cursor.execute(
                "UPDATE Places SET rating = %s WHERE id = %s", (avg_rating, pid))
        conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "사용자 장소 및 리뷰 삭제 완료, 평점 갱신"})


@app.route("/user_info/<username>")
def get_user_info_by_name(username):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    query = "SELECT id, name, image_path, created_at FROM Users WHERE name = %s"
    cursor.execute(query, (username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return jsonify(user) if user else {}


@app.route("/reviews/user/<user_id>")
def get_user_reviews(user_id):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT 
            r.*, 
            p.name AS place_name,
            i.image_path
        FROM Reviews r
        JOIN Places p ON r.place_id = p.id
        LEFT JOIN Images i ON i.review_id = r.id
        WHERE r.user_id = %s
        ORDER BY r.created_at DESC, i.sort_order ASC
    """
    cursor.execute(query, (user_id,))
    reviews = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(reviews)


@app.route('/api/user/<user_id>/reviewable-places')
def get_reviewable_places(user_id):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT p.id, p.name, p.latitude, p.longitude, p.address
        FROM Places p
        WHERE p.user_id = %s
        AND NOT EXISTS (
            SELECT 1 FROM Reviews r
            WHERE r.place_id = p.id AND r.user_id = %s
        )
    """
    cursor.execute(query, (user_id, user_id))
    places = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify(places)


@app.route('/place/<int:place_id>')
def get_place_info(place_id):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    query = "SELECT id, name, address, latitude, longitude FROM Places WHERE id = %s"
    cursor.execute(query, (place_id,))
    place = cursor.fetchone()

    cursor.close()
    conn.close()

    if place:
        return jsonify(place)
    else:
        return jsonify({"error": "장소를 찾을 수 없습니다."}), 404


@app.route('/reviews', methods=['POST'])
def create_review():
    place_id = request.form.get("place_id")
    user_id = request.form.get("user_id")
    rating = request.form.get("rating")
    description = request.form.get("description")
    images = request.files.getlist("images")

    if not all([place_id, user_id, rating]):
        return jsonify({"error": "필수 항목 누락"}), 400

    try:
        rating_float = float(rating)
        if rating_float < 0 or rating_float > 5:
            return jsonify({"error": "평점은 0 이상 5 이하로 입력해야 합니다."}), 400
    except ValueError:
        return jsonify({"error": "평점은 숫자여야 합니다."}), 400

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO Reviews (place_id, user_id, rating, description, created_at)
        VALUES (%s, %s, %s, %s, NOW())
    """, (place_id, user_id, rating, description))
    review_id = cursor.lastrowid
    conn.commit()

    for idx, image in enumerate(images):
        if image:
            ext = os.path.splitext(image.filename)[1]
            filename = f"review_{review_id}_{idx}_{int(datetime.now().timestamp())}{ext}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            image.save(filepath)

            cursor.execute("""
                INSERT INTO Images (review_id, image_path, sort_order)
                VALUES (%s, %s, %s)
            """, (review_id, filename, idx))
    conn.commit()

    cursor.execute(
        "SELECT name, latitude, longitude FROM Places WHERE id = %s", (place_id,))
    place_info = cursor.fetchone()
    if not place_info:
        return jsonify({"error": "해당 장소 없음"}), 404
    name, lat, lng = place_info

    cursor.execute("""
        SELECT id FROM Places
        WHERE name = %s AND ABS(latitude - %s) < 0.00001 AND ABS(longitude - %s) < 0.00001
    """, (name, lat, lng))
    place_ids = [row[0] for row in cursor.fetchall()]

    if place_ids:
        format_strings = ','.join(['%s'] * len(place_ids))
        cursor.execute(f"""
            SELECT AVG(rating) FROM Reviews WHERE place_id IN ({format_strings})
        """, tuple(place_ids))
        avg_rating = cursor.fetchone()[0]
    else:
        avg_rating = 0.0

    for pid in place_ids:
        cursor.execute(
            "UPDATE Places SET rating = %s WHERE id = %s", (avg_rating, pid))
    conn.commit()

    cursor.close()
    conn.close()
    return jsonify({"message": "리뷰 및 이미지 저장 완료, 평점 반영 완료"})


@app.route('/place/rating')
def get_place_rating():
    place_id = request.args.get("place_id")

    if not place_id:
        print("❌ place_id 없음")
        return jsonify({"rating": None, "count": 0})

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT name, latitude, longitude FROM Places WHERE id = %s", (place_id,))
    place_info = cursor.fetchone()
    print(f"📍 기준 장소 정보 (place_id={place_id}):", place_info)

    if not place_info:
        print("❌ 해당 place_id에 대한 장소 없음")
        return jsonify({"rating": None, "count": 0})

    name, lat, lng = place_info

    cursor.execute("""
        SELECT id FROM Places
        WHERE name = %s AND ABS(latitude - %s) < 0.00001 AND ABS(longitude - %s) < 0.00001
    """, (name, lat, lng))
    place_ids = [row[0] for row in cursor.fetchall()]
    print("🎯 동일 장소 place_ids:", place_ids)

    if place_ids:
        format_strings = ','.join(['%s'] * len(place_ids))
        cursor.execute(f"""
            SELECT AVG(rating), COUNT(*) FROM Reviews
            WHERE place_id IN ({format_strings})
        """, tuple(place_ids))
        avg, count = cursor.fetchone()
        print(f"⭐ 평점 계산 결과 → avg: {avg}, count: {count}")
    else:
        avg, count = None, 0
        print("❌ 동일 장소 place_id가 없음")

    cursor.close()
    conn.close()

    return jsonify({
        "rating": round(avg, 1) if avg is not None else None,
        "count": count
    })


@app.route("/reviews/by_place/<int:place_id>")
def get_reviews_by_place(place_id):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    # 1. 기준 장소 정보 가져오기
    cursor.execute(
        "SELECT name, latitude, longitude FROM Places WHERE id = %s", (place_id,))
    place = cursor.fetchone()

    if not place:
        return jsonify([])

    name, lat, lng = place["name"], place["latitude"], place["longitude"]

    # 2. 동일 장소인 place_id 모두 조회
    cursor.execute("""
        SELECT id FROM Places
        WHERE name = %s AND ABS(latitude - %s) < 0.00001 AND ABS(longitude - %s) < 0.00001
    """, (name, lat, lng))
    place_ids = [row["id"] for row in cursor.fetchall()]

    if not place_ids:
        return jsonify([])

    format_strings = ','.join(['%s'] * len(place_ids))
    cursor.execute(f"""
        SELECT 
            r.id AS review_id,
            r.user_id,
            u.name AS writer_name,
            r.place_id,
            p.name AS place_name,
            r.rating,
            r.created_at,
            r.review_count AS view_count,
            r.description,
            i.image_path
        FROM Reviews r
        JOIN Users u ON r.user_id = u.id
        JOIN Places p ON r.place_id = p.id
        LEFT JOIN Images i ON i.review_id = r.id
        WHERE r.place_id IN ({format_strings})
        ORDER BY r.created_at DESC, i.sort_order ASC
    """, tuple(place_ids))

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    # 병합 처리
    from collections import defaultdict
    from pytz import timezone

    kst = timezone("Asia/Seoul")
    grouped = {}
    for row in rows:
        rid = row["review_id"]
        if rid not in grouped:
            grouped[rid] = {
                "id": rid,
                "user_id": row["user_id"],
                "writer_name": row["writer_name"],
                "place_id": row["place_id"],
                "place_name": row["place_name"],
                "rating": row["rating"],
                "created_at": row["created_at"].astimezone(kst).strftime('%Y-%m-%d %H:%M:%S') if row["created_at"] else None,
                "view_count": row["view_count"],
                "description": row["description"],
                "images": []
            }
        if row["image_path"]:
            grouped[rid]["images"].append(row["image_path"])

    return jsonify(list(grouped.values()))

@app.route('/review/<int:review_id>', methods=['GET'])
def get_review_detail(review_id):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    # 조회수 증가
    cursor.execute("UPDATE Reviews SET review_count = review_count + 1 WHERE id = %s", (review_id,))
    conn.commit()

    # 리뷰 정보
    cursor.execute("""
        SELECT r.*, u.name AS writer_name, p.name AS place_name
        FROM Reviews r
        JOIN Users u ON r.user_id = u.id
        JOIN Places p ON r.place_id = p.id
        WHERE r.id = %s
    """, (review_id,))
    review = cursor.fetchone()

    # 댓글 정보
    cursor.execute("""
        SELECT c.*, u.name AS commenter_name
        FROM Comments c
        JOIN Users u ON c.user_id = u.id
        WHERE c.review_id = %s
        ORDER BY c.created_at ASC
    """, (review_id,))
    comments = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({"review": review, "comments": comments})

@app.route('/review/<int:review_id>/comment', methods=['POST'])
def post_comment(review_id):
    data = request.get_json()
    user_id = data.get('user_id')
    description = data.get('description')  # ✅ 프론트와 동일하게 변경

    if not user_id or not description:
        return jsonify({"error": "댓글 내용이 비어 있습니다."}), 400

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO Comments (review_id, user_id, description, created_at)
        VALUES (%s, %s, %s, NOW())
    """, (review_id, user_id, description))  # ✅ 변경된 변수 사용
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "댓글이 등록되었습니다."})

if __name__ == '__main__':
    app.run(debug=True)
