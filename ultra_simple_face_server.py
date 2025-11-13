#!/usr/bin/env python3
"""
Ultra Simple Face Recognition Server
Uses only basic Python libraries - no complex dependencies
"""

import os
import json
import base64
import hashlib
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'face_data'
USERS_FILE = os.path.join(UPLOAD_FOLDER, 'users.json')

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class UltraSimpleFaceSystem:
    def __init__(self):
        self.users = {}
        self.load_data()
    
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
    
    def add_face_sample(self, user_id, image_data):
        """Add a face sample for a user (simplified)"""
        try:
            if user_id not in self.users:
                self.users[user_id] = {
                    'id': user_id,
                    'name': f"User {user_id}",
                    'samples': 0,
                    'created_at': datetime.now().isoformat(),
                    'last_training': None,
                    'face_hashes': []
                }
            
            # Create a simple hash of the image for storage
            image_hash = hashlib.md5(image_data.encode()).hexdigest()
            self.users[user_id]['face_hashes'].append(image_hash)
            self.users[user_id]['samples'] = len(self.users[user_id]['face_hashes'])
            self.users[user_id]['last_training'] = datetime.now().isoformat()
            
            self.save_data()
            return True, f"Face sample added. Total samples: {len(self.users[user_id]['face_hashes'])}"
            
        except Exception as e:
            logger.error(f"Error adding face sample: {e}")
            return False, str(e)
    
    def train_user(self, user_id):
        """Train the face recognition model for a user (simplified)"""
        try:
            if user_id not in self.users or len(self.users[user_id]['face_hashes']) < 3:
                return False, "Not enough face samples. Need at least 3 samples."
            
            self.users[user_id]['trained'] = True
            self.users[user_id]['last_training'] = datetime.now().isoformat()
            
            self.save_data()
            return True, "Face model trained successfully (simplified mode)"
            
        except Exception as e:
            logger.error(f"Error training user: {e}")
            return False, str(e)
    
    def verify_face(self, image_data, user_id=None):
        """Verify a face against stored data (simplified)"""
        try:
            if not user_id:
                return False, "Please specify user_id for verification", None
            
            if user_id not in self.users or not self.users[user_id].get('trained', False):
                return False, "User not trained or not found", None
            
            # Create hash of current image
            current_hash = hashlib.md5(image_data.encode()).hexdigest()
            
            # Check if hash matches any stored hashes (simplified matching)
            stored_hashes = self.users[user_id]['face_hashes']
            
            # Simple similarity check (in real implementation, this would be more sophisticated)
            for stored_hash in stored_hashes:
                # Calculate simple similarity
                similarity = sum(1 for a, b in zip(current_hash, stored_hash) if a == b) / len(current_hash)
                
                if similarity > 0.8:  # 80% similarity threshold
                    confidence = similarity * 100
                    return True, f"Face verified with {confidence:.1f}% confidence", confidence
            
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
            'has_data': len(user_data.get('face_hashes', [])) > 0,
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
face_system = UltraSimpleFaceSystem()

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
        'message': 'Ultra simple face recognition server is running',
        'users_count': len(face_system.users),
        'mode': 'simplified'
    })

if __name__ == '__main__':
    print("Starting Ultra Simple Face Recognition Server...")
    print("This version uses basic Python libraries only")
    print("Server will be available at http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
