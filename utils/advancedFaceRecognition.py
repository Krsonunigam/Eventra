"""
Advanced Face Recognition System
Uses MediaPipe Face Detection + OpenCV LBPH for best accuracy and performance
Stores all data locally for optimal performance and privacy
"""

import cv2
import numpy as np
import base64
import json
import os
import pickle
from datetime import datetime
import sys
from PIL import Image, ImageEnhance
import io
import hashlib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    logger.warning("MediaPipe not available, falling back to OpenCV face detection")

class AdvancedFaceRecognition:
    def __init__(self):
        # Create necessary directories
        self.data_path = "face_recognition_data"
        self.dataset_path = os.path.join(self.data_path, "dataset")
        self.models_path = os.path.join(self.data_path, "models")
        self.metadata_path = os.path.join(self.data_path, "metadata")
        
        # Ensure directories exist
        for path in [self.data_path, self.dataset_path, self.models_path, self.metadata_path]:
            os.makedirs(path, exist_ok=True)
        
        # Initialize face detection
        self._init_face_detection()
        
        # Initialize face recognition
        self.recognizer = cv2.face.LBPHFaceRecognizer_create(
            radius=1, 
            neighbors=8, 
            grid_x=8, 
            grid_y=8, 
            threshold=80.0
        )
        
        # Load existing data
        self.user_mapping = {}  # internal_id -> user_id
        self.user_metadata = {}  # user_id -> metadata
        self.load_metadata()
        self.load_recognizer()
        
        logger.info(f"Advanced Face Recognition initialized with {len(self.user_mapping)} users")
    
    def _init_face_detection(self):
        """Initialize face detection with MediaPipe or OpenCV fallback"""
        if MEDIAPIPE_AVAILABLE:
            # Use MediaPipe for better face detection
            self.mp_face_detection = mp.solutions.face_detection
            self.mp_drawing = mp.solutions.drawing_utils
            self.face_detection = self.mp_face_detection.FaceDetection(
                model_selection=1,  # Use full range model
                min_detection_confidence=0.7
            )
            self.use_mediapipe = True
            logger.info("Using MediaPipe for face detection")
        else:
            # Fallback to OpenCV
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            self.use_mediapipe = False
            logger.info("Using OpenCV for face detection")
    
    def load_metadata(self):
        """Load user metadata from file"""
        metadata_file = os.path.join(self.metadata_path, "user_metadata.json")
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, "r") as f:
                    data = json.load(f)
                    self.user_mapping = data.get("user_mapping", {})
                    self.user_metadata = data.get("user_metadata", {})
                logger.info(f"Loaded metadata for {len(self.user_mapping)} users")
            except Exception as e:
                logger.error(f"Error loading metadata: {e}")
                self.user_mapping = {}
                self.user_metadata = {}
    
    def save_metadata(self):
        """Save user metadata to file"""
        metadata_file = os.path.join(self.metadata_path, "user_metadata.json")
        try:
            data = {
                "user_mapping": self.user_mapping,
                "user_metadata": self.user_metadata,
                "last_updated": datetime.now().isoformat()
            }
            with open(metadata_file, "w") as f:
                json.dump(data, f, indent=2)
            logger.info("Metadata saved successfully")
        except Exception as e:
            logger.error(f"Error saving metadata: {e}")
    
    def load_recognizer(self):
        """Load existing recognizer if available"""
        model_file = os.path.join(self.models_path, "face_recognizer.yml")
        if os.path.exists(model_file):
            try:
                self.recognizer.read(model_file)
                logger.info("✅ Loaded existing face recognizer")
            except Exception as e:
                logger.error(f"⚠️ Could not load existing recognizer: {e}")
    
    def save_recognizer(self):
        """Save recognizer to file"""
        model_file = os.path.join(self.models_path, "face_recognizer.yml")
        try:
            self.recognizer.write(model_file)
            logger.info("✅ Face recognizer saved")
        except Exception as e:
            logger.error(f"❌ Error saving recognizer: {e}")
    
    def get_user_internal_id(self, user_id):
        """Get or create internal ID for user"""
        user_id = str(user_id)
        
        if user_id not in self.user_mapping:
            # Create new internal ID
            internal_id = len(self.user_mapping) + 1
            self.user_mapping[user_id] = internal_id
            self.user_metadata[user_id] = {
                "internal_id": internal_id,
                "created_at": datetime.now().isoformat(),
                "sample_count": 0,
                "last_trained": None,
                "quality": "none"
            }
            self.save_metadata()
        
        return self.user_mapping[user_id]
    
    def decode_base64_image(self, image_data):
        """Decode base64 image data with error handling"""
        try:
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            image_array = np.array(image)
            
            return image_array
        except Exception as e:
            raise Exception(f"Error decoding image: {str(e)}")
    
    def detect_faces_mediapipe(self, image):
        """Detect faces using MediaPipe"""
        try:
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = self.face_detection.process(rgb_image)
            
            faces = []
            if results.detections:
                for detection in results.detections:
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
                    
                    if width > 30 and height > 30:  # Minimum face size
                        faces.append((x, y, width, height))
            
            return faces
        except Exception as e:
            logger.error(f"MediaPipe detection error: {e}")
            return []
    
    def detect_faces_opencv(self, image):
        """Detect faces using OpenCV"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Try multiple detection parameters
            face_params = [
                (1.1, 3),   # More sensitive
                (1.3, 5),   # Default
                (1.5, 7),   # Less sensitive
            ]
            
            for scale_factor, min_neighbors in face_params:
                faces = self.face_cascade.detectMultiScale(
                    gray, 
                    scaleFactor=scale_factor, 
                    minNeighbors=min_neighbors,
                    minSize=(30, 30),
                    flags=cv2.CASCADE_SCALE_IMAGE
                )
                if len(faces) > 0:
                    return faces.tolist()
            
            return []
        except Exception as e:
            logger.error(f"OpenCV detection error: {e}")
            return []
    
    def detect_faces(self, image):
        """Detect faces using available method"""
        if self.use_mediapipe:
            return self.detect_faces_mediapipe(image)
        else:
            return self.detect_faces_opencv(image)
    
    def preprocess_face(self, image, face_bbox):
        """Preprocess face for recognition"""
        try:
            x, y, w, h = face_bbox
            face_roi = image[y:y+h, x:x+w]
            
            # Convert to grayscale
            if len(face_roi.shape) == 3:
                gray_face = cv2.cvtColor(face_roi, cv2.COLOR_RGB2GRAY)
            else:
                gray_face = face_roi
            
            # Resize to standard size
            face_resized = cv2.resize(gray_face, (150, 150))
            
            # Apply histogram equalization
            face_equalized = cv2.equalizeHist(face_resized)
            
            # Apply Gaussian blur to reduce noise
            face_blurred = cv2.GaussianBlur(face_equalized, (3, 3), 0)
            
            return face_blurred
        except Exception as e:
            raise Exception(f"Error preprocessing face: {str(e)}")
    
    def calculate_face_quality(self, face_image):
        """Calculate face quality score"""
        try:
            # Calculate sharpness using Laplacian variance
            laplacian_var = cv2.Laplacian(face_image, cv2.CV_64F).var()
            
            # Calculate brightness
            brightness = np.mean(face_image)
            
            # Calculate contrast
            contrast = np.std(face_image)
            
            # Combined quality score (0-1)
            quality = min(1.0, (laplacian_var / 1000.0) * 0.4 + 
                         (min(brightness, 255 - brightness) / 127.5) * 0.3 + 
                         (contrast / 50.0) * 0.3)
            
            return quality
        except:
            return 0.5  # Default quality
    
    def collect_face_samples(self, user_id, face_data_list):
        """Collect and store face samples"""
        try:
            user_id = str(user_id)
            internal_id = self.get_user_internal_id(user_id)
            successful_samples = 0
            quality_scores = []
            
            logger.info(f"Collecting face samples for user {user_id}")
            
            for i, face_data in enumerate(face_data_list):
                try:
                    # Decode image
                    image = self.decode_base64_image(face_data)
                    
                    # Detect faces
                    faces = self.detect_faces(image)
                    
                    if len(faces) == 0:
                        logger.warning(f"No face detected in sample {i+1}")
                        continue
                    
                    # Use the largest face
                    face_bbox = max(faces, key=lambda x: x[2] * x[3])
                    
                    # Preprocess face
                    processed_face = self.preprocess_face(image, face_bbox)
                    
                    # Calculate quality
                    quality = self.calculate_face_quality(processed_face)
                    
                    if quality < 0.3:  # Skip low quality faces
                        logger.warning(f"Low quality face detected in sample {i+1}: {quality:.2f}")
                        continue
                    
                    # Save face sample
                    sample_filename = f"user_{user_id}_sample_{successful_samples + 1}.jpg"
                    sample_path = os.path.join(self.dataset_path, sample_filename)
                    cv2.imwrite(sample_path, processed_face)
                    
                    successful_samples += 1
                    quality_scores.append(quality)
                    
                    logger.info(f"Saved sample {successful_samples} with quality {quality:.2f}")
                        
                except Exception as e:
                    logger.error(f"Error processing sample {i+1}: {e}")
                    continue
            
            if successful_samples == 0:
                return {
                    "success": False,
                    "message": "No valid faces found in provided images"
                }
            
            # Update user metadata
            avg_quality = np.mean(quality_scores) if quality_scores else 0
            quality_level = "high" if avg_quality > 0.7 else "medium" if avg_quality > 0.5 else "low"
            
            self.user_metadata[user_id].update({
                "sample_count": self.user_metadata[user_id]["sample_count"] + successful_samples,
                "last_updated": datetime.now().isoformat(),
                "quality": quality_level,
                "avg_quality": float(avg_quality)
            })
            
            self.save_metadata()
            
            return {
                "success": True,
                "message": f"Collected {successful_samples} face samples for user {user_id}",
                "sample_count": successful_samples,
                "total_samples": self.user_metadata[user_id]["sample_count"],
                "quality": quality_level,
                "avg_quality": float(avg_quality)
            }
            
        except Exception as e:
            logger.error(f"Error collecting face samples: {e}")
            return {
                "success": False,
                "message": f"Error collecting face samples: {str(e)}"
            }
    
    def train_recognizer(self):
        """Train the face recognizer with all collected samples"""
        try:
            logger.info("Starting face recognizer training...")
            
            faces, ids = [], []
            user_sample_counts = {}
            
            # Load all face samples
            for filename in os.listdir(self.dataset_path):
                if not filename.endswith(".jpg"):
                    continue
                
                # Extract user ID from filename
                try:
                    parts = filename.replace(".jpg", "").split("_")
                    if len(parts) >= 3 and parts[0] == "user":
                        user_id = parts[1]
                        
                        # Load image
                        image_path = os.path.join(self.dataset_path, filename)
                        face_img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
                        
                        if face_img is None:
                            continue
                        
                        # Get internal ID
                        if user_id in self.user_mapping:
                            internal_id = self.user_mapping[user_id]
                            faces.append(face_img)
                            ids.append(internal_id)
                            
                            # Count samples per user
                            user_sample_counts[user_id] = user_sample_counts.get(user_id, 0) + 1
                        
                except Exception as e:
                    logger.error(f"Error processing file {filename}: {e}")
                    continue
            
            if len(faces) == 0:
                return {
                    "success": False,
                    "message": "No face samples found for training"
                }
            
            logger.info(f"Training with {len(faces)} samples from {len(set(ids))} users")
            
            # Train recognizer
            self.recognizer.train(faces, np.array(ids))
            self.save_recognizer()
            
            # Update metadata
            for user_id, count in user_sample_counts.items():
                if user_id in self.user_metadata:
                    self.user_metadata[user_id]["last_trained"] = datetime.now().isoformat()
            
            self.save_metadata()
            
            return {
                "success": True,
                "message": f"Trained recognizer with {len(faces)} samples from {len(set(ids))} users",
                "sample_count": len(faces),
                "user_count": len(set(ids)),
                "user_samples": user_sample_counts
            }
            
        except Exception as e:
            logger.error(f"Error training recognizer: {e}")
            return {
                "success": False,
                "message": f"Error training recognizer: {str(e)}"
            }
    
    def recognize_face(self, face_data):
        """Recognize face from image"""
        try:
            # Decode image
            image = self.decode_base64_image(face_data)
            
            # Detect faces
            faces = self.detect_faces(image)
            
            if len(faces) == 0:
                return {
                    "success": False,
                    "message": "No face detected in image"
                }
            
            # Use the largest face
            face_bbox = max(faces, key=lambda x: x[2] * x[3])
            
            # Preprocess face
            processed_face = self.preprocess_face(image, face_bbox)
            
            # Predict
            id, confidence = self.recognizer.predict(processed_face)
            
            # Convert confidence (lower is better in LBPH)
            confidence_percent = max(0, 100 - confidence)
            
            if confidence < 100 and id in self.user_mapping.values():
                # Find user_id by internal_id
                user_id = None
                for uid, iid in self.user_mapping.items():
                    if iid == id:
                        user_id = uid
                        break
                
                if user_id:
                    return {
                        "success": True,
                        "user_id": user_id,
                        "confidence": confidence_percent,
                        "message": f"Recognized as {user_id} with {confidence_percent:.1f}% confidence"
                    }
            
            return {
                "success": False,
                "message": "Face not recognized",
                "confidence": confidence_percent
            }
                
        except Exception as e:
            logger.error(f"Error recognizing face: {e}")
            return {
                "success": False,
                "message": f"Error recognizing face: {str(e)}"
            }
    
    def verify_face(self, face_data, user_id):
        """Verify if face matches specific user"""
        try:
            user_id = str(user_id)
            
            if user_id not in self.user_mapping:
                return {
                    "success": False,
                    "isMatch": False,
                    "confidence": 0,
                    "message": f"No face data found for user {user_id}"
                }
            
            # Decode image
            image = self.decode_base64_image(face_data)
            
            # Detect faces
            faces = self.detect_faces(image)
            
            if len(faces) == 0:
                return {
                    "success": False,
                    "isMatch": False,
                    "confidence": 0,
                    "message": "No face detected in image"
                }
            
            # Use the largest face
            face_bbox = max(faces, key=lambda x: x[2] * x[3])
            
            # Preprocess face
            processed_face = self.preprocess_face(image, face_bbox)
            
            # Predict
            id, confidence = self.recognizer.predict(processed_face)
            
            # Check if recognized user matches expected user
            expected_internal_id = self.user_mapping[user_id]
            is_match = id == expected_internal_id
            confidence_percent = max(0, 100 - confidence)
            
            if is_match and confidence < 100:
                return {
                    "success": True,
                    "isMatch": True,
                    "confidence": confidence_percent,
                    "message": f"Face matches user {user_id} with {confidence_percent:.1f}% confidence"
                }
            else:
                return {
                    "success": True,
                    "isMatch": False,
                    "confidence": confidence_percent,
                    "message": f"Face does not match user {user_id}"
                }
                
        except Exception as e:
            logger.error(f"Error verifying face: {e}")
            return {
                "success": False,
                "isMatch": False,
                "confidence": 0,
                "message": f"Error verifying face: {str(e)}"
            }
    
    def get_user_samples(self, user_id):
        """Get number of samples for a user"""
        user_id = str(user_id)
        if user_id in self.user_metadata:
            return self.user_metadata[user_id]["sample_count"]
        return 0
    
    def get_user_metadata(self, user_id):
        """Get user metadata"""
        user_id = str(user_id)
        if user_id in self.user_metadata:
            return self.user_metadata[user_id].copy()
        return None
    
    def remove_user_data(self, user_id):
        """Remove all data for a user"""
        try:
            user_id = str(user_id)
            
            if user_id not in self.user_mapping:
                return {
                    "success": True,
                    "message": f"No data found for user {user_id}"
                }
            
            # Remove sample files
            removed_count = 0
            for filename in os.listdir(self.dataset_path):
                if filename.startswith(f"user_{user_id}_"):
                    filepath = os.path.join(self.dataset_path, filename)
                    os.remove(filepath)
                    removed_count += 1
            
            # Remove from metadata
            if user_id in self.user_mapping:
                del self.user_mapping[user_id]
            if user_id in self.user_metadata:
                del self.user_metadata[user_id]
            
            self.save_metadata()
            
            return {
                "success": True,
                "message": f"Removed {removed_count} samples for user {user_id}"
            }
            
        except Exception as e:
            logger.error(f"Error removing user data: {e}")
            return {
                "success": False,
                "message": f"Error removing user data: {str(e)}"
            }
    
    def get_system_stats(self):
        """Get system statistics"""
        try:
            total_samples = len([f for f in os.listdir(self.dataset_path) if f.endswith(".jpg")])
            total_users = len(self.user_mapping)
            trained_users = len([u for u in self.user_metadata.values() if u.get("last_trained")])
            
            return {
                "success": True,
                "total_users": total_users,
                "trained_users": trained_users,
                "total_samples": total_samples,
                "avg_samples_per_user": total_samples / max(total_users, 1),
                "system_quality": "high" if total_users >= 10 else "medium" if total_users >= 5 else "low"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error getting stats: {str(e)}"
            }

# Global instance
face_recognition_service = AdvancedFaceRecognition()

def collect_face_samples(user_id, face_data_list):
    """Collect face samples for a user"""
    return face_recognition_service.collect_face_samples(user_id, face_data_list)

def train_recognizer():
    """Train the face recognizer"""
    return face_recognition_service.train_recognizer()

def recognize_face(face_data):
    """Recognize face from image"""
    return face_recognition_service.recognize_face(face_data)

def verify_face(face_data, user_id):
    """Verify face against specific user"""
    return face_recognition_service.verify_face(face_data, user_id)

def get_user_samples(user_id):
    """Get number of samples for user"""
    return face_recognition_service.get_user_samples(user_id)

def get_user_metadata(user_id):
    """Get user metadata"""
    return face_recognition_service.get_user_metadata(user_id)

def remove_user_data(user_id):
    """Remove user data"""
    return face_recognition_service.remove_user_data(user_id)

def get_system_stats():
    """Get system statistics"""
    return face_recognition_service.get_system_stats()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        # Test the face recognition service
        print("Advanced Face Recognition Service initialized")
        stats = get_system_stats()
        if stats["success"]:
            print(f"Total users: {stats['total_users']}")
            print(f"Trained users: {stats['trained_users']}")
            print(f"Total samples: {stats['total_samples']}")
            print(f"System quality: {stats['system_quality']}")
        else:
            print(f"Error: {stats['message']}")
    elif sys.argv[1] == '--file':
        # Handle file input for large data
        try:
            if len(sys.argv) < 3:
                print(json.dumps({"success": False, "message": "No file path provided"}))
                
            file_path = sys.argv[2]
            if not os.path.exists(file_path):
                print(json.dumps({"success": False, "message": "Input file not found"}))
            
            # Read input data from file
            with open(file_path, 'r') as f:
                input_data = f.read()
            
            if not input_data:
                print(json.dumps({"success": False, "message": "No input data in file"}))
                
            data = json.loads(input_data)
            method = data['method']
            
            if method == 'collect':
                user_id = data['userId']
                face_data_list = data['faceDataList']
                
                # Validate minimum samples for better accuracy
                if len(face_data_list) < 10:
                    print(json.dumps({"success": False, "message": "At least 10 face samples are required for training"}))
                else:
                    # Limit the number of face samples to prevent memory issues
                    if len(face_data_list) > 25:
                        face_data_list = face_data_list[:25]
                        logger.warning(f"Limited face samples to 25 (was {len(data['faceDataList'])})")
                    
                    result = collect_face_samples(user_id, face_data_list)
                    print(json.dumps(result))
            elif method == 'recognize':
                face_data = data['faceData']
                result = recognize_face(face_data)
                print(json.dumps(result))
            elif method == 'verify':
                face_data = data['faceData']
                user_id = data['userId']
                result = verify_face(face_data, user_id)
                print(json.dumps(result))
            else:
                print(json.dumps({"success": False, "message": f"Unknown method: {method}"}))
                
        except json.JSONDecodeError as e:
            print(json.dumps({"success": False, "message": f"Invalid JSON input: {str(e)}"}))
        except Exception as e:
            logger.error(f"File processing error: {e}")
            print(json.dumps({"success": False, "message": f"Error: {str(e)}"}))
    elif sys.argv[1] == '--stdin':
        # Handle stdin input for large data (legacy support)
        try:
            # Read input data with size limit
            input_data = ""
            while True:
                chunk = sys.stdin.read(8192)  # Read in 8KB chunks
                if not chunk:
                    break
                input_data += chunk
                if len(input_data) > 100 * 1024 * 1024:  # 100MB limit
                    raise Exception("Input data too large")
            
            if not input_data:
                print(json.dumps({"success": False, "message": "No input data received"}))
                
            data = json.loads(input_data)
            method = data['method']
            
            if method == 'collect':
                user_id = data['userId']
                face_data_list = data['faceDataList']
                
                # Validate minimum samples for better accuracy
                if len(face_data_list) < 10:
                    print(json.dumps({"success": False, "message": "At least 10 face samples are required for training"}))
                else:
                    # Limit the number of face samples to prevent memory issues
                    if len(face_data_list) > 25:
                        face_data_list = face_data_list[:25]
                        logger.warning(f"Limited face samples to 25 (was {len(data['faceDataList'])})")
                    
                    result = collect_face_samples(user_id, face_data_list)
                    print(json.dumps(result))
            elif method == 'recognize':
                face_data = data['faceData']
                result = recognize_face(face_data)
                print(json.dumps(result))
            elif method == 'verify':
                face_data = data['faceData']
                user_id = data['userId']
                result = verify_face(face_data, user_id)
                print(json.dumps(result))
            else:
                print(json.dumps({"success": False, "message": f"Unknown method: {method}"}))
                
        except json.JSONDecodeError as e:
            print(json.dumps({"success": False, "message": f"Invalid JSON input: {str(e)}"}))
        except Exception as e:
            logger.error(f"Stdin processing error: {e}")
            print(json.dumps({"success": False, "message": f"Error: {str(e)}"}))
    else:
        # Handle command line arguments for Node.js integration
        method = sys.argv[1]
        
        try:
            if method == "collect":
                if len(sys.argv) < 3:
                    print(json.dumps({"success": False, "message": "User ID required"}))
                else:
                    user_id = sys.argv[2]
                    face_data_list = sys.argv[3:]  # All remaining args are face data
                    result = collect_face_samples(user_id, face_data_list)
                    print(json.dumps(result))
                
            elif method == "train":
                result = train_recognizer()
                print(json.dumps(result))
                
            elif method == "recognize":
                if len(sys.argv) < 3:
                    print(json.dumps({"success": False, "message": "Face data required"}))
                else:
                    face_data = sys.argv[2]
                    result = recognize_face(face_data)
                    print(json.dumps(result))
                
            elif method == "verify":
                if len(sys.argv) < 4:
                    print(json.dumps({"success": False, "message": "Face data and user ID required"}))
                else:
                    face_data = sys.argv[2]
                    user_id = sys.argv[3]
                    result = verify_face(face_data, user_id)
                    print(json.dumps(result))
                
            elif method == "get_samples":
                if len(sys.argv) < 3:
                    print(json.dumps({"success": False, "message": "User ID required"}))
                else:
                    user_id = sys.argv[2]
                    count = get_user_samples(user_id)
                    print(json.dumps({"success": True, "count": count}))
                
            elif method == "get_metadata":
                if len(sys.argv) < 3:
                    print(json.dumps({"success": False, "message": "User ID required"}))
                else:
                    user_id = sys.argv[2]
                    metadata = get_user_metadata(user_id)
                    print(json.dumps({"success": True, "metadata": metadata}))
                
            elif method == "remove":
                if len(sys.argv) < 3:
                    print(json.dumps({"success": False, "message": "User ID required"}))
                else:
                    user_id = sys.argv[2]
                    result = remove_user_data(user_id)
                    print(json.dumps(result))
                
            elif method == "stats":
                result = get_system_stats()
                print(json.dumps(result))
                
            else:
                print(json.dumps({"success": False, "message": f"Unknown method: {method}"}))
                
        except Exception as e:
            logger.error(f"Command line processing error: {e}")
            print(json.dumps({"success": False, "message": f"Error: {str(e)}"}))
