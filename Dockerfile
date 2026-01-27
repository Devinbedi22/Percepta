FROM python:3.11-slim

WORKDIR /app

# System dependencies for OpenCV / YOLO
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy entire project
COPY . .

# Upgrade pip
RUN pip install --upgrade pip

# Install torch separately (CPU-only)
RUN pip install torch torchvision --extra-index-url https://download.pytorch.org/whl/cpu

# Install remaining Python deps
RUN pip install -r weights/requirements.txt

# Expose Flask port
EXPOSE 7860

# Start Flask app
CMD ["python", "weights/app.py"]
