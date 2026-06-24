from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from ultralytics import YOLO
import requests
from PIL import Image
from io import BytesIO
from groq import Groq
import google.genai as genai
import base64
import json
import os
from dotenv import load_dotenv
import uuid
import jwt
from jwt import PyJWKClient
from datetime import datetime
from functools import wraps
from supabase import create_client, Client
import torch
import warnings

# -------------------------------------------------
# ENV
# -------------------------------------------------
load_dotenv()

app = Flask(__name__)

# Suppress PyTorch warnings
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)

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
# APPLICATION CONFIG
# -------------------------------------------------
print("ℹ️ Percepta Backend with Supabase Authentication and History Storage")

# -------------------------------------------------
# SUPABASE SETUP
# -------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

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

if SUPABASE_JWT_SECRET:
    print(f"✅ JWT Secret loaded for signature verification")
else:
    print("⚠️ JWT Secret not configured - signature verification disabled")

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
    """Load YOLO model only when needed with PyTorch compatibility fix"""
    global model
    if model is None:
        try:
            print("🔄 Loading YOLO model...")

            # Force standard PyTorch loading for this locally trusted checkpoint.
            # PyTorch 2.6+ uses weights_only=True by default for torch.load, and
            # older Ultralytics checkpoints may require weights_only=False to load.
            original_torch_load = torch.load

            def _torch_load_with_weights_only_false(f, *args, **kwargs):
                if "weights_only" not in kwargs:
                    kwargs["weights_only"] = False
                return original_torch_load(f, *args, **kwargs)

            torch.load = _torch_load_with_weights_only_false
            try:
                model = YOLO(MODEL_PATH)
            finally:
                torch.load = original_torch_load

            print("✅ YOLO model loaded successfully")
            print("Loaded model class names:")
            for idx, name in sorted(model.names.items()):
                print(f"  {idx}: {name}")
        except Exception as e:
            print(f"❌ YOLO model failed to load: {e}")
            print(f"⚠️ Make sure 'best.pt' exists at: {MODEL_PATH}")
            import traceback
            traceback.print_exc()
            raise
    return model


def normalize_label(label: str) -> str:
    normalized = label.strip().lower().replace('_', ' ').replace('-', ' ')
    mapping = {
        'whitehead': 'Whiteheads',
        'whiteheads': 'Whiteheads',
        'wrinkle': 'Wrinkles',
        'wrinkles': 'Wrinkles',
        'dark spot': 'Dark Spots',
        'dark spots': 'Dark Spots',
        'dark_spot': 'Dark Spots',
        'skinredness': 'Skin Redness',
        'skin redness': 'Skin Redness',
        'acne': 'Acne',
        'acne scar': 'Acne Scars',
        'blackhead': 'Blackheads',
        'blackheads': 'Blackheads',
        'freckle': 'Freckles',
        'freckles': 'Freckles',
        'melasma': 'Melasma',
        'nodule': 'Nodules',
        'nodules': 'Nodules',
        'papule': 'Papules',
        'papules': 'Papules',
        'pustule': 'Pustules',
        'pustules': 'Pustules',
        'vascular': 'Vascular',
        'dark circle': 'Dark Circles',
        'eyebag': 'Eyebags',
    }
    return mapping.get(normalized, normalized.title())

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

ACNE_RELATED_CLASSES = {'Whiteheads', 'Blackheads', 'Papules', 'Pustules', 'Nodules'}


def get_severity_label(confidence: float | None) -> str:
    if confidence is None:
        return 'Low'
    if confidence >= 0.6:
        return 'High'
    if confidence >= 0.35:
        return 'Moderate'
    if confidence >= 0.15:
        return 'Mild'
    return 'Low'

# -------------------------------------------------
# JWT VERIFICATION
# -------------------------------------------------
def verify_supabase_jwt(token):
    """Verify JWT token issued by Supabase"""
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]

        # Log header and payload before verification
        header = jwt.get_unverified_header(token)
        payload_unverified = jwt.decode(token, options={"verify_signature": False})
        print("JWT Header:", header)
        print("JWT Payload:", payload_unverified)

        alg = header.get("alg")
        if not alg:
            print("❌ JWT verification error: alg header missing")
            return None

        expected_audience = "authenticated"
        token_audience = payload_unverified.get("aud")
        print("Expected audience:", expected_audience)
        print("Token audience:", token_audience)

        if alg == "HS256":
            if not SUPABASE_JWT_SECRET:
                print("⚠️ JWT_SECRET not configured - cannot verify HS256 signature")
                return None

            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience=expected_audience,
            )
            print("Decoded payload:", payload)
            return payload

        if alg in {"RS256", "ES256"}:
            if not SUPABASE_URL:
                print("⚠️ SUPABASE_URL not configured - cannot fetch JWKS for token verification")
                return None

            jwks_url = f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
            print(f"🔐 Verifying {alg} token with JWKS URL:", jwks_url)
            jwk_client = PyJWKClient(jwks_url)
            signing_key = jwk_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                audience=expected_audience,
            )
            print("Decoded payload:", payload)
            return payload

        print(f"❌ JWT verification error: unsupported alg '{alg}'")
        return None
    except jwt.ExpiredSignatureError:
        print("❌ JWT token has expired")
        return None
    except jwt.InvalidSignatureError:
        print("❌ JWT signature is invalid")
        return None
    except Exception as e:
        print(f"❌ JWT verification error: {e}")
        return None

def token_required(f):
    """Decorator to require valid JWT token for route"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check Authorization header
        if 'Authorization' in request.headers:
            try:
                auth_header = request.headers['Authorization']
                if auth_header.startswith('Bearer '):
                    token = auth_header[7:]
                else:
                    token = auth_header
            except:
                return jsonify({'error': 'Invalid Authorization header'}), 401
        
        if not token:
            return jsonify({'error': 'Missing or invalid token'}), 401
        
        # Verify token
        payload = verify_supabase_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Store user info in request context
        request.user_id = payload.get('sub')
        request.user_email = payload.get('email')
        
        return f(*args, **kwargs)
    
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


def call_verification_llm(image_path: str, yolo_results: list, age: str, gender: str):
    """Send actual image bytes + YOLO results to Gemini Vision for verification.
    Expects Gemini to return JSON with keys: verified_concerns, analysis, recommendations, preventive_measures, lifestyle_tips.
    Returns parsed JSON or None on failure.
    """
    # Prefer GEMINI_API if present for compatibility with .env naming
    gemini_api_key = os.environ.get("GEMINI_API") or os.environ.get("GEMINI_API_KEY")
    if not gemini_api_key:
        print("⚠️ GEMINI_API_KEY or GEMINI_API is not configured.")
        return None

    gemini_model = "gemini-2.5-flash"

    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
    except Exception as e:
        print("❌ Failed to read image for Gemini verification:", e)
        return None

    mime_type = "image/jpeg"
    try:
        with Image.open(image_path) as img:
            if img.format == "PNG":
                mime_type = "image/png"
            elif img.format in {"JPEG", "JPG"}:
                mime_type = "image/jpeg"
            elif img.format == "WEBP":
                mime_type = "image/webp"
            elif img.format == "BMP":
                mime_type = "image/bmp"
            elif img.format == "GIF":
                mime_type = "image/gif"
    except Exception as e:
        print("⚠️ Could not determine MIME type from image; defaulting to image/jpeg:", e)

    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    system_prompt = (
        "You are an AI skincare analysis assistant.\n\n"
        "You will receive an attached image and YOLO detections.\n"
        "The image is the primary source of truth.\n"
        "Do not use any image URLs in your reasoning.\n"
        "Do not claim medical diagnoses.\n"
        "Return only valid JSON in the schema below.\n\n"
        "Return JSON in the following format exactly (no additional text):\n"
        "{\n"
        "  \"verified_concerns\": [],\n"
        "  \"analysis\": \"\",\n"
        "  \"recommendations\": [],\n"
        "  \"preventive_measures\": [],\n"
        "  \"lifestyle_tips\": []\n"
        "}\n"
    )

    user_prompt = (
        f"YOLO detections: {json.dumps(yolo_results)}\n"
        f"Age: {age}, Gender: {gender}\n"
        "Inspect the attached image and the YOLO detections. Return the JSON described above."
    )

    request_body = {
        "model": gemini_model,
        "system_instruction": system_prompt,
        "input": [
            {
                "type": "text",
                "text": user_prompt,
            },
            {
                "type": "image",
                "data": image_base64,
                "mime_type": mime_type,
            },
        ],
        "generation_config": {
            "temperature": 0.0,
            "max_output_tokens": 1500,
        },
    }

    print("🔎 Gemini Vision verification model:", gemini_model)
    print("🔎 Gemini request body:", json.dumps({
        "model": request_body["model"],
        "system_instruction": "<SYSTEM_PROMPT>",
        "input": [
            {"type": "text", "text": "<USER_PROMPT>"},
            {"type": "image", "data": "<BASE64_IMAGE_BYTES>", "mime_type": mime_type},
        ],
        "generation_config": request_body["generation_config"],
    }, indent=2))

    try:
        client = genai.Client(api_key=gemini_api_key)
        response = client.interactions.create(**request_body, timeout=30)

        output_text = getattr(response, "output_text", None)
        if output_text:
            print("🔎 Gemini output_text:", output_text[:2000] + ("... [truncated]" if len(output_text) > 2000 else ""))
            try:
                return json.loads(output_text)
            except Exception:
                try:
                    start = output_text.find("{")
                    end = output_text.rfind("}")
                    if start != -1 and end != -1:
                        return json.loads(output_text[start:end+1])
                except Exception:
                    pass

        if hasattr(response, "steps") and response.steps:
            for step in response.steps:
                if getattr(step, "type", None) == "model_output":
                    step_content = getattr(step, "content", None)
                    if isinstance(step_content, list):
                        for content_item in step_content:
                            text = getattr(content_item, "text", None) if hasattr(content_item, "text") else None
                            if text:
                                try:
                                    return json.loads(text)
                                except Exception:
                                    continue

        return None
    except Exception as e:
        print("❌ Gemini verification error:", e)
        return None

# -------------------------------------------------
# HEALTH CHECK
# -------------------------------------------------
@app.route("/")
def health():
    return jsonify({
        "status": "ok",
        "message": "Percepta-AI Backend Running",
        "model_loaded": os.path.exists(MODEL_PATH),
        "groq_api_key_set": bool(os.environ.get("GROQ_API_KEY")),
        "gemini_api_key_set": bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API"))
    })

# -------------------------------------------------
# UPLOAD + ANALYZE
# -------------------------------------------------
@app.route("/upload", methods=["POST"])
@token_required
def upload():
    try:
        print("📸 Upload request received")

        image = request.files.get("image")
        image_url = request.form.get("imageURL")
        age = request.form.get("age")
        gender = request.form.get("gender")
        unique_id = uuid.uuid4().hex

        if not image and not image_url:
            print("❌ No image provided")
            return jsonify({"error": "No image provided"}), 400

        # Save image locally for processing
        if image:
            image_path = os.path.join(UPLOAD_FOLDER, f"{unique_id}_{image.filename}")
            image.save(image_path)
            print(f"💾 Image saved: {image_path}")
            stored_image_url = f"/uploads/{os.path.basename(image_path)}"
        else:
            print(f"🌐 Fetching image from URL: {image_url}")
            resp = requests.get(image_url, timeout=10)
            img = Image.open(BytesIO(resp.content))
            image_path = os.path.join(UPLOAD_FOLDER, f"{unique_id}_remote.jpg")
            img.save(image_path)
            print(f"💾 Remote image saved: {image_path}")
            stored_image_url = f"/uploads/{os.path.basename(image_path)}"

        # Load model only when needed (saves memory)
        print("🔄 Loading YOLO model...")
        current_model = load_model()

        # Run YOLO detection
        print("🔍 Running YOLO detection...")
        results = current_model(image_path, conf=0.01, imgsz=640)
        print("RAW YOLO RESULTS:", results)
        
        # Dictionary to track highest confidence for each class name
        detection_dict = {}
        raw_detections = []

        for r in results:
            num_boxes = 0 if r.boxes is None else r.boxes.data.shape[0]
            print(f"RESULT ITEM: boxes={num_boxes}, cls={r.boxes.cls if r.boxes is not None else None}, conf={r.boxes.conf if r.boxes is not None else None}")
            if num_boxes == 0:
                print("⚠️ No detections found in this result")
                continue

            classes = r.boxes.cls.cpu().numpy().astype(int)
            confidences = r.boxes.conf.cpu().numpy()
            CONF_THRESHOLD = 0.01

            for cls, conf in zip(classes, confidences):
                print(f"  Detected raw class={cls}, conf={conf:.4f}")
                raw_detections.append((cls, float(conf)))
                if conf < CONF_THRESHOLD:
                    print(f"  Skipping low-confidence detection: class={cls}, conf={conf:.4f}")
                    continue
                raw_label = current_model.names.get(int(cls), None)
                class_name = str(raw_label or "").strip()
                print(f"    raw_label from model.names[{int(cls)}] = {repr(raw_label)}")
                invalid_label = (
                    not class_name
                    or class_name.lower() == "nan"
                    or class_name == "None"
                    or class_name.isnumeric()
                )
                if invalid_label:
                    class_name = class_names.get(int(cls), "Unknown Skin Condition")
                    print(f"    invalid label - falling back to class_names[{int(cls)}] = {repr(class_name)}")
                else:
                    mapped_label = class_names.get(int(cls))
                    if mapped_label:
                        print(f"    mapping class id {int(cls)} to class_names[{int(cls)}] = {repr(mapped_label)}")
                        class_name = mapped_label

                # Normalize labels and keep only the highest confidence for each class name
                normalized_label = normalize_label(class_name)
                if normalized_label not in detection_dict or conf > detection_dict[normalized_label]:
                    detection_dict[normalized_label] = float(conf)
                    print(f"  ✓ Detected: {normalized_label} ({conf:.2f})")

        if 'Acne' not in detection_dict:
            acne_confidences = [conf for label, conf in detection_dict.items() if label in ACNE_RELATED_CLASSES]
            if acne_confidences:
                max_acne_confidence = max(acne_confidences)
                detection_dict['Acne'] = max_acne_confidence
                print(f"  Derived Acne from acne-related findings with confidence={max_acne_confidence:.2f}")

        # Convert detection_dict to sorted results_payload (highest confidence first)
        results_payload = [
            {"problem": class_name, "confidence": conf}
            for class_name, conf in sorted(detection_dict.items(), key=lambda x: x[1], reverse=True)
        ]
        predicted = set(detection_dict.keys())

        print("Detected classes:")
        for cls, conf in raw_detections:
            print(f"  class={cls} confidence={conf:.4f}")

        print("Final normalized issues:")
        for item in results_payload:
            print(f"  {item['problem']} {item['confidence']:.4f}")

        print("Final displayed severity levels:")
        for item in results_payload:
            severity = get_severity_label(item['confidence'])
            print(f"  {item['problem']} → {severity}")

        print("RESULTS_PAYLOAD:", results_payload)
        print("PREDICTED_PROBLEMS:", list(predicted))


        # Call verification LLM with actual uploaded image bytes + YOLO results (post-processing layer)
        verification_input = results_payload  # list of {problem, confidence}

        print("🤖 Sending image bytes + YOLO results to Gemini Vision for verification...")
        llm_response = None
        try:
            llm_response = call_verification_llm(image_path, verification_input, age or "", gender or "")
            print("Gemini verification response:", llm_response)
        except Exception as e:
            print("❌ Gemini verification call failed:", e)

        # If LLM returned structured JSON, use its verified concerns and recommendations.
        if llm_response and isinstance(llm_response, dict) and llm_response.get('verified_concerns'):
            verified_concerns = llm_response.get('verified_concerns', [])
            # Build verified results payload (no confidence from LLM)
            verified_results_payload = [
                {"problem": normalize_label(str(p)), "confidence": None}
                for p in verified_concerns
            ]
            # Use LLM-provided recommendations/analysis for frontend display
            rec_list = llm_response.get('recommendations', [])
            # Join recommendations into markdown text if it's a list
            if isinstance(rec_list, list):
                recommendations = "\n\n".join(f"- {r}" for r in rec_list)
            else:
                recommendations = llm_response.get('recommendations') or llm_response.get('analysis') or "No recommendations returned."
            llm_analysis_text = llm_response.get('analysis', '')
        else:
            # Fallback: if LLM fails, keep using original YOLO-based recommendations
            print("⚠️ Verification LLM did not return valid JSON; falling back to YOLO-only recommendations")
            prompt = (
                f"Detected skin issues: {list(predicted)}. "
                f"Age: {age}, Gender: {gender}. "
                "Give personalized skincare advice with product recommendations."
            )
            print("🤖 Generating recommendations with Groq (fallback)...")
            recommendations = send_to_groq(prompt)
            verified_results_payload = results_payload
            llm_analysis_text = ""

        # Save analysis to Supabase if available
        if supabase and request.user_id and request.user_email:
            try:
                print("💾 Saving analysis to Supabase...")

                # Upload image to Supabase Storage (analysis-images) and get public URL
                public_image_url = None
                try:
                    # Ensure bucket exists (no-op if already present)
                    try:
                        supabase.storage.create_bucket('analysis-images')
                        print("✅ Created storage bucket 'analysis-images'")
                    except Exception:
                        pass

                    bucket = supabase.storage.from_('analysis-images')
                    dest_path = f"{request.user_id}/{unique_id}_{os.path.basename(image_path)}"
                    with open(image_path, 'rb') as f:
                        upload_res = bucket.upload(dest_path, f)
                    public_image_url = bucket.get_public_url(dest_path)
                    print(f"✅ Uploaded image to storage: {public_image_url}")
                except Exception as e:
                    print(f"⚠️ Supabase storage upload failed: {e}")
                    # fallback to local served path
                    public_image_url = request.url_root.rstrip('/') + stored_image_url if stored_image_url else None

                data_to_insert = {
                    "user_id": request.user_id,
                    "email": request.user_email,
                    "age": int(age) if age else None,
                    "gender": gender or "Not specified",
                    # Keep original YOLO detections for debugging and research
                    "detected_issues": [f"{issue}|{confidence}" for issue, confidence in detection_dict.items()],
                    # Store LLM-provided recommendations (may be markdown or text)
                    "recommendations": recommendations,
                    # Do not overwrite detected_issues with verified concerns; keep YOLO outputs
                    "image_url": public_image_url,
                    "created_at": datetime.utcnow().isoformat()
                }

                result = supabase.table("skin_analyses").insert(data_to_insert).execute()
                print("✅ Analysis saved successfully")
            except Exception as e:
                print(f"❌ Supabase insert failed: {e}")

        print("✅ Analysis complete!")
        return jsonify({
            "results": results_payload,               # raw YOLO results (for debugging)
            "verified_results": verified_results_payload,  # LLM-verified concerns (preferred by frontend)
            "predicted_problems": list(predicted),
            "recommendations": recommendations,
            "llm_analysis": llm_analysis_text
        })

    except Exception as e:
        print(f"❌ UPLOAD ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"AI processing failed: {str(e)}"}), 500

# -------------------------------------------------
# HISTORY ENDPOINT
# -------------------------------------------------
@app.route("/api/history", methods=["GET"])
@token_required
def get_history():
    """Retrieve user's analysis history from Supabase"""
    try:
        if not supabase:
            return jsonify({"error": "Supabase not available"}), 503
        
        # Get current user's history, ordered by creation date (newest first)
        result = supabase.table("skin_analyses") \
            .select("*") \
            .eq("user_id", request.user_id) \
            .order("created_at", desc=True) \
            .limit(50) \
            .execute()
        
        history = result.data or []
        for item in history:
            image_url = item.get("image_url")
            if image_url and isinstance(image_url, str) and image_url.startswith("/uploads/"):
                item["image_url"] = request.url_root.rstrip("/") + image_url
            if item.get("detected_issues") and isinstance(item["detected_issues"], list):
                item["detected_issues"] = [str(x) for x in item["detected_issues"]]

        return jsonify(history), 200
    except Exception as e:
        print(f"❌ HISTORY ERROR: {e}")
        return jsonify({"error": f"Failed to retrieve history: {str(e)}"}), 500


@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    """Serve locally saved uploaded images for history thumbnails."""
    return send_from_directory(UPLOAD_FOLDER, filename)

# -------------------------------------------------
# DEBUG ENDPOINT
# -------------------------------------------------
@app.route("/api/debug", methods=["GET"])
def debug():
    return jsonify({
        "status": "debug",
        "groq_api_key_set": bool(os.environ.get("GROQ_API_KEY")),
        "gemini_api_key_set": bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API")),
        "model_exists": os.path.exists(MODEL_PATH),
        "upload_folder_exists": os.path.isdir(UPLOAD_FOLDER)
    })

# -------------------------------------------------
# RENDER ENTRY
# -------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    print(f"🚀 Starting Flask server on port {port}...")
    print(f"📍 Environment: {'Production' if not os.environ.get('FLASK_ENV') == 'development' else 'Development'}")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)