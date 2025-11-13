import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, X, User, AlertCircle, Loader } from 'lucide-react';
import useCustomToast from '../../utils/customToast';
import faceRecognitionAPI from '../../utils/faceRecognitionAPI';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/axiosConfig';

const FaceVerification = ({ isOpen, onSuccess, onClose, eventId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const { user } = useAuth();
  const toast = useCustomToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      checkServerConnection();
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const checkServerConnection = async () => {
    try {
      // Check if user is logged in first
      const token = localStorage.getItem('token');
      if (!token) {
        setServerConnected(false);
        toast.error('Please log in first to use face recognition.');
        return;
      }

      // Try to check server health
      const response = await faceRecognitionAPI.healthCheck();
      setServerConnected(true);
      console.log('Face recognition server connected:', response);
    } catch (error) {
      setServerConnected(false);
      console.error('Face recognition server not available:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast.error('Please log in first to use face recognition.');
      } else if (error.message.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        toast.error('Cannot connect to face recognition server. Please check your connection.');
      } else {
        toast.error('Face recognition service is not available. Please try again.');
      }
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureFace = async () => {
    if (!videoRef.current || !serverConnected || isProcessing) return;

    setIsProcessing(true);
    setFaceDetected(false);

    try {
      const imageData = faceRecognitionAPI.captureImageFromVideo(videoRef.current);
      
      // First check if a face is detected in the image
      const hasFace = await detectFaceInImage(imageData);
      
      if (!hasFace) {
        setFaceDetected(false);
        setVerificationResult({
          success: false,
          message: 'No face detected in the image'
        });
        toast.error('No face detected. Please position your face in the camera.');
        return;
      }
      
      // Face detected, proceed with verification
      setFaceDetected(true);
      toast.loading('Face detected, scanning dataset...');
      
      // Verify face against stored data
      const response = await faceRecognitionAPI.verifyFace(imageData, user?.id);
      
      if (response.success && response.isMatch) {
        setVerificationResult({
          success: true,
          confidence: response.confidence,
          message: response.message
        });
        
        const datasetFaces = response.details?.dataset_faces_detected || 0;
        const bestSample = response.details?.best_match_sample || 'N/A';
        toast.success(`✅ Face verified! Matched ${datasetFaces} dataset samples (best: #${bestSample}) - Confidence: ${response.confidence}%`);
        
        // After face verification, mark attendance
        try {
          toast.loading('Marking attendance...');
          const attendanceResponse = await api.post('/api/attendance/face-recognition', {
            eventId: eventId,
            faceData: imageData
          });
          
          if (attendanceResponse.data.success) {
            toast.success('Attendance marked successfully with face recognition!');
            setTimeout(() => {
              onSuccess(attendanceResponse.data);
            }, 1500);
          } else {
            throw new Error(attendanceResponse.data.message || 'Failed to mark attendance');
          }
        } catch (attendanceError) {
          console.error('Attendance marking error:', attendanceError);
          toast.error(attendanceError.response?.data?.message || 'Failed to mark attendance');
          setVerificationResult({
            success: false,
            message: 'Face verified but attendance marking failed'
          });
        }
      } else {
        setVerificationResult({
          success: false,
          message: response.message || 'Face verification failed'
        });
        toast.error(`❌ ${response.message}`);
      }
    } catch (error) {
      console.error('Error verifying face:', error);
      setFaceDetected(false);
      setVerificationResult({
        success: false,
        message: 'Error verifying face'
      });
      toast.error('Failed to verify face');
    } finally {
      setIsProcessing(false);
    }
  };

  // Simple face detection function (same as in FaceTraining)
  const detectFaceInImage = async (imageData) => {
    try {
      const img = new Image();
      img.src = imageData;
      
      return new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          let faceScore = 0;
          let totalPixels = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (r > 95 && g > 40 && b > 20 && 
                Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
                Math.abs(r - g) > 15 && r > g && r > b) {
              faceScore++;
            }
            totalPixels++;
          }
          
          const faceRatio = faceScore / (totalPixels / 4);
          const hasFace = faceRatio > 0.1;
          
          console.log(`Face detection: ${(faceRatio * 100).toFixed(1)}% skin tone detected`);
          resolve(hasFace);
        };
        
        img.onerror = () => {
          console.error('Error loading image for face detection');
          resolve(false);
        };
      });
    } catch (error) {
      console.error('Face detection error:', error);
      return false;
    }
  };

  const startScanning = () => {
    if (!serverConnected) {
      toast.error('Face recognition server is not available');
      return;
    }

    setIsScanning(true);
    setVerificationResult(null);
    
    // Auto-capture after a short delay
    setTimeout(() => {
      captureFace();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <User className="w-6 h-6 mr-2" />
              Face Verification
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!serverConnected && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">
                  Face recognition server is not running. Please start the server first.
                </span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Camera Preview */}
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-gray-200 rounded-lg object-cover"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Overlay for face detection */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black bg-opacity-50 rounded-full p-4">
                    <Loader className="w-8 h-8 text-white animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Verification Result */}
            {verificationResult && (
              <div className={`p-4 rounded-lg border ${
                verificationResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center">
                  {verificationResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className={`font-medium ${
                    verificationResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {verificationResult.success ? 'Face Verified!' : 'Verification Failed'}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${
                  verificationResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {verificationResult.message}
                </p>
                {verificationResult.confidence && (
                  <p className="text-sm text-green-600 mt-1">
                    Confidence: {verificationResult.confidence.confidence || verificationResult.confidence}%
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              {!isScanning && !isProcessing && (
                <button
                  onClick={startScanning}
                  disabled={!serverConnected}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Verification
                </button>
              )}

              {isScanning && (
                <button
                  onClick={captureFace}
                  disabled={!serverConnected || isProcessing}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  {isProcessing ? 'Processing...' : 'Capture Now'}
                </button>
              )}
            </div>

            {/* Instructions */}
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Instructions:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Position your face in the camera view</li>
                <li>Make sure you have good lighting</li>
                <li>Look directly at the camera</li>
                <li>Keep your face still during verification</li>
                <li>Your face will be compared against your training data</li>
              </ul>
            </div>

            {/* Event Information */}
            {eventId && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="font-medium text-blue-700">Event Verification</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Verifying your identity for event attendance
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceVerification;