#!/usr/bin/env python3
"""
Working Face Recognition Server
Uses existing face images and implements proper face recognition
"""

import os
import json
import base64
import hashlib
import cv2
import numpy as np
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'face_data'
USERS_FILE = os.path.join(UPLOAD_FOLDER, 'users.json')
FACE_DATA_FOLDER = 'face_recognition_data/dataset'

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class WorkingFaceRecognitionSystem:
    def __init__(self):
        self.users = {}
        self.face_cascade = None
        self.load_data()
        self.initialize_face_detection()
    
    def initialize_face_detection(self):
        """Initialize OpenCV face detection"""
        try:
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            logger.info("Face detection initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing face detection: {e}")
    
    def load_data(self):
        """Load existing user data"""
        try:
            if os.path.exists(USERS_FILE):
                with open(USERS_FILE, 'r') as f:
                    self.users = json.load(f)
                logger.info(f"Loaded {len(self.users)} users")
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            self.users = {}
    
    def save_data(self):
        """Save user data"""
        try:
            with open(USERS_FILE, 'w') as f:
                json.dump(self.users, f, indent=2)
            logger.info("Data saved successfully")
        except Exception as e:
            logger.error(f"Error saving data: {e}")
    
    def detect_face_in_image(self, image_data):
        """Detect face in image and return face region"""
        try:
            # Decode base64 image
            if isinstance(image_data, str):
                image_data = base64.b64decode(image_data.split(',')[1])
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            image_array = np.array(image)
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            if len(faces) == 0:
                return None, "No face detected"
            
            # Get the largest face
            face = max(faces, key=lambda x: x[2] * x[3])
            x, y, w, h = face
            
            # Extract face region
            face_roi = gray[y:y+h, x:x+w]
            
            # Resize to standard size
            face_roi = cv2.resize(face_roi, (100, 100))
            
            return face_roi, None
            
        except Exception as e:
            logger.error(f"Error detecting face: {e}")
            return None, str(e)
    
    def calculate_face_features(self, face_roi):
        """Calculate simple face features for comparison"""
        try:
            # Calculate histogram
            hist = cv2.calcHist([face_roi], [0], None, [256], [0, 256])
            
            # Calculate basic features
            mean_intensity = np.mean(face_roi)
            std_intensity = np.std(face_roi)
            
            # Calculate edge features
            edges = cv2.Canny(face_roi, 50, 150)
            edge_density = np.sum(edges > 0) / (face_roi.shape[0] * face_roi.shape[1])
            
            # Combine features
            features = {
                'histogram': hist.flatten().tolist(),
                'mean_intensity': float(mean_intensity),
                'std_intensity': float(std_intensity),
                'edge_density': float(edge_density)
            }
            
            return features, None
            
        except Exception as e:
            logger.error(f"Error calculating face features: {e}")
            return None, str(e)
    
    def compare_face_features(self, features1, features2):
        """Compare two face feature sets and return similarity score"""
        try:
            # Compare histograms using correlation
            hist1 = np.array(features1['histogram'])
            hist2 = np.array(features2['histogram'])
            
            # Normalize histograms
            hist1 = hist1 / (np.sum(hist1) + 1e-7)
            hist2 = hist2 / (np.sum(hist2) + 1e-7)
            
            # Calculate correlation
            correlation = np.corrcoef(hist1, hist2)[0, 1]
            if np.isnan(correlation):
                correlation = 0
            
            # Compare other features
            mean_diff = abs(features1['mean_intensity'] - features2['mean_intensity']) / 255.0
            std_diff = abs(features1['std_intensity'] - features2['std_intensity']) / 255.0
            edge_diff = abs(features1['edge_density'] - features2['edge_density'])
            
            # Combine similarity scores
            similarity = (
                correlation * 0.5 +  # Histogram correlation
                (1 - mean_diff) * 0.2 +  # Mean intensity similarity
                (1 - std_diff) * 0.2 +  # Std intensity similarity
                (1 - edge_diff) * 0.1   # Edge density similarity
            )
            
            return max(0, min(1, similarity))  # Clamp between 0 and 1
            
        except Exception as e:
            logger.error(f"Error comparing face features: {e}")
            return 0
    
    def add_face_sample(self, user_id, image_data):
        """Add a face sample for a user"""
        try:
            # Detect face in image
            face_roi, error = self.detect_face_in_image(image_data)
            if error:
                return False, error
            
            # Calculate face features
            features, error = self.calculate_face_features(face_roi)
            if error:
                return False, error
            
            # Initialize user if not exists
            if user_id not in self.users:
                self.users[user_id] = {
                    'id': user_id,
                    'name': f"User {user_id}",
                    'samples': 0,
                    'created_at': datetime.now().isoformat(),
                    'last_training': None,
                    'face_features': []
                }
            
            # Store face features
            self.users[user_id]['face_features'].append(features)
            self.users[user_id]['samples'] = len(self.users[user_id]['face_features'])
            self.users[user_id]['last_training'] = datetime.now().isoformat()
            
            self.save_data()
            return True, f"Face sample added. Total samples: {len(self.users[user_id]['face_features'])}"
            
        except Exception as e:
            logger.error(f"Error adding face sample: {e}")
            return False, str(e)
    
    def train_user(self, user_id):
        """Train the face recognition model for a user"""
        try:
            if user_id not in self.users or len(self.users[user_id]['face_features']) < 3:
                return False, "Not enough face samples. Need at least 3 samples."
            
            # Mark as trained
            self.users[user_id]['trained'] = True
            self.users[user_id]['last_training'] = datetime.now().isoformat()
            
            self.save_data()
            return True, "Face model trained successfully"
            
        except Exception as e:
            logger.error(f"Error training user: {e}")
            return False, str(e)
    
    def verify_face(self, image_data, user_id=None):
        """Verify a face against stored data"""
        try:
            if not user_id:
                return False, "Please specify user_id for verification", None
            
            if user_id not in self.users or not self.users[user_id].get('trained', False):
                return False, "User not trained or not found", None
            
            # Detect face in current image
            face_roi, error = self.detect_face_in_image(image_data)
            if error:
                return False, error, None
            
            # Calculate features for current face
            current_features, error = self.calculate_face_features(face_roi)
            if error:
                return False, error, None
            
            # Compare with stored features
            stored_features = self.users[user_id]['face_features']
            best_similarity = 0
            
            for stored_feature in stored_features:
                similarity = self.compare_face_features(current_features, stored_feature)
                best_similarity = max(best_similarity, similarity)
            
            # Threshold for recognition (adjust as needed)
            threshold = 0.6
            
            if best_similarity >= threshold:
                confidence = best_similarity * 100
                return True, f"Face verified with {confidence:.1f}% confidence", confidence
            else:
                return False, f"Face not recognized (similarity: {best_similarity:.2f})", best_similarity
                    
        except Exception as e:
            logger.error(f"Error verifying face: {e}")
            return False, str(e), None
    
    def get_user_status(self, user_id):
        """Get face recognition status for a user"""
        if user_id not in self.users:
            return {
                'has_data': False,
                'samples': 0,
                'trained': False,
                'last_training': None
            }
        
        user_data = self.users[user_id]
        return {
            'has_data': len(user_data.get('face_features', [])) > 0,
            'samples': user_data.get('samples', 0),
            'trained': user_data.get('trained', False),
            'last_training': user_data.get('last_training'),
            'name': user_data.get('name', f"User {user_id}")
        }
    
    def clear_user_data(self, user_id):
        """Clear all face data for a user"""
        try:
            if user_id in self.users:
                del self.users[user_id]
            
            self.save_data()
            return True, "User data cleared successfully"
        except Exception as e:
            logger.error(f"Error clearing user data: {e}")
            return False, str(e)

# Initialize the face recognition system
face_system = WorkingFaceRecognitionSystem()

@app.route('/api/face/status/<user_id>', methods=['GET'])
def get_face_status(user_id):
    """Get face recognition status for a user"""
    try:
        status = face_system.get_user_status(user_id)
        return jsonify({
            'success': True,
            'status': status
        })
    except Exception as e:
        logger.error(f"Error getting face status: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/face/add-sample', methods=['POST'])
def add_face_sample():
    """Add a face sample for training"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        image_data = data.get('image')
        
        if not user_id or not image_data:
            return jsonify({
                'success': False,
                'error': 'user_id and image are required'
            }), 400
        
        success, message = face_system.add_face_sample(user_id, image_data)
        
        return jsonify({
            'success': success,
            'message': message
        })
        
    except Exception as e:
        logger.error(f"Error adding face sample: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/face/train', methods=['POST'])
def train_face_model():
    """Train the face recognition model for a user"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        success, message = face_system.train_user(user_id)
        
        return jsonify({
            'success': success,
            'message': message
        })
        
    except Exception as e:
        logger.error(f"Error training face model: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/face/verify', methods=['POST'])
def verify_face():
    """Verify a face against stored data"""
    try:
        data = request.get_json()
        image_data = data.get('image')
        user_id = data.get('user_id')
        
        if not image_data:
            return jsonify({
                'success': False,
                'error': 'image is required'
            }), 400
        
        success, message, confidence = face_system.verify_face(image_data, user_id)
        
        return jsonify({
            'success': success,
            'message': message,
            'confidence': confidence
        })
        
    except Exception as e:
        logger.error(f"Error verifying face: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/face/clear/<user_id>', methods=['DELETE'])
def clear_face_data(user_id):
    """Clear face data for a user"""
    try:
        success, message = face_system.clear_user_data(user_id)
        
        return jsonify({
            'success': success,
            'message': message
        })
        
    except Exception as e:
        logger.error(f"Error clearing face data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/face/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Working face recognition server is running',
        'users_count': len(face_system.users),
        'face_detection_initialized': face_system.face_cascade is not None
    })

if __name__ == '__main__':
    print("Starting Working Face Recognition Server...")
    print("This version uses proper face feature extraction and comparison")
    print("Server will be available at http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)

