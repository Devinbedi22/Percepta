from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import requests
from PIL import Image
from io import BytesIO
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# -------- GROQ CLIENT --------
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

# -------- LOAD YOLO MODEL --------
try:
    model = YOLO("best.pt")
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    model = None

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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

# -------- GROQ HELPER --------
def send_to_groq(prompt):
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
    return {"status": "Backend running"}

# -------- MAIN API --------
@app.route("/upload", methods=["POST"])
def upload():
    try:
        image = request.files.get("image")
        image_url = request.form.get("imageURL")
        age = request.form.get("age")
        gender = request.form.get("gender")

        image_path = None

        if image:
            image_path = os.path.join(UPLOAD_FOLDER, image.filename)
            image.save(image_path)

        elif image_url:
            response = requests.get(image_url)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            image_path = os.path.join(UPLOAD_FOLDER, "downloaded.jpg")
            img.save(image_path)

        else:
            return jsonify({"error": "No image provided"}), 400

        if not model:
            return jsonify({"error": "YOLO model not loaded"}), 500

        results = model(image_path)

        all_results = []
        predicted_problems = []

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

        predicted_problems = list(set(predicted_problems))

        prompt = (
            f"Predicted skin issues: {predicted_problems}. "
            f"Age: {age}, Gender: {gender}. "
            "Provide medication suggestions and a daily skincare routine. "
            "Sound natural and human. Mention this is experimental advice."
        )

        recommendations = send_to_groq(prompt)

        return jsonify({
            "results": all_results,
            "predicted_problems": predicted_problems,
            "recommendations": recommendations
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------- RENDER ENTRY POINT --------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
