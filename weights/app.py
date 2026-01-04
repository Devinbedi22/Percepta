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

# Configure CORS for Vercel and local development
CORS(app, 
     origins=[
         "http://localhost:3000",
         "https://*.vercel.app",
         "https://your-vercel-app.vercel.app"  # Replace with your actual Vercel URL
     ],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"]
)

# -------- JWT SECRET --------
JWT_SECRET = os.environ.get("JWT_SECRET", "kN8vQ2xR9mT5wL3pY7aB4jC6nF0hD8eG1sK4uM7iO2qZ5tV3wX9rA6bE8cH1fJ4g")
JWT_ALGORITHM = "HS256"

print(f"JWT Secret loaded: {JWT_SECRET[:10]}...") # Print first 10 chars for debugging

# -------- GROQ CLIENT --------
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

# -------- LOAD YOLO MODEL --------
try:
    model = YOLO("best.pt")
    print("YOLO model loaded successfully")
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    model = None

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# -------- TEMPORARY USER STORAGE (Replace with real DB later) --------
users_db = {}

# -------- CLASS NAMES --------
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

# -------- AUTH HELPER FUNCTIONS --------
def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(email):
    """Create a JWT token for a user"""
    payload = {
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token):
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['email']
    except jwt.ExpiredSignatureError:
        print("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        return None

# -------- AUTH DECORATOR --------
def token_required(f):
    """Decorator to protect routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        email = verify_token(token)
        if not email:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        return f(email, *args, **kwargs)
    return decorated

# -------- GROQ HELPER --------
def send_to_groq(prompt):
    """Send a prompt to GROQ API and get response"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"GROQ error: {e}")
        return None

# -------- HEALTH CHECK --------
@app.route("/")
def health():
    return jsonify({"status": "Backend running", "message": "Percepta-AI API is active"})

# -------- SIGNUP ENDPOINT --------
@app.route("/api/signup", methods=["POST"])
def signup():
    """Register a new user"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        # Validation
        if not email or not password:
            return jsonify({"message": "Email and password are required"}), 400

        if len(password) < 6:
            return jsonify({"message": "Password must be at least 6 characters"}), 400

        # Check if user already exists
        if email in users_db:
            return jsonify({"message": "User already exists"}), 409

        # Hash password and store user
        hashed_password = hash_password(password)
        users_db[email] = {
            'email': email,
            'password': hashed_password,
            'created_at': datetime.utcnow().isoformat()
        }

        # Create JWT token
        token = create_token(email)

        print(f"New user registered: {email}")

        return jsonify({
            "message": "Signup successful",
            "token": token,
            "user": {"email": email}
        }), 201

    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({"message": "Internal server error"}), 500

# -------- LOGIN ENDPOINT --------
@app.route("/api/login", methods=["POST"])
def login():
    """Authenticate a user and return JWT token"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        # Validation
        if not email or not password:
            return jsonify({"message": "Email and password are required"}), 400

        # Check if user exists
        user = users_db.get(email)
        if not user:
            return jsonify({"message": "Invalid email or password"}), 401

        # Verify password
        if not verify_password(password, user['password']):
            return jsonify({"message": "Invalid email or password"}), 401

        # Create JWT token
        token = create_token(email)

        print(f"User logged in: {email}")

        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {"email": email}
        }), 200

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"message": "Internal server error"}), 500

# -------- VERIFY TOKEN ENDPOINT --------
@app.route("/api/verify", methods=["GET"])
@token_required
def verify(email):
    """Verify if a token is valid"""
    return jsonify({
        "valid": True,
        "email": email
    }), 200

# -------- GET ALL USERS (Debug only - remove in production) --------
@app.route("/api/users", methods=["GET"])
def get_users():
    """Get all registered users (for debugging)"""
    return jsonify({
        "users": [{"email": user['email'], "created_at": user['created_at']} for user in users_db.values()]
    }), 200

# -------- MAIN API (Protected) --------
@app.route("/upload", methods=["POST"])
@token_required
def upload(email):
    """Upload and analyze skin image (requires authentication)"""
    try:
        image = request.files.get("image")
        image_url = request.form.get("imageURL")
        age = request.form.get("age")
        gender = request.form.get("gender")

        image_path = None

        # Handle file upload
        if image:
            image_path = os.path.join(UPLOAD_FOLDER, image.filename)
            image.save(image_path)
            print(f"Image saved: {image_path}")

        # Handle URL upload
        elif image_url:
            response = requests.get(image_url)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            image_path = os.path.join(UPLOAD_FOLDER, "downloaded.jpg")
            img.save(image_path)
            print(f"Image downloaded: {image_path}")

        else:
            return jsonify({"error": "No image provided"}), 400

        # Check if model is loaded
        if not model:
            return jsonify({"error": "YOLO model not loaded"}), 500

        # Run YOLO detection
        results = model(image_path)

        all_results = []
        predicted_problems = []

        # Process results
        for result in results:
            boxes = result.boxes
            xyxy = boxes.xyxy.cpu().numpy()
            conf = boxes.conf.cpu().numpy()
            cls = boxes.cls.cpu().numpy()

            for i in range(len(xyxy)):
                class_index = int(cls[i])
                label = class_names.get(class_index, "unknown")

                all_results.append({
                    "x1": float(xyxy[i][0]),
                    "y1": float(xyxy[i][1]),
                    "x2": float(xyxy[i][2]),
                    "y2": float(xyxy[i][3]),
                    "confidence": float(conf[i]),
                    "class": class_index,
                    "problem": label
                })

                predicted_problems.append(label)

        # Get unique problems
        predicted_problems = list(set(predicted_problems))

        # Generate recommendations using GROQ
        prompt = (
            f"Predicted skin issues: {predicted_problems}. "
            f"Age: {age}, Gender: {gender}. "
            "Provide medication suggestions and a daily skincare routine. "
            "Sound natural and human. Mention this is experimental advice."
        )

        recommendations = send_to_groq(prompt)

        print(f"Analysis complete for user: {email}")

        return jsonify({
            "results": all_results,
            "predicted_problems": predicted_problems,
            "recommendations": recommendations,
            "user_email": email
        })

    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({"error": str(e)}), 500

# -------- RENDER ENTRY POINT --------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"Starting Flask server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)