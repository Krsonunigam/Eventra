#!/usr/bin/env python3
"""
Simple Face Recognition Server using OpenCV
This provides a lightweight face recognition system without dlib dependencies
"""

import os
import json
import base64
import numpy as np
import cv2
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import pickle
import hashlib
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'face_data'
ENCODINGS_FILE = os.path.join(UPLOAD_FOLDER, 'face_encodings.pkl')
USERS_FILE = os.path.join(UPLOAD_FOLDER, 'users.json')

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class SimpleFaceRecognitionSystem:
    def __init__(self):
        self.face_encodings = {}
        self.users = {}
        self.face_cascade = None
        self.recognizer = None
        self.load_data()
        self.initialize_recognizer()
    
    def initialize_recognizer(self):
        """Initialize OpenCV face recognizer"""
        try:
            # Load Haar cascade for face detection
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            
            # Initialize LBPH face recognizer
            self.recognizer = cv2.face.LBPHFaceRecognizer_create()
            
            logger.info("Face recognizer initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing recognizer: {e}")
    
    def load_data(self):
        """Load existing face encodings and user data"""
        try:
            if os.path.exists(USERS_FILE):
                with open(USERS_FILE, 'r') as f:
                    self.users = json.load(f)
                logger.info(f"Loaded {len(self.users)} users")
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            self.users = {}
    
    def save_data(self):
        """Save face encodings and user data"""
        try:
            with open(USERS_FILE, 'w') as f:
                json.dump(self.users, f, indent=2)
            logger.info("Data saved successfully")
        except Exception as e:
            logger.error(f"Error saving data: {e}")
    
    def process_image(self, image_data):
        """Process image and extract face features"""
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
            logger.error(f"Error processing image: {e}")
            return None, str(e)
    
    def add_face_sample(self, user_id, image_data):
        """Add a face sample for a user"""
        try:
            face_roi, error = self.process_image(image_data)
            if error:
                return False, error
            
            if user_id not in self.users:
                self.users[user_id] = {
                    'id': user_id,
                    'name': f"User {user_id}",
                    'samples': 0,
                    'created_at': datetime.now().isoformat(),
                    'last_training': None,
                    'face_images': []
                }
            
            # Store face image
            self.users[user_id]['face_images'].append(face_roi.tolist())
            self.users[user_id]['samples'] = len(self.users[user_id]['face_images'])
            self.users[user_id]['last_training'] = datetime.now().isoformat()
            
            self.save_data()
            return True, f"Face sample added. Total samples: {len(self.users[user_id]['face_images'])}"
            
        except Exception as e:
            logger.error(f"Error adding face sample: {e}")
            return False, str(e)
    
    def train_user(self, user_id):
        """Train the face recognition model for a user"""
        try:
            if user_id not in self.users or len(self.users[user_id]['face_images']) < 3:
                return False, "Not enough face samples. Need at least 3 samples."
            
            # Prepare training data
            faces = []
            labels = []
            
            for i, face_img in enumerate(self.users[user_id]['face_images']):
                face_array = np.array(face_img, dtype=np.uint8)
                faces.append(face_array)
                labels.append(0)  # All samples for same user have label 0
            
            # Train the recognizer
            self.recognizer.train(faces, np.array(labels))
            
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
            face_roi, error = self.process_image(image_data)
            if error:
                return False, error, None
            
            if user_id:
                # Verify against specific user
                if user_id not in self.users or not self.users[user_id].get('trained', False):
                    return False, "User not trained or not found", None
                
                # Predict the face
                label, confidence = self.recognizer.predict(face_roi)
                
                # Lower confidence means better match
                if confidence < 100:  # Threshold for recognition
                    confidence_percent = max(0, 100 - confidence)
                    return True, f"Face verified with {confidence_percent:.1f}% confidence", confidence_percent
                else:
                    return False, "Face not recognized", confidence
            else:
                # For now, just return that we need a specific user_id
                return False, "Please specify user_id for verification", None
                    
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
            'has_data': len(user_data.get('face_images', [])) > 0,
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
face_system = SimpleFaceRecognitionSystem()

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
        'message': 'Simple face recognition server is running',
        'users_count': len(face_system.users),
        'recognizer_initialized': face_system.recognizer is not None
    })

if __name__ == '__main__':
    print("Starting Simple Face Recognition Server...")
    print("Using OpenCV for face detection and recognition")
    print("Server will be available at http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
