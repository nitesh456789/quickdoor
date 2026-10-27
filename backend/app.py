
from multiprocessing.dummy import connection

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import re
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)



app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = "quickdoor-dev-secret-change-before-production"

jwt = JWTManager(app)

DATABASE = "quickdoor.db"


def get_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_db()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        )
    """)
    
    columns = connection.execute(
        "PRAGMA table_info(users)"
    ).fetchall()

    column_names = [column["name"] for column in columns]

    if "role" not in column_names:
        connection.execute("""
            ALTER TABLE users
            ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'
        """)

    
    
    connection.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL UNIQUE,
            user_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'Placed',
            items TEXT NOT NULL,
            subtotal REAL NOT NULL,
            delivery_charge REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL,
            order_date TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            customer_address TEXT NOT NULL,
            customer_city TEXT NOT NULL,
            customer_pincode TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)





    connection.commit()
    connection.close()


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Welcome to Quickdoor Backend!",
        "status": "Backend is running"
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "success": True,
        "message": "Quickdoor API is working!"
    })


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email and password are required."
        }), 400

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({
            "success": False,
            "message": "Please enter a valid email address."
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "message": "Password must be at least 8 characters."
        }), 400

    password_hash = generate_password_hash(password)

    connection = get_db()

    try:
        connection.execute(
            """
            INSERT INTO users (name, email, password_hash)
            VALUES (?, ?, ?)
            """,
            (name, email, password_hash)
        )
        connection.commit()

        return jsonify({
            "success": True,
            "message": "Account created successfully!"
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({
            "success": False,
            "message": "An account with this email already exists."
        }), 409

    finally:
        connection.close()

   

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required."
        }), 400

    connection = get_db()

    try:
        user = connection.execute(
            """
            SELECT id, name, email, password_hash, role
            FROM users
            WHERE email = ?
            """,
            (email,)
        ).fetchone()

        if user is None or not check_password_hash(
            user["password_hash"], password
        ):
            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401

        access_token = create_access_token(
            identity=str(user["id"]),
            additional_claims={
                "role": user["role"]
            }
        )

        return jsonify({
            "success": True,
            "message": "Login successful!",
            "access_token": access_token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        }), 200

    finally:
        connection.close()

@app.route("/api/admin/orders", methods=["GET"])
@jwt_required()
def get_all_admin_orders():
    if get_jwt().get("role") != "admin":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    import json

    connection = get_db()

    try:
        rows = connection.execute("""
            SELECT *
            FROM orders
            ORDER BY id DESC
        """).fetchall()

        orders = []

        for row in rows:
            orders.append({
                "orderId": row["order_id"],
                "userId": row["user_id"],
                "status": row["status"],
                "items": json.loads(row["items"]),
                "subtotal": row["subtotal"],
                "deliveryCharge": row["delivery_charge"],
                "total": row["total"],
                "date": row["order_date"],
                "customer": {
                    "name": row["customer_name"],
                    "phone": row["customer_phone"],
                    "address": row["customer_address"],
                    "city": row["customer_city"],
                    "pincode": row["customer_pincode"]
                }
            })

        return jsonify({
            "success": True,
            "orders": orders
        }), 200

    finally:
        connection.close()

     

@app.route("/api/orders", methods=["POST"])
def create_order():
    data = request.get_json(silent=True) or {}

    required_fields = [
        "order_id",
        "user_id",
        "items",
        "subtotal",
        "delivery_charge",
        "total",
        "order_date",
        "customer_name",
        "customer_phone",
        "customer_address",
        "customer_city",
        "customer_pincode"
    ]

    for field in required_fields:
        if field not in data:
            return jsonify({
                "success": False,
                "message": f"Missing field: {field}"
            }), 400

    connection = get_db()

    try:
        connection.execute(
            """
            INSERT INTO orders (
                order_id, user_id, status, items,
                subtotal, delivery_charge, total, order_date,
                customer_name, customer_phone, customer_address,
                customer_city, customer_pincode
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                data["order_id"],
                data["user_id"],
                data.get("status", "Placed"),
                __import__("json").dumps(data["items"]),
                data["subtotal"],
                data["delivery_charge"],
                data["total"],
                data["order_date"],
                data["customer_name"],
                data["customer_phone"],
                data["customer_address"],
                data["customer_city"],
                data["customer_pincode"]
            )
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Order saved successfully!"
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({
            "success": False,
            "message": "Order ID already exists or user does not exist."
        }), 409

    finally:
        connection.close()


        

@app.route("/api/orders/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_orders(user_id):
    current_user_id = int(get_jwt_identity())
    user_role = get_jwt().get("role")

    if user_role != "admin" and current_user_id != user_id:
        return jsonify({
            "success": False,
            "message": "You can only access your own orders."
        }), 403

    import json

    

    connection = get_db()

    try:
        rows = connection.execute(
            """
            SELECT *
            FROM orders
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (user_id,)
        ).fetchall()

        user_orders = []

        for row in rows:
            user_orders.append({
                "orderId": row["order_id"],
                "userId": row["user_id"],
                "status": row["status"],
                "items": json.loads(row["items"]),
                "subtotal": row["subtotal"],
                "deliveryCharge": row["delivery_charge"],
                "total": row["total"],
                "date": row["order_date"],
                "customer": {
                    "name": row["customer_name"],
                    "phone": row["customer_phone"],
                    "address": row["customer_address"],
                    "city": row["customer_city"],
                    "pincode": row["customer_pincode"]
                }
            })

        return jsonify({
            "success": True,
            "orders": user_orders
        }), 200

    finally:
        connection.close()
@app.route("/api/orders/<order_id>/status", methods=["PUT"])
@jwt_required()
def update_order_status(order_id):
    if get_jwt().get("role") != "admin":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    data = request.get_json(silent=True) or {}
    status = data.get("status", "").strip()

    allowed_statuses = [
        "Placed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"
    ]

    if status not in allowed_statuses:
        return jsonify({
            "success": False,
            "message": "Invalid order status."
        }), 400

    connection = get_db()

    try:
        cursor = connection.execute(
            "UPDATE orders SET status = ? WHERE order_id = ?",
            (status, order_id)
        )
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "success": False,
                "message": "Order not found."
            }), 404

        return jsonify({
            "success": True,
            "message": "Order status updated successfully.",
            "orderId": order_id,
            "status": status
        }), 200

    finally:
        connection.close()


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
