from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import requests
from PIL import Image
from io import BytesIO
from groq import Groq
import os
from dotenv import load_dotenv
import bcrypt
import jwt
from datetime import datetime, timedelta
from functools import wraps

# -------------------------------------------------
# ENV
# -------------------------------------------------
load_dotenv()

app = Flask(__name__)

CORS(
    app,
    origins=[
        "http://localhost:3000",
        "https://percepta-livid.vercel.app",
    ],
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"]
)

# -------------------------------------------------
# JWT (CUSTOM BACKEND JWT – KEPT)
# -------------------------------------------------
JWT_SECRET = os.environ.get(
    "JWT_SECRET",
    "kN8vQ2xR9mT5wL3pY7aB4jC6nF0hD8eG1sK4uM7iO2qZ5tV3wX9rA6bE8cH1fJ4g"
)
JWT_ALGORITHM = "HS256"

print(f"JWT Secret loaded: {JWT_SECRET[:10]}...")

# -------------------------------------------------
# GROQ
# -------------------------------------------------
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# -------------------------------------------------
# YOLO MODEL
# -------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "best.pt")

print("Looking for YOLO model at:", MODEL_PATH)

try:
    model = YOLO(MODEL_PATH)
    print("✅ YOLO model loaded successfully")
except Exception as e:
    print("❌ YOLO model failed to load:", e)
    model = None

# -------------------------------------------------
# UPLOADS
# -------------------------------------------------
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# -------------------------------------------------
# TEMP USER STORE (DEV)
# -------------------------------------------------
users_db = {}

# -------------------------------------------------
# CLASS NAMES
# -------------------------------------------------
class_names = {
    0: 'Dark Circle',
    1: 'Eyebag',
    2: 'acne scar',
    3: 'blackhead',
    4: 'dark spot',
    5: 'freckle',
    6: 'melasma',
    7: 'nodules',
    8: 'papules',
    9: 'pustules',
    10: 'skin redness',
    11: 'vascular',
    12: 'whitehead',
    13: 'wrinkle'
}

# -------------------------------------------------
# AUTH HELPERS (KEPT)
# -------------------------------------------------
def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(email):
    payload = {
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_custom_jwt(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("email")
    except Exception:
        return None

# -------------------------------------------------
# 🔧 FIX: ACCEPT SUPABASE JWT OR CUSTOM JWT
# -------------------------------------------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization")

        if not auth or not auth.startswith("Bearer "):
            return jsonify({"error": "Token is missing"}), 401

        token = auth.replace("Bearer ", "")

        email = None

        # 1️⃣ Try custom backend JWT (old system)
        email = verify_custom_jwt(token)

        # 2️⃣ If that fails, try Supabase JWT (frontend auth)
        if not email:
            try:
                payload = jwt.decode(token, options={"verify_signature": False})
                email = payload.get("email") or payload.get("sub")
            except Exception as e:
                print("JWT decode error:", e)
                return jsonify({"error": "Invalid token"}), 401

        if not email:
            return jsonify({"error": "Invalid token"}), 401

        return f(email, *args, **kwargs)
    return decorated

# -------------------------------------------------
# GROQ HELPER
# -------------------------------------------------
def send_to_groq(prompt):
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a skincare AI expert. Provide clear, actionable skincare advice."},
                {"role": "user", "content": prompt}
            ]
        )
        return completion.choices[0].message.content
    except Exception as e:
        print("❌ GROQ ERROR:", e)
        return "Unable to generate recommendations at this time."

# -------------------------------------------------
# HEALTH CHECK
# -------------------------------------------------
@app.route("/")
def health():
    return jsonify({
        "status": "ok",
        "message": "Percepta-AI Backend Running",
        "model_loaded": model is not None
    })

# -------------------------------------------------
# AUTH ENDPOINTS (KEPT)
# -------------------------------------------------
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    if email in users_db:
        return jsonify({"message": "User already exists"}), 409

    users_db[email] = {
        "password": hash_password(password),
        "created_at": datetime.utcnow().isoformat()
    }

    token = create_token(email)
    return jsonify({"token": token}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = users_db.get(email)
    if not user or not verify_password(password, user["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_token(email)
    return jsonify({"token": token}), 200

# -------------------------------------------------
# UPLOAD + ANALYZE (PROTECTED)
# -------------------------------------------------
@app.route("/upload", methods=["POST"])
@token_required
def upload(email):
    try:
        print(f"📸 Upload request from: {email}")

        image = request.files.get("image")
        image_url = request.form.get("imageURL")
        age = request.form.get("age")
        gender = request.form.get("gender")

        if not image and not image_url:
            return jsonify({"error": "No image provided"}), 400

        if image:
            image_path = os.path.join(UPLOAD_FOLDER, f"{email}_{image.filename}")
            image.save(image_path)
        else:
            resp = requests.get(image_url, timeout=10)
            img = Image.open(BytesIO(resp.content))
            image_path = os.path.join(UPLOAD_FOLDER, f"{email}_remote.jpg")
            img.save(image_path)

        if not model:
            return jsonify({"error": "YOLO model not loaded"}), 500

        results = model(image_path)
        predicted = set()

        for r in results:
            for cls in r.boxes.cls:
                predicted.add(class_names.get(int(cls), "unknown"))

        prompt = (
            f"Detected skin issues: {list(predicted)}. "
            f"Age: {age}, Gender: {gender}. "
            "Give personalized skincare advice."
        )

        recommendations = send_to_groq(prompt)

        return jsonify({
            "predicted_problems": list(predicted),
            "recommendations": recommendations,
            "user_email": email
        })

    except Exception as e:
        print("❌ UPLOAD ERROR:", e)
        return jsonify({"error": "AI processing failed"}), 500

# -------------------------------------------------
# DEBUG USERS (KEPT)
# -------------------------------------------------
@app.route("/api/users", methods=["GET"])
def list_users():
    return jsonify({
        "total_users": len(users_db),
        "users": list(users_db.keys())
    })

# -------------------------------------------------
# RENDER ENTRY
# -------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"🚀 Starting Flask server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)

