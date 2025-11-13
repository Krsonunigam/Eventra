"""
Simple Face Recognition System
Uses only OpenCV (no MediaPipe dependency)
"""

import cv2
import numpy as np
import base64
import json
import os
from datetime import datetime
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleFaceRecognition:
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
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Initialize face recognition
        self.recognizer = cv2.face.LBPHFaceRecognizer_create(
            radius=1, 
            neighbors=8, 
            grid_x=8, 
            grid_y=8, 
            threshold=80
        )
        
        # Load existing data
        self._load_metadata()
        self._load_recognizer()
        
        logger.info("Simple Face Recognition system initialized successfully")
    
    def _load_metadata(self):
        """Load user metadata"""
        self.metadata_file = os.path.join(self.metadata_path, "user_metadata.json")
        try:
            if os.path.exists(self.metadata_file):
                with open(self.metadata_file, 'r') as f:
                    self.metadata = json.load(f)
            else:
                self.metadata = {}
        except Exception as e:
            logger.error(f"Error loading metadata: {e}")
            self.metadata = {}
    
    def _save_metadata(self):
        """Save user metadata"""
        try:
            with open(self.metadata_file, 'w') as f:
                json.dump(self.metadata, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error saving metadata: {e}")
            return False
    
    def _load_recognizer(self):
        """Load trained recognizer"""
        self.model_file = os.path.join(self.models_path, "face_recognizer.yml")
        try:
            if os.path.exists(self.model_file):
                self.recognizer.read(self.model_file)
                logger.info("Loaded existing face recognizer model")
            else:
                logger.info("No existing model found, will create new one")
        except Exception as e:
            logger.error(f"Error loading recognizer: {e}")
    
    def _save_recognizer(self):
        """Save trained recognizer"""
        try:
            self.recognizer.write(self.model_file)
            logger.info("Saved face recognizer model")
            return True
        except Exception as e:
            logger.error(f"Error saving recognizer: {e}")
            return False
    
    def _base64_to_image(self, base64_string):
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
    
    def _detect_faces(self, image):
        """Detect faces in image using OpenCV"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            return faces
        except Exception as e:
            logger.error(f"Error detecting faces: {e}")
            return []
    
    def _preprocess_face(self, face_image):
        """Preprocess face image for recognition"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            
            # Resize to standard size
            resized = cv2.resize(gray, (100, 100))
            
            # Apply histogram equalization
            equalized = cv2.equalizeHist(resized)
            
            return equalized
        except Exception as e:
            logger.error(f"Error preprocessing face: {e}")
            return None
    
    def collect_face_samples_from_camera(self, user_id, num_samples=10):
        """Collect face samples from camera interactively"""
        try:
            logger.info(f"Collecting {num_samples} face samples for user {user_id} from camera")
            
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                return {
                    "success": False,
                    "message": "Could not open camera"
                }
            
            face_data_list = []
            sample_count = 0
            
            print(f"\n=== Face Collection for User: {user_id} ===")
            print(f"Collecting {num_samples} face samples...")
            print("Press SPACE to capture a face sample")
            print("Press 'q' to quit early")
            print("Make sure your face is clearly visible in the camera\n")
            
            while sample_count < num_samples:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Detect faces in the frame
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(
                    gray, 
                    scaleFactor=1.1, 
                    minNeighbors=5, 
                    minSize=(30, 30)
                )
                
                # Draw rectangles around detected faces
                for (x, y, w, h) in faces:
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
                
                # Add instruction text
                cv2.putText(frame, f"Samples: {sample_count}/{num_samples}", 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.putText(frame, "SPACE: Capture | Q: Quit", 
                           (10, frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                cv2.imshow('Face Collection', frame)
                
                key = cv2.waitKey(1) & 0xFF
                if key == ord(' '):  # Space bar
                    if len(faces) > 0:
                        # Use the first detected face
                        x, y, w, h = faces[0]
                        face_crop = frame[y:y+h, x:x+w]
                        
                        # Convert to base64
                        _, buffer = cv2.imencode('.jpg', face_crop)
                        face_base64 = base64.b64encode(buffer).decode('utf-8')
                        face_data_list.append(face_base64)
                        sample_count += 1
                        print(f"Captured sample {sample_count}/{num_samples}")
                    else:
                        print("No face detected! Please position your face in the camera.")
                elif key == ord('q'):
                    break
            
            cap.release()
            cv2.destroyAllWindows()
            
            if sample_count < 3:
                return {
                    "success": False,
                    "message": f"Only {sample_count} samples captured. At least 3 required."
                }
            
            # Now process the collected samples
            return self.collect_face_samples(user_id, face_data_list)
            
        except Exception as e:
            logger.error(f"Error in collect_face_samples_from_camera: {e}")
            return {
                "success": False,
                "message": f"Error collecting face samples from camera: {str(e)}"
            }
    
    def collect_face_samples(self, user_id, face_data_list):
        """Collect face samples for training"""
        try:
            logger.info(f"Collecting face samples for user {user_id}")
            
            if len(face_data_list) < 3:
                return {
                    "success": False,
                    "message": "At least 3 face samples are required"
                }
            
            # Limit samples to prevent memory issues
            original_count = len(face_data_list)
            if len(face_data_list) > 20:
                face_data_list = face_data_list[:20]
                logger.warning(f"Limited face samples to 20 (was {original_count})")
            
            valid_samples = 0
            user_dir = os.path.join(self.dataset_path, str(user_id))
            os.makedirs(user_dir, exist_ok=True)
            
            for i, face_data in enumerate(face_data_list):
                try:
                    # Convert base64 to image
                    image = self._base64_to_image(face_data)
                    if image is None:
                        continue
                    
                    # Detect faces
                    faces = self._detect_faces(image)
                    if len(faces) == 0:
                        continue
                    
                    # Use the first detected face
                    x, y, w, h = faces[0]
                    face_crop = image[y:y+h, x:x+w]
                    
                    # Preprocess face
                    processed_face = self._preprocess_face(face_crop)
                    if processed_face is None:
                        continue
                    
                    # Save face sample
                    filename = f"sample_{i}_{int(datetime.now().timestamp())}.jpg"
                    filepath = os.path.join(user_dir, filename)
                    cv2.imwrite(filepath, processed_face)
                    
                    valid_samples += 1
                    logger.info(f"Saved face sample {i+1} for user {user_id}")
                    
                except Exception as e:
                    logger.error(f"Error processing sample {i}: {e}")
                    continue
            
            if valid_samples < 3:
                return {
                    "success": False,
                    "message": f"Only {valid_samples} valid faces found. At least 3 required."
                }
            
            # Update metadata
            if user_id not in self.metadata:
                self.metadata[user_id] = {}
            
            self.metadata[user_id].update({
                "sample_count": valid_samples,
                "last_updated": datetime.now().isoformat(),
                "quality": "good" if valid_samples >= 5 else "fair"
            })
            
            self._save_metadata()
            
            # Train the recognizer
            self._train_recognizer()
            
            return {
                "success": True,
                "message": f"Successfully collected {valid_samples} face samples",
                "sampleCount": valid_samples,
                "user": {
                    "id": user_id,
                    "sampleCount": valid_samples,
                    "quality": self.metadata[user_id]["quality"]
                }
            }
            
        except Exception as e:
            logger.error(f"Error in collect_face_samples: {e}")
            return {
                "success": False,
                "message": f"Error collecting face samples: {str(e)}"
            }
    
    def _train_recognizer(self):
        """Train the face recognizer with all collected data"""
        try:
            logger.info("Training face recognizer...")
            
            faces = []
            labels = []
            label_map = {}
            
            # Load all face samples
            for user_id in os.listdir(self.dataset_path):
                user_dir = os.path.join(self.dataset_path, user_id)
                if not os.path.isdir(user_dir):
                    continue
                
                if user_id not in label_map:
                    label_map[user_id] = len(label_map)
                
                label = label_map[user_id]
                
                for filename in os.listdir(user_dir):
                    if filename.endswith('.jpg'):
                        filepath = os.path.join(user_dir, filename)
                        face_image = cv2.imread(filepath, cv2.IMREAD_GRAYSCALE)
                        if face_image is not None:
                            faces.append(face_image)
                            labels.append(label)
            
            if len(faces) == 0:
                logger.warning("No face samples found for training")
                return False
            
            # Train the recognizer
            self.recognizer.train(faces, np.array(labels))
            self._save_recognizer()
            
            # Save label mapping
            mapping_file = os.path.join(self.models_path, "label_mapping.json")
            with open(mapping_file, 'w') as f:
                json.dump(label_map, f, indent=2)
            
            logger.info(f"Trained recognizer with {len(faces)} face samples from {len(label_map)} users")
            return True
            
        except Exception as e:
            logger.error(f"Error training recognizer: {e}")
            return False
    
    def recognize_face(self, face_data):
        """Recognize face from image"""
        try:
            # Convert base64 to image
            image = self._base64_to_image(face_data)
            if image is None:
                return {
                    "success": False,
                    "message": "Invalid image data"
                }
            
            # Detect faces
            faces = self._detect_faces(image)
            if len(faces) == 0:
                return {
                    "success": False,
                    "message": "No face detected in image"
                }
            
            # Use the first detected face
            x, y, w, h = faces[0]
            face_crop = image[y:y+h, x:x+w]
            
            # Preprocess face
            processed_face = self._preprocess_face(face_crop)
            if processed_face is None:
                return {
                    "success": False,
                    "message": "Could not preprocess face"
                }
            
            # Predict
            label, confidence = self.recognizer.predict(processed_face)
            
            # Load label mapping
            mapping_file = os.path.join(self.models_path, "label_mapping.json")
            if os.path.exists(mapping_file):
                with open(mapping_file, 'r') as f:
                    label_map = json.load(f)
                
                # Reverse mapping
                id_to_label = {v: k for k, v in label_map.items()}
                user_id = id_to_label.get(label, "unknown")
            else:
                user_id = str(label)
            
            return {
                "success": True,
                "message": "Face recognized successfully",
                "user_id": user_id,
                "confidence": float(confidence)
            }
            
        except Exception as e:
            logger.error(f"Error in recognize_face: {e}")
            return {
                "success": False,
                "message": f"Error recognizing face: {str(e)}"
            }
    
    def verify_face(self, face_data, user_id):
        """Verify face against specific user"""
        try:
            # Convert base64 to image
            image = self._base64_to_image(face_data)
            if image is None:
                return {
                    "success": False,
                    "message": "Invalid image data"
                }
            
            # Detect faces
            faces = self._detect_faces(image)
            if len(faces) == 0:
                return {
                    "success": False,
                    "message": "No face detected in image"
                }
            
            # Use the first detected face
            x, y, w, h = faces[0]
            face_crop = image[y:y+h, x:x+w]
            
            # Preprocess face
            processed_face = self._preprocess_face(face_crop)
            if processed_face is None:
                return {
                    "success": False,
                    "message": "Could not preprocess face"
                }
            
            # Predict
            label, confidence = self.recognizer.predict(processed_face)
            
            # Load label mapping
            mapping_file = os.path.join(self.models_path, "label_mapping.json")
            if os.path.exists(mapping_file):
                with open(mapping_file, 'r') as f:
                    label_map = json.load(f)
                
                # Check if predicted user matches target user
                predicted_user_id = None
                for uid, lbl in label_map.items():
                    if lbl == label:
                        predicted_user_id = uid
                        break
                
                is_match = predicted_user_id == str(user_id)
                confidence_score = max(0, 100 - confidence)  # Convert to percentage
                
                return {
                    "success": True,
                    "isMatch": is_match,
                    "confidence": confidence_score,
                    "message": "Face verification completed"
                }
            else:
                return {
                    "success": False,
                    "message": "No trained model found"
                }
            
        except Exception as e:
            logger.error(f"Error in verify_face: {e}")
            return {
                "success": False,
                "message": f"Error verifying face: {str(e)}"
            }
    
    def get_system_stats(self):
        """Get system statistics"""
        try:
            total_users = len(self.metadata)
            total_samples = 0
            for user_data in self.metadata.values():
                if isinstance(user_data, dict):
                    total_samples += user_data.get('sample_count', 0)
                else:
                    total_samples += 0
            
            return {
                "success": True,
                "trained_users": total_users,
                "total_samples": total_samples,
                "system_quality": "good" if total_samples > 10 else "fair"
            }
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {
                "success": False,
                "message": f"Error getting stats: {str(e)}"
            }

# Initialize the system
face_recognition = SimpleFaceRecognition()

def collect_face_samples(user_id, face_data_list):
    return face_recognition.collect_face_samples(user_id, face_data_list)

def collect_face_samples_from_camera(user_id, num_samples=10):
    return face_recognition.collect_face_samples_from_camera(user_id, num_samples)

def recognize_face(face_data):
    return face_recognition.recognize_face(face_data)

def verify_face(face_data, user_id):
    return face_recognition.verify_face(face_data, user_id)

def get_system_stats():
    return face_recognition.get_system_stats()

def get_user_metadata(user_id):
    return face_recognition.metadata.get(user_id, {})

def remove_user_data(user_id):
    try:
        # Remove user directory
        user_dir = os.path.join(face_recognition.dataset_path, str(user_id))
        if os.path.exists(user_dir):
            import shutil
            shutil.rmtree(user_dir)
        
        # Remove from metadata
        if user_id in face_recognition.metadata:
            del face_recognition.metadata[user_id]
            face_recognition._save_metadata()
        
        # Retrain recognizer
        face_recognition._train_recognizer()
        
        return {"success": True, "message": "User data removed successfully"}
    except Exception as e:
        return {"success": False, "message": f"Error removing user data: {str(e)}"}

# Command line interface
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python simpleFaceRecognition.py <method> [args...]")
        print("Methods:")
        print("  collect-camera <user_id> [num_samples] - Collect samples from camera")
        print("  collect <user_id> <face_data1> [face_data2] ... - Collect from base64 data")
        print("  recognize <face_data> - Recognize face")
        print("  verify <face_data> <user_id> - Verify face")
        print("  stats - Get system statistics")
        sys.exit(1)
    
    method = sys.argv[1]
    
    try:
        if method == 'collect-camera':
            if len(sys.argv) < 3:
                print("Usage: python simpleFaceRecognition.py collect-camera <user_id> [num_samples]")
                sys.exit(1)
            user_id = sys.argv[2]
            num_samples = int(sys.argv[3]) if len(sys.argv) > 3 else 10
            result = face_recognition.collect_face_samples_from_camera(user_id, num_samples)
            print(json.dumps(result))
            
        elif method == 'collect':
            if len(sys.argv) < 4:
                print("Usage: python simpleFaceRecognition.py collect <user_id> <face_data1> [face_data2] ...")
                sys.exit(1)
            user_id = sys.argv[2]
            face_data_list = sys.argv[3:]
            result = collect_face_samples(user_id, face_data_list)
            print(json.dumps(result))
            
        elif method == 'recognize':
            if len(sys.argv) < 3:
                print("Usage: python simpleFaceRecognition.py recognize <face_data>")
                sys.exit(1)
            face_data = sys.argv[2]
            result = recognize_face(face_data)
            print(json.dumps(result))
            
        elif method == 'verify':
            if len(sys.argv) < 4:
                print("Usage: python simpleFaceRecognition.py verify <face_data> <user_id>")
                sys.exit(1)
            face_data = sys.argv[2]
            user_id = sys.argv[3]
            result = verify_face(face_data, user_id)
            print(json.dumps(result))
            
        elif method == 'stats':
            result = get_system_stats()
            print(json.dumps(result))
            
        elif method == 'metadata':
            if len(sys.argv) < 3:
                print("Usage: python simpleFaceRecognition.py metadata <user_id>")
                sys.exit(1)
            user_id = sys.argv[2]
            result = get_user_metadata(user_id)
            print(json.dumps(result))
            
        elif method == 'remove':
            if len(sys.argv) < 3:
                print("Usage: python simpleFaceRecognition.py remove <user_id>")
                sys.exit(1)
            user_id = sys.argv[2]
            result = remove_user_data(user_id)
            print(json.dumps(result))
            
        else:
            print(f"Unknown method: {method}")
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({"success": False, "message": f"Error: {str(e)}"}))
        sys.exit(1)
        # print("Face recognition system initialized successfully")
        