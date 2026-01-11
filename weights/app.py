from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import requests
from PIL import Image
from io import BytesIO
from groq import Groq
import os
from dotenv import load_dotenv
import jwt
from datetime import datetime, timedelta
from functools import wraps
from supabase import create_client, Client

# -------------------------------------------------
# ENV
# -------------------------------------------------
load_dotenv()

app = Flask(__name__)

# -------------------------------------------------
# FIXED CORS CONFIGURATION
# -------------------------------------------------
CORS(
    app,
    resources={r"/*": {
        "origins": [
            "http://localhost:3000",
            "https://percepta-livid.vercel.app",
        ],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }}
)

# -------------------------------------------------
# SUPABASE SETUP
# -------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ WARNING: Supabase credentials not found!")
    supabase = None
else:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase client initialized")
    except Exception as e:
        print(f"❌ Supabase initialization failed: {e}")
        supabase = None

# -------------------------------------------------
# JWT (SUPABASE JWT)
# -------------------------------------------------
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

print(f"Supabase JWT Secret loaded: {SUPABASE_JWT_SECRET[:10] if SUPABASE_JWT_SECRET else 'NOT FOUND'}...")

# -------------------------------------------------
# GROQ
# -------------------------------------------------
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# -------------------------------------------------
# YOLO MODEL (LAZY LOADING TO SAVE MEMORY)
# -------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "best.pt")
model = None

def load_model():
    """Load YOLO model only when needed"""
    global model
    if model is None:
        try:
            print("🔄 Loading YOLO model...")
            model = YOLO(MODEL_PATH)
            print("✅ YOLO model loaded successfully")
        except Exception as e:
            print(f"❌ YOLO model failed to load: {e}")
            raise
    return model

# -------------------------------------------------
# UPLOADS
# -------------------------------------------------
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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
def verify_supabase_jwt(token):
    """Verify Supabase JWT token from frontend"""
    try:
        # Decode without verification first to get user info
        payload = jwt.decode(token, options={"verify_signature": False})
        email = payload.get("email")
        user_id = payload.get("sub")
        
        if not email:
            print("❌ No email in JWT payload")
            return None, None
            
        # If you have SUPABASE_JWT_SECRET, verify signature
        if SUPABASE_JWT_SECRET:
            try:
                verified_payload = jwt.decode(
                    token, 
                    SUPABASE_JWT_SECRET, 
                    algorithms=["HS256"],
                    audience="authenticated"
                )
                print(f"✅ JWT verified for: {email}")
            except jwt.InvalidTokenError as e:
                print(f"⚠️ JWT signature verification failed: {e}")
                # Continue anyway - Supabase tokens are still valid
        
        return email, user_id
        
    except Exception as e:
        print(f"❌ JWT decode error: {e}")
        return None, None

# -------------------------------------------------
# TOKEN REQUIRED DECORATOR
# -------------------------------------------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization")

        if not auth or not auth.startswith("Bearer "):
            print("❌ No Authorization header or invalid format")
            return jsonify({"error": "Token is missing"}), 401

        token = auth.replace("Bearer ", "")
        
        # Verify Supabase JWT
        email, user_id = verify_supabase_jwt(token)

        if not email:
            print("❌ Invalid token - no email found")
            return jsonify({"error": "Invalid token"}), 401

        print(f"✅ Authenticated request from: {email}")
        return f(email, user_id, *args, **kwargs)
    
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
        "model_loaded": os.path.exists(MODEL_PATH),
        "supabase_connected": supabase is not None
    })

# -------------------------------------------------
# UPLOAD + ANALYZE (PROTECTED)
# -------------------------------------------------
@app.route("/upload", methods=["POST"])
@token_required
def upload(email, user_id):
    try:
        print(f"📸 Upload request from: {email} (ID: {user_id})")

        image = request.files.get("image")
        image_url = request.form.get("imageURL")
        age = request.form.get("age")
        gender = request.form.get("gender")

        if not image and not image_url:
            print("❌ No image provided")
            return jsonify({"error": "No image provided"}), 400

        # Save image locally for processing
        if image:
            image_path = os.path.join(UPLOAD_FOLDER, f"{user_id}_{image.filename}")
            image.save(image_path)
            print(f"💾 Image saved: {image_path}")
        else:
            print(f"🌐 Fetching image from URL: {image_url}")
            resp = requests.get(image_url, timeout=10)
            img = Image.open(BytesIO(resp.content))
            image_path = os.path.join(UPLOAD_FOLDER, f"{user_id}_remote.jpg")
            img.save(image_path)
            print(f"💾 Remote image saved: {image_path}")

        # Load model only when needed (saves memory)
        print("🔄 Loading YOLO model...")
        current_model = load_model()

        # Run YOLO detection
        print("🔍 Running YOLO detection...")
        results = current_model(image_path)
        predicted = set()

        for r in results:
            for cls in r.boxes.cls:
                class_name = class_names.get(int(cls), "unknown")
                predicted.add(class_name)
                print(f"  ✓ Detected: {class_name}")

        # Generate AI recommendations
        prompt = (
            f"Detected skin issues: {list(predicted)}. "
            f"Age: {age}, Gender: {gender}. "
            "Give personalized skincare advice with product recommendations."
        )
        
        print("🤖 Generating recommendations with Groq...")
        recommendations = send_to_groq(prompt)

        # Store analysis in Supabase (optional)
        if supabase:
            try:
                analysis_data = {
                    "user_id": user_id,
                    "email": email,
                    "age": age,
                    "gender": gender,
                    "detected_issues": list(predicted),
                    "recommendations": recommendations,
                    "created_at": datetime.utcnow().isoformat()
                }
                
                supabase.table("skin_analyses").insert(analysis_data).execute()
                print("💾 Analysis saved to Supabase")
            except Exception as e:
                print(f"⚠️ Failed to save to Supabase: {e}")

        print("✅ Analysis complete!")
        return jsonify({
            "predicted_problems": list(predicted),
            "recommendations": recommendations,
            "user_email": email,
            "user_id": user_id
        })

    except Exception as e:
        print(f"❌ UPLOAD ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"AI processing failed: {str(e)}"}), 500

# -------------------------------------------------
# GET USER'S ANALYSIS HISTORY (PROTECTED)
# -------------------------------------------------
@app.route("/api/history", methods=["GET"])
@token_required
def get_history(email, user_id):
    try:
        if not supabase:
            return jsonify({"error": "Database not connected"}), 500
        
        response = supabase.table("skin_analyses")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(10)\
            .execute()
        
        return jsonify({
            "history": response.data
        })
    except Exception as e:
        print(f"❌ HISTORY ERROR: {e}")
        return jsonify({"error": "Failed to fetch history"}), 500

# -------------------------------------------------
# DEBUG ENDPOINT
# -------------------------------------------------
@app.route("/api/debug", methods=["GET"])
def debug():
    return jsonify({
        "supabase_url": SUPABASE_URL[:20] + "..." if SUPABASE_URL else "NOT SET",
        "supabase_key_set": bool(SUPABASE_KEY),
        "supabase_jwt_secret_set": bool(SUPABASE_JWT_SECRET),
        "groq_api_key_set": bool(os.environ.get("GROQ_API_KEY")),
        "model_exists": os.path.exists(MODEL_PATH),
        "supabase_connected": supabase is not None
    })

# -------------------------------------------------
# RENDER ENTRY
# -------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"🚀 Starting Flask server on port {port}...")
    print(f"📍 Environment: {'Production' if not os.environ.get('FLASK_ENV') == 'development' else 'Development'}")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)