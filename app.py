import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = "C:/images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "fpelgkgo0518",
    "database": "foodmap1"
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
    phone = data.get('phone')  # ✅ 추가
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
            p.name,
            p.latitude,
            p.longitude,
            p.address,
            p.category,
            p.phone,
            GROUP_CONCAT(u.name SEPARATOR ', ') AS usernames
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
    data = request.get_json()
    name = data.get('name')
    user_id = data.get('user_id')

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    query = "DELETE FROM Places WHERE name = %s AND user_id = %s"
    cursor.execute(query, (name, user_id))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "장소 삭제 완료"})


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


@app.route("/reviews/user/<username>")
def get_user_reviews(username):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT r.*, p.name AS place_name 
        FROM Reviews r
        JOIN Places p ON r.place_id = p.id
        WHERE r.user_id = %s
        ORDER BY r.created_at DESC
    """
    cursor.execute(query, (username,))
    reviews = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(reviews)

@app.route('/place/rating', methods=['GET'])
def get_place_rating():
    name = request.args.get("name")
    lat = request.args.get("latitude")
    lng = request.args.get("longitude")

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # 장소 ID를 찾는다
    query = """
        SELECT id FROM Places
        WHERE name = %s AND ABS(latitude - %s) < 0.00001 AND ABS(longitude - %s) < 0.00001
        LIMIT 1
    """
    cursor.execute(query, (name, lat, lng))
    result = cursor.fetchone()

    if not result:
        cursor.close()
        conn.close()
        return jsonify({"rating": None, "count": 0})

    place_id = result[0]

    # 해당 장소에 대한 평균 평점과 리뷰 수 조회
    query = "SELECT AVG(rating), COUNT(*) FROM Reviews WHERE place_id = %s"
    cursor.execute(query, (place_id,))
    avg, count = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({
        "rating": round(avg, 1) if avg else None,
        "count": count
    })


if __name__ == '__main__':
    app.run(debug=True)
