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

# Load environment variables
load_dotenv()

app = Flask(__name__)

# ---------------- CORS CONFIG (FIXED) ----------------
CORS(
    app,
    origins=[
        "http://localhost:3000",
        "https://percepta-livid.vercel.app"  # ✅ YOUR ACTUAL VERCEL URL
    ],
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"]
)

# ---------------- JWT CONFIG ----------------
JWT_SECRET = os.environ.get(
    "JWT_SECRET",
    "kN8vQ2xR9mT5wL3pY7aB4jC6nF0hD8eG1sK4uM7iO2qZ5tV3wX9rA6bE8cH1fJ4g"
)
JWT_ALGORITHM = "HS256"

# ---------------- GROQ CLIENT ----------------
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

# ---------------- LOAD YOLO MODEL (FIXED PATH) ----------------
MODEL_PATH = os.path.join("weights", "best.pt")

try:
    model = YOLO(MODEL_PATH)
    print("YOLO model loaded successfully")
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    model = None

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------- TEMP USER STORE ----------------
users_db = {}

# ---------------- CLASS NAMES ----------------
class_names = {
    0: '3',
    1: 'Dark Circle',
    2: 'Dark circle',
    3: 'Eyebag',
    4: 'acne scar',
    5: 'blackhead',
    6: 'blackheads',
    7: 'dark spot',
    8: 'darkspot',
    9: 'freckle',
    10: 'melasma',
    11: 'nodules',
    12: 'papules',
    13: 'pustules',
    14: 'skinredness',
    15: 'vascular',
    16: 'whitehead',
    17: 'whiteheads',
    18: 'wrinkle'
}

# ---------------- AUTH HELPERS ----------------
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(email):
    payload = {
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['email']
    except Exception:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'error': 'Token missing'}), 401

        if token.startswith("Bearer "):
            token = token[7:]

        email = verify_token(token)
        if not email:
            return jsonify({'error': 'Invalid or expired token'}), 401

        return f(email, *args, **kwargs)
    return decorated

# ---------------- GROQ HELPER ----------------
def send_to_groq(prompt):
    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile"
        )
        return completion.choices[0].message.content
    except Exception as e:
        print("GROQ error:", e)
        return None

# ---------------- HEALTH ----------------
@app.route("/")
def health():
    return jsonify({
        "status": "Backend running",
        "message": "Percepta-AI API is active"
    })

# ---------------- SIGNUP ----------------
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    if email in users_db:
        return jsonify({"message": "User already exists"}), 409

    users_db[email] = {
        "email": email,
        "password": hash_password(password),
        "created_at": datetime.utcnow().isoformat()
    }

    token = create_token(email)
    return jsonify({"message": "Signup successful", "token": token})

# ---------------- LOGIN ----------------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = users_db.get(email)
    if not user or not verify_password(password, user["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_token(email)
    return jsonify({"message": "Login successful", "token": token})

# ---------------- UPLOAD + ANALYZE ----------------
@app.route("/upload", methods=["POST"])
@token_required
def upload(email):
    image = request.files.get("image")
    image_url = request.form.get("imageURL")
    age = request.form.get("age")
    gender = request.form.get("gender")

    if image:
        image_path = os.path.join(UPLOAD_FOLDER, image.filename)
        image.save(image_path)
    elif image_url:
        resp = requests.get(image_url)
        img = Image.open(BytesIO(resp.content))
        image_path = os.path.join(UPLOAD_FOLDER, "downloaded.jpg")
        img.save(image_path)
    else:
        return jsonify({"error": "No image provided"}), 400

    if not model:
        return jsonify({"error": "Model not loaded"}), 500

    results = model(image_path)
    predicted = []

    for r in results:
        for c in r.boxes.cls:
            predicted.append(class_names.get(int(c), "unknown"))

    predicted = list(set(predicted))

    prompt = (
        f"Predicted skin issues: {predicted}. "
        f"Age: {age}, Gender: {gender}. "
        "Provide skincare advice."
    )

    recommendations = send_to_groq(prompt)

    return jsonify({
        "predicted_problems": predicted,
        "recommendations": recommendations,
        "user": email
    })

# ---------------- RENDER ENTRY POINT (FIXED) ----------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"Starting Flask server on port {port}...")
    app.run(host="0.0.0.0", port=port)
