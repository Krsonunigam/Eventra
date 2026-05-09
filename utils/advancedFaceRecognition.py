"""
FAST MODE - Cloudinary URL Based Face System
No local storage, no training, simple processing
"""

import cv2
import numpy as np
import base64
import json
import logging
import requests
from PIL import Image
import io
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedFaceRecognition:
    def __init__(self):
        logger.info("🚀 Fast Face System Initialized (Cloudinary Mode)")

        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

    # ✅ NEW UNIVERSAL IMAGE LOADER
    def load_image(self, image_data):
        try:
            # 👉 If URL (Cloudinary)
            if image_data.startswith("http"):
                resp = requests.get(image_data)
                arr = np.asarray(bytearray(resp.content), dtype=np.uint8)
                return cv2.imdecode(arr, cv2.IMREAD_COLOR)

            # 👉 If base64
            if image_data.startswith("data:image"):
                image_data = image_data.split(",")[1]

            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))

            if image.mode != "RGB":
                image = image.convert("RGB")

            return np.array(image)

        except Exception as e:
            raise Exception(f"Error loading image: {str(e)}")

    # ✅ FACE DETECTION
    def detect_face(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )

        return faces

    # ✅ COLLECT FACE SAMPLES (NO STORAGE)
    def collect_face_samples(self, user_id, face_data_list):
        try:
            logger.info(f"Collecting face samples for user {user_id}")

            valid_faces = 0

            for i, face_data in enumerate(face_data_list):
                try:
                    image = self.load_image(face_data)

                    faces = self.detect_face(image)

                    if len(faces) > 0:
                        valid_faces += 1
                        logger.info(f"✅ Face detected in sample {i+1}")
                    else:
                        logger.warning(f"❌ No face in sample {i+1}")

                except Exception as e:
                    logger.error(f"Error processing sample {i+1}: {e}")

            if valid_faces < 5:
                return {
                    "success": False,
                    "message": "Not enough valid face samples"
                }

            return {
                "success": True,
                "message": f"{valid_faces} valid face samples detected",
                "sampleCount": valid_faces
            }

        except Exception as e:
            return {
                "success": False,
                "message": str(e)
            }

    # ❌ NO TRAINING (FAST MODE)
    def train_recognizer(self):
        return {
            "success": True,
            "message": "Training skipped (Fast mode)"
        }

    # ✅ MOCK RECOGNITION
    def recognize_face(self, face_data):
        try:
            image = self.load_image(face_data)

            faces = self.detect_face(image)

            if len(faces) == 0:
                return {
                    "success": False,
                    "message": "No face detected"
                }

            return {
                "success": True,
                "user_id": "mock_user",
                "confidence": 85,
                "message": "Face detected (mock recognition)"
            }

        except Exception as e:
            return {
                "success": False,
                "message": str(e)
            }

    # ✅ MOCK VERIFY
    def verify_face(self, face_data, user_id):
        try:
            image = self.load_image(face_data)

            faces = self.detect_face(image)

            if len(faces) == 0:
                return {
                    "success": False,
                    "isMatch": False,
                    "confidence": 0,
                    "message": "No face detected"
                }

            return {
                "success": True,
                "isMatch": True,
                "confidence": 90,
                "message": f"Face verified for user {user_id} (mock)"
            }

        except Exception as e:
            return {
                "success": False,
                "isMatch": False,
                "confidence": 0,
                "message": str(e)
            }


# ✅ GLOBAL INSTANCE
face_recognition_service = AdvancedFaceRecognition()


# ✅ EXPORT FUNCTIONS (IMPORTANT FOR NODE)
def collect_face_samples(user_id, face_data_list):
    return face_recognition_service.collect_face_samples(user_id, face_data_list)

def train_recognizer():
    return face_recognition_service.train_recognizer()

def recognize_face(face_data):
    return face_recognition_service.recognize_face(face_data)

def verify_face(face_data, user_id):
    return face_recognition_service.verify_face(face_data, user_id)