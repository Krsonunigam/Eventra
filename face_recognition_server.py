#!/usr/bin/env python3
"""
Local Face Recognition Server using face_recognition library
This provides a complete local face recognition system with dlib backend
"""

import os
import json
import base64
import numpy as np
import face_recognition
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
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

class FaceRecognitionSystem:
    def __init__(self):
        self.face_encodings = {}
        self.users = {}
        self.load_data()
    
    def load_data(self):
        """Load existing face encodings and user data"""
        try:
            if os.path.exists(ENCODINGS_FILE):
                with open(ENCODINGS_FILE, 'rb') as f:
                    self.face_encodings = pickle.load(f)
                logger.info(f"Loaded {len(self.face_encodings)} face encodings")
            
            if os.path.exists(USERS_FILE):
                with open(USERS_FILE, 'r') as f:
                    self.users = json.load(f)
                logger.info(f"Loaded {len(self.users)} users")
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            self.face_encodings = {}
            self.users = {}
    
    def save_data(self):
        """Save face encodings and user data"""
        try:
            with open(ENCODINGS_FILE, 'wb') as f:
                pickle.dump(self.face_encodings, f)
            
            with open(USERS_FILE, 'w') as f:
                json.dump(self.users, f, indent=2)
            
            logger.info("Data saved successfully")
        except Exception as e:
            logger.error(f"Error saving data: {e}")
    
    def process_image(self, image_data):
        """Process image and extract face encodings"""
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
            
            # Find face locations
            face_locations = face_recognition.face_locations(image_array)
            
            if not face_locations:
                return None, "No face detected"
            
            # Get face encodings
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            
            if not face_encodings:
                return None, "Could not extract face encoding"
            
            return face_encodings[0], None
            
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return None, str(e)
    
    def add_face_sample(self, user_id, image_data):
        """Add a face sample for a user"""
        try:
            face_encoding, error = self.process_image(image_data)
            if error:
                return False, error
            
            if user_id not in self.face_encodings:
                self.face_encodings[user_id] = []
                self.users[user_id] = {
                    'id': user_id,
                    'name': f"User {user_id}",
                    'samples': 0,
                    'created_at': datetime.now().isoformat(),
                    'last_training': None
                }
            
            self.face_encodings[user_id].append(face_encoding)
            self.users[user_id]['samples'] = len(self.face_encodings[user_id])
            self.users[user_id]['last_training'] = datetime.now().isoformat()
            
            self.save_data()
            return True, f"Face sample added. Total samples: {len(self.face_encodings[user_id])}"
            
        except Exception as e:
            logger.error(f"Error adding face sample: {e}")
            return False, str(e)
    
    def train_user(self, user_id):
        """Train the face recognition model for a user"""
        try:
            if user_id not in self.face_encodings or len(self.face_encodings[user_id]) < 3:
                return False, "Not enough face samples. Need at least 3 samples."
            
            # Calculate average encoding
            encodings = np.array(self.face_encodings[user_id])
            avg_encoding = np.mean(encodings, axis=0)
            
            # Store the average encoding
            self.face_encodings[user_id] = [avg_encoding]
            self.users[user_id]['trained'] = True
            self.users[user_id]['last_training'] = datetime.now().isoformat()
            
            self.save_data()
            return True, "Face model trained successfully"
            
        except Exception as e:
            logger.error(f"Error training user: {e}")
            return False, str(e)
    
    def verify_face(self, image_data, user_id=None):
        """Verify a face against stored encodings"""
        try:
            face_encoding, error = self.process_image(image_data)
            if error:
                return False, error, None
            
            if user_id:
                # Verify against specific user
                if user_id not in self.face_encodings:
                    return False, "User not found", None
                
                stored_encodings = self.face_encodings[user_id]
                if not stored_encodings:
                    return False, "No face data for user", None
                
                # Calculate distances
                distances = face_recognition.face_distance(stored_encodings, face_encoding)
                min_distance = np.min(distances)
                
                # Threshold for face recognition (lower is more strict)
                threshold = 0.6
                
                if min_distance <= threshold:
                    confidence = (1 - min_distance) * 100
                    return True, f"Face verified with {confidence:.1f}% confidence", confidence
                else:
                    return False, "Face not recognized", min_distance
            else:
                # Find best match among all users
                best_match = None
                best_distance = float('inf')
                
                for uid, encodings in self.face_encodings.items():
                    if not encodings:
                        continue
                    
                    distances = face_recognition.face_distance(encodings, face_encoding)
                    min_dist = np.min(distances)
                    
                    if min_dist < best_distance:
                        best_distance = min_dist
                        best_match = uid
                
                threshold = 0.6
                if best_match and best_distance <= threshold:
                    confidence = (1 - best_distance) * 100
                    return True, f"Face verified as {best_match} with {confidence:.1f}% confidence", {
                        'user_id': best_match,
                        'confidence': confidence
                    }
                else:
                    return False, "Face not recognized", None
                    
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
            'has_data': user_id in self.face_encodings and len(self.face_encodings[user_id]) > 0,
            'samples': user_data.get('samples', 0),
            'trained': user_data.get('trained', False),
            'last_training': user_data.get('last_training'),
            'name': user_data.get('name', f"User {user_id}")
        }
    
    def clear_user_data(self, user_id):
        """Clear all face data for a user"""
        try:
            if user_id in self.face_encodings:
                del self.face_encodings[user_id]
            
            if user_id in self.users:
                del self.users[user_id]
            
            self.save_data()
            return True, "User data cleared successfully"
        except Exception as e:
            logger.error(f"Error clearing user data: {e}")
            return False, str(e)

# Initialize the face recognition system
face_system = FaceRecognitionSystem()

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
        user_id = data.get('user_id')  # Optional: verify against specific user
        
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
        'message': 'Face recognition server is running',
        'users_count': len(face_system.users),
        'encodings_count': len(face_system.face_encodings)
    })

if __name__ == '__main__':
    print("Starting Face Recognition Server...")
    print("Using face_recognition library with dlib backend")
    print("Server will be available at http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
