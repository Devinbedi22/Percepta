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
CORS(app)  # Enable CORS for all routes

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

# Load the YOLO model (make sure "best.pt" exists and is valid)
try:
    model = YOLO("best.pt")
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    model = None

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Your classes mapping
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

def send_to_groq(prompt):
    """Sends a prompt to the GROQ API and returns the recommendations."""
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
        )
        return chat_completion.choices[0].message.content

    except requests.RequestException as e:
        print(f"Error sending to GROQ API: {e}")
        return None

@app.route("/")
def home():
    return "Hello, Bro!"

@app.route("/upload", methods=["POST"])
def upload():
    try:
        # Get image file or URL
        image = request.files.get("image")
        image_url = request.form.get("imageURL")
        image_path = None
        age = request.form.get("age")
        gender = request.form.get("gender")

        if image:
            image_path = os.path.join(UPLOAD_FOLDER, image.filename)
            image.save(image_path)
        elif image_url:
            try:
                response = requests.get(image_url)
                response.raise_for_status()  # Check for HTTP errors
                image = Image.open(BytesIO(response.content))
                image_path = os.path.join(UPLOAD_FOLDER, "downloaded.jpg")
                image.save(image_path)
            except Exception as e:
                return jsonify({"error": f"Failed to fetch image from URL: {e}"}), 400
        else:
            return jsonify({"error": "No image provided"}), 400
        
        if not model:
            return jsonify({"error": "YOLO model failed to load"}), 500

        # Run YOLO inference
        try:
            results = model(image_path)
        except Exception as e:
            return jsonify({"error": f"YOLO inference failed: {e}"}), 500

        all_results = []         # To hold detailed bounding box results
        predicted_problems = []  # To hold the predicted problems from each box

        # Process each result returned by YOLO
        for result in results:
            boxes = result.boxes
            xyxy = boxes.xyxy.cpu().numpy() if hasattr(boxes.xyxy, "cpu") else boxes.xyxy
            conf = boxes.conf.cpu().numpy() if hasattr(boxes.conf, "cpu") else boxes.conf
            cls = boxes.cls.cpu().numpy() if hasattr(boxes.cls, "cpu") else boxes.cls

            # Iterate over each detected box
            for i in range(len(xyxy)):
                class_index = int(cls[i])
                # Get the human-readable problem from the class mapping
                predicted_label = class_names.get(class_index, "unknown")
                coordinates = {
                    "x1": float(xyxy[i][0]),
                    "y1": float(xyxy[i][1]),
                    "x2": float(xyxy[i][2]),
                    "y2": float(xyxy[i][3]),
                    "confidence": float(conf[i]),
                    "class": class_index,
                    "problem": predicted_label
                }
                all_results.append(coordinates)
                predicted_problems.append(predicted_label)

        # Remove duplicate problems (if the same issue is detected multiple times)
        predicted_problems = list(set(predicted_problems))
        # Craft a prompt for the GROQ API with the predicted problems
        prompt = (
            f"Based on the following predicted skin issues and the discription of the user: {predicted_problems},User's : Age {age} Gender {gender} "
            "please provide recommended medication and a daily routine to follow for these conditions. "
            "Include detailed steps and suggestions. (Note: This is experimental advice and not a substitute for professional medical guidance.)"
            "Be more human like dont use works like user, assist, that feels more robotic"
        )

        groq_response = send_to_groq(prompt)
        if groq_response is None:
            groq_response = {"error": "Failed to get recommendations from the GROQ API."}

        # Return the YOLO results, predicted problems, and recommendations from GROQ
        return jsonify({
            "results": all_results,
            "predicted_problems": predicted_problems,
            "recommendations": groq_response
        })

    except Exception as e:
        return jsonify({"error": f"Unexpected server error: {e}"}), 500

if __name__ == "__main__":
    app.run(debug=True)
