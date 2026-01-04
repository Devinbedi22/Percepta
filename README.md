# Percepta AI - Hackathon Edition

Percepta AI is an innovative project built for hackathons that leverages the power of the YOLO model from the [`ultralytics`](https://github.com/ultralytics/ultralytics) library to perform real-time object detection, segmentation, pose estimation, and image classification.

## Overview

During hackathons, rapid prototyping and creative ideas are key. Percepta AI aims to provide a rapid and robust solution for computer vision tasks. Whether you're looking to create interactive demos or solve real-world problems using AI, this project provides an excellent starting point.

## Features

- **Object Detection:** Identify objects in images.
- **Segmentation:** Separate objects from the background.
- **Pose Estimation:** Detect and analyze human poses.
- **Classification:** Classify images using YOLO.

## Setup

1. **Clone the repository:**

   ```sh
   git clone <repository-url>
   cd Percepta-ai
   ```

2. Install the required dependencies:
    ```sh
    pip install ultralytics
    ```

3. Place your YOLO model weights in the [weights](http://_vscodecontentref_/0) directory. Ensure the weights file is named [best.pt](http://_vscodecontentref_/1).

## Usage

To run the inference on a list of images, execute the [main.py](http://_vscodecontentref_/2) script:

```sh
python weights/main.py
