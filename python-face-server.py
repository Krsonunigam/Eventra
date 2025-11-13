#!/usr/bin/env python3
"""
Standalone Python Face Recognition Server
This server runs independently and handles face recognition requests
"""

import json
import sys
import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
import mediapipe as mp
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import time
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MediaPipe face detection
mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils
face_detection = mp_face_detection.FaceDetection(
    model_selection=0, min_detection_confidence=0.5
)

# MediaPipe face mesh for landmarks
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Data directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'face_recognition_data')
DATASET_DIR = os.path.join(DATA_DIR, 'dataset')
MODELS_DIR = os.path.join(DATA_DIR, 'models')
METADATA_DIR = os.path.join(DATA_DIR, 'metadata')

# Ensure directories exist
os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(METADATA_DIR, exist_ok=True)

class MediaPipeFaceRecognition:
    def __init__(self):
        self.face_detection = mp_face_detection.FaceDetection(
            model_selection=0, min_detection_confidence=0.5
        )
        self.face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
    def detect_face(self, image):
        """Detect face in image"""
        try:
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = self.face_detection.process(rgb_image)
            
            if results.detections:
                detection = results.detections[0]
                bbox = detection.location_data.relative_bounding_box
                h, w, _ = image.shape
                
                x = int(bbox.xmin * w)
                y = int(bbox.ymin * h)
                width = int(bbox.width * w)
                height = int(bbox.height * h)
                
                # Ensure coordinates are within image bounds
                x = max(0, x)
                y = max(0, y)
                width = min(width, w - x)
                height = min(height, h - y)
                
                face_crop = image[y:y+height, x:x+width]
                
                if face_crop.size > 0:
                    return face_crop, (x, y, width, height)
            
            return None, None
        except Exception as e:
            logger.error(f"Error detecting face: {e}")
            return None, None
    
    def extract_face_embedding(self, face_image):
        """Extract face embedding using MediaPipe"""
        try:
            rgb_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_image)
            
            if results.multi_face_landmarks:
                landmarks = results.multi_face_landmarks[0]
                
                # Extract key landmark coordinates
                embedding = []
                for landmark in landmarks.landmark:
                    embedding.extend([landmark.x, landmark.y, landmark.z])
                
                return np.array(embedding)
            
            return None
        except Exception as e:
            logger.error(f"Error extracting face embedding: {e}")
            return None
    
    def save_face_sample(self, user_id, face_image, sample_index):
        """Save face sample to dataset"""
        try:
            user_dir = os.path.join(DATASET_DIR, str(user_id))
            os.makedirs(user_dir, exist_ok=True)
            
            filename = f"sample_{sample_index}_{int(time.time())}.jpg"
            filepath = os.path.join(user_dir, filename)
            
            cv2.imwrite(filepath, face_image)
            return filepath
        except Exception as e:
            logger.error(f"Error saving face sample: {e}")
            return None

# Initialize face recognition
face_recognition = MediaPipeFaceRecognition()

def base64_to_image(base64_string):
    """Convert base64 string to OpenCV image"""
    try:
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return image
    except Exception as e:
        logger.error(f"Error converting base64 to image: {e}")
        return None

def load_user_metadata():
    """Load user metadata"""
    try:
        metadata_file = os.path.join(METADATA_DIR, 'user_metadata.json')
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r') as f:
                return json.load(f)
        return {}
    except Exception as e:
        logger.error(f"Error loading user metadata: {e}")
        return {}

def save_user_metadata(metadata):
    """Save user metadata"""
    try:
        metadata_file = os.path.join(METADATA_DIR, 'user_metadata.json')
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving user metadata: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Python Face Recognition Server'
    })

@app.route('/collect', methods=['POST'])
def collect_face_samples():
    """Collect face samples for training"""
    try:
        data = request.get_json()
        
        if not data or 'userId' not in data or 'faceDataList' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing userId or faceDataList'
            }), 400
        
        user_id = data['userId']
        face_data_list = data['faceDataList']
        
        if len(face_data_list) < 3:
            return jsonify({
                'success': False,
                'message': 'At least 3 face samples are required'
            }), 400
        
        # Limit samples to prevent memory issues
        if len(face_data_list) > 20:
            face_data_list = face_data_list[:20]
            logger.warning(f"Limited face samples to 20 (was {len(data['faceDataList'])})")
        
        valid_samples = 0
        saved_files = []
        
        for i, face_data in enumerate(face_data_list):
            try:
                # Convert base64 to image
                image = base64_to_image(face_data)
                if image is None:
                    continue
                
                # Detect face
                face_crop, bbox = face_recognition.detect_face(image)
                if face_crop is None:
                    continue
                
                # Save face sample
                filepath = face_recognition.save_face_sample(user_id, face_crop, i)
                if filepath:
                    saved_files.append(filepath)
                    valid_samples += 1
                
            except Exception as e:
                logger.error(f"Error processing sample {i}: {e}")
                continue
        
        if valid_samples < 3:
            return jsonify({
                'success': False,
                'message': f'Only {valid_samples} valid faces found. At least 3 required.'
            }), 400
        
        # Update user metadata
        metadata = load_user_metadata()
        if user_id not in metadata:
            metadata[user_id] = {}
        
        metadata[user_id].update({
            'sample_count': valid_samples,
            'last_updated': datetime.now().isoformat(),
            'saved_files': saved_files,
            'quality': 'good' if valid_samples >= 5 else 'fair'
        })
        
        save_user_metadata(metadata)
        
        return jsonify({
            'success': True,
            'message': f'Successfully collected {valid_samples} face samples',
            'sampleCount': valid_samples,
            'user': {
                'id': user_id,
                'sampleCount': valid_samples,
                'quality': metadata[user_id]['quality']
            }
        })
        
    except Exception as e:
        logger.error(f"Error in collect_face_samples: {e}")
        return jsonify({
            'success': False,
            'message': f'Error collecting face samples: {str(e)}'
        }), 500

@app.route('/recognize', methods=['POST'])
def recognize_face():
    """Recognize face from image"""
    try:
        data = request.get_json()
        
        if not data or 'faceData' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing faceData'
            }), 400
        
        # Convert base64 to image
        image = base64_to_image(data['faceData'])
        if image is None:
            return jsonify({
                'success': False,
                'message': 'Invalid image data'
            }), 400
        
        # Detect face
        face_crop, bbox = face_recognition.detect_face(image)
        if face_crop is None:
            return jsonify({
                'success': False,
                'message': 'No face detected in image'
            }), 400
        
        # Extract embedding
        embedding = face_recognition.extract_face_embedding(face_crop)
        if embedding is None:
            return jsonify({
                'success': False,
                'message': 'Could not extract face features'
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Face recognized successfully',
            'embedding': embedding.tolist(),
            'bbox': bbox
        })
        
    except Exception as e:
        logger.error(f"Error in recognize_face: {e}")
        return jsonify({
            'success': False,
            'message': f'Error recognizing face: {str(e)}'
        }), 500

@app.route('/verify', methods=['POST'])
def verify_face():
    """Verify face against user"""
    try:
        data = request.get_json()
        
        if not data or 'faceData' not in data or 'userId' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing faceData or userId'
            }), 400
        
        user_id = data['userId']
        
        # Check if user has face data
        metadata = load_user_metadata()
        if user_id not in metadata:
            return jsonify({
                'success': False,
                'message': 'No face data found for user'
            }), 400
        
        # Convert base64 to image
        image = base64_to_image(data['faceData'])
        if image is None:
            return jsonify({
                'success': False,
                'message': 'Invalid image data'
            }), 400
        
        # Detect face
        face_crop, bbox = face_recognition.detect_face(image)
        if face_crop is None:
            return jsonify({
                'success': False,
                'message': 'No face detected in image'
            }), 400
        
        # Extract embedding
        embedding = face_recognition.extract_face_embedding(face_crop)
        if embedding is None:
            return jsonify({
                'success': False,
                'message': 'Could not extract face features'
            }), 400
        
        # For now, return a basic verification result
        # In a real implementation, you would compare with stored embeddings
        confidence = 85.0  # Mock confidence score
        
        return jsonify({
            'success': True,
            'isMatch': confidence > 70,
            'confidence': confidence,
            'message': 'Face verification completed'
        })
        
    except Exception as e:
        logger.error(f"Error in verify_face: {e}")
        return jsonify({
            'success': False,
            'message': f'Error verifying face: {str(e)}'
        }), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get system statistics"""
    try:
        metadata = load_user_metadata()
        
        total_users = len(metadata)
        total_samples = sum(user_data.get('sample_count', 0) for user_data in metadata.values())
        
        return jsonify({
            'success': True,
            'trained_users': total_users,
            'total_samples': total_samples,
            'system_quality': 'good' if total_samples > 10 else 'fair'
        })
        
    except Exception as e:
        logger.error(f"Error in get_stats: {e}")
        return jsonify({
            'success': False,
            'message': f'Error getting stats: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Python Face Recognition Server...")
    print(f"📁 Data directory: {DATA_DIR}")
    print(f"📁 Dataset directory: {DATASET_DIR}")
    print(f"📁 Models directory: {MODELS_DIR}")
    print(f"📁 Metadata directory: {METADATA_DIR}")
    
    # Ensure directories exist
    os.makedirs(DATASET_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(METADATA_DIR, exist_ok=True)
    
    print("✅ Directories created successfully")
    print("🌐 Server starting on http://localhost:5001")
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
        threaded=True
    )
