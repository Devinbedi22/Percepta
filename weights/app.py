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
        "https://percepta-livid.vercel.app"
    ],
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"]
)

# -------------------------------------------------
# JWT
# -------------------------------------------------
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = "HS256"

# -------------------------------------------------
# GROQ
# -------------------------------------------------
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# -------------------------------------------------
# YOLO MODEL (🔥 FIXED PATH)
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
# AUTH HELPERS
# -------------------------------------------------
def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(email):
    payload = {
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# -------------------------------------------------
# GROQ HELPER
# -------------------------------------------------
def send_to_groq(prompt):
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a skincare AI expert."},
                {"role": "user", "content": prompt}
            ]
        )
        return completion.choices[0].message.content
    except Exception as e:
        print("❌ GROQ ERROR:", e)
        return "Unable to generate recommendations."

# -------------------------------------------------
# HEALTH CHECK
# -------------------------------------------------
@app.route("/")
def health():
    return jsonify({"status": "ok"})

# -------------------------------------------------
# AUTH
# -------------------------------------------------
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if email in users_db:
        return jsonify({"error": "User exists"}), 409

    users_db[email] = {
        "password": hash_password(password)
    }

    return jsonify({"token": create_token(email)})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = users_db.get(email)
    if not user or not verify_password(password, user["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({"token": create_token(email)})

# -------------------------------------------------
# UPLOAD + ANALYZE
# -------------------------------------------------
@app.route("/upload", methods=["POST"])
def upload():
    try:
        image = request.files.get("image")
        image_url = request.form.get("imageURL")
        age = request.form.get("age")
        gender = request.form.get("gender")

        if image:
            image_path = os.path.join(UPLOAD_FOLDER, image.filename)
            image.save(image_path)
        elif image_url:
            resp = requests.get(image_url, timeout=10)
            img = Image.open(BytesIO(resp.content))
            image_path = os.path.join(UPLOAD_FOLDER, "remote.jpg")
            img.save(image_path)
        else:
            return jsonify({"error": "No image provided"}), 400

        if not model:
            return jsonify({"error": "YOLO model not loaded"}), 500

        results = model(image_path)
        predicted = set()

        for r in results:
            for cls in r.boxes.cls:
                predicted.add(class_names.get(int(cls), "unknown"))

        prompt = (
            f"Skin issues: {list(predicted)}. "
            f"Age: {age}, Gender: {gender}. "
            "Give skincare advice."
        )

        recommendations = send_to_groq(prompt)

        return jsonify({
            "predicted_problems": list(predicted),
            "recommendations": recommendations
        })

    except Exception as e:
        print("❌ UPLOAD ERROR:", e)
        return jsonify({"error": "AI processing failed"}), 500

# -------------------------------------------------
# RENDER ENTRY
# -------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
