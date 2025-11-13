#!/usr/bin/env python3
"""
Migrate existing face data to the new working face recognition system
"""

import os
import json
import base64
import cv2
import numpy as np
from PIL import Image
import io

def migrate_face_data():
    """Migrate face data from old system to new system"""
    
    print("🔄 Migrating Face Data...")
    print("=" * 50)
    
    # Check if old face data exists
    old_dataset_path = "face_recognition_data/dataset"
    new_users_file = "face_data/users.json"
    
    if not os.path.exists(old_dataset_path):
        print("❌ No old face data found to migrate")
        return
    
    # Load existing users
    users = {}
    if os.path.exists(new_users_file):
        with open(new_users_file, 'r') as f:
            users = json.load(f)
    
    # Find all user directories
    user_dirs = [d for d in os.listdir(old_dataset_path) if d.startswith('user_')]
    
    print(f"📁 Found {len(user_dirs)} users with face data")
    
    migrated_count = 0
    
    for user_dir in user_dirs:
        user_id = user_dir.replace('user_', '')
        user_path = os.path.join(old_dataset_path, user_dir)
        
        # Find all sample images for this user
        sample_files = [f for f in os.listdir(user_path) if f.endswith('.jpg')]
        
        if len(sample_files) < 3:
            print(f"⚠️  User {user_id}: Only {len(sample_files)} samples (need at least 3)")
            continue
        
        print(f"👤 Migrating user {user_id} with {len(sample_files)} samples...")
        
        # Initialize user in new system
        if user_id not in users:
            users[user_id] = {
                'id': user_id,
                'name': f"User {user_id}",
                'samples': 0,
                'created_at': '2025-01-27T00:00:00.000000',
                'last_training': None,
                'face_features': []
            }
        
        # Process each sample
        for sample_file in sample_files:
            sample_path = os.path.join(user_path, sample_file)
            
            try:
                # Load and process image
                with open(sample_path, 'rb') as f:
                    image_data = f.read()
                
                # Convert to base64
                image_base64 = base64.b64encode(image_data).decode('utf-8')
                image_data_url = f"data:image/jpeg;base64,{image_base64}"
                
                # Detect face and extract features
                face_roi, error = detect_face_in_image(image_data)
                if error:
                    print(f"   ⚠️  {sample_file}: {error}")
                    continue
                
                features, error = calculate_face_features(face_roi)
                if error:
                    print(f"   ⚠️  {sample_file}: {error}")
                    continue
                
                # Add to user's features
                users[user_id]['face_features'].append(features)
                users[user_id]['samples'] = len(users[user_id]['face_features'])
                
                print(f"   ✅ {sample_file}: Face features extracted")
                
            except Exception as e:
                print(f"   ❌ {sample_file}: Error - {e}")
                continue
        
        # Mark as trained if enough samples
        if len(users[user_id]['face_features']) >= 3:
            users[user_id]['trained'] = True
            users[user_id]['last_training'] = '2025-01-27T00:00:00.000000'
            migrated_count += 1
            print(f"   🎉 User {user_id}: Migrated and trained ({len(users[user_id]['face_features'])} samples)")
        else:
            print(f"   ⚠️  User {user_id}: Not enough valid samples for training")
    
    # Save migrated data
    os.makedirs('face_data', exist_ok=True)
    with open(new_users_file, 'w') as f:
        json.dump(users, f, indent=2)
    
    print()
    print(f"🎉 Migration Complete!")
    print(f"   Migrated: {migrated_count} users")
    print(f"   Total users: {len(users)}")
    print(f"   Data saved to: {new_users_file}")

def detect_face_in_image(image_data):
    """Detect face in image data"""
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_array = np.array(image)
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        
        # Load face cascade
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Detect faces
        faces = face_cascade.detectMultiScale(
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
        return None, str(e)

def calculate_face_features(face_roi):
    """Calculate face features"""
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
        return None, str(e)

if __name__ == "__main__":
    migrate_face_data()

