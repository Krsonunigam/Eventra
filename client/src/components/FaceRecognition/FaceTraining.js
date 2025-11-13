import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, AlertCircle, RotateCcw, X, Loader } from 'lucide-react';
import useCustomToast from '../../utils/customToast';
import faceRecognitionAPI from '../../utils/faceRecognitionAPI';
import { useAuth } from '../../contexts/AuthContext';

const FaceTraining = ({ isOpen, onComplete, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const { user } = useAuth();
  const toast = useCustomToast();

  // Face training specific toast configuration
  const faceTrainingToast = {
    success: (message) => toast.success(message, { duration: 2000, position: 'top-right', style: { fontSize: '14px', padding: '8px 12px', maxWidth: '300px' }}),
    error: (message) => toast.error(message, { duration: 2500, position: 'top-right', style: { fontSize: '14px', padding: '8px 12px', maxWidth: '300px' }}),
    info: (message) => toast.info(message, { duration: 2000, position: 'top-right', style: { fontSize: '14px', padding: '8px 12px', maxWidth: '300px' }}),
    warning: (message) => toast.warning(message, { duration: 2000, position: 'top-right', style: { fontSize: '14px', padding: '8px 12px', maxWidth: '300px' }})
  };

  const [isCapturing, setIsCapturing] = useState(false);
  const [samples, setSamples] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentSample, setCurrentSample] = useState(0);
  const [faceStatus, setFaceStatus] = useState(null);
  const [serverConnected, setServerConnected] = useState(false);

  const REQUIRED_SAMPLES = 25; // Increased for better accuracy
  const CAPTURE_INTERVAL = 1500; // Increased interval for better quality

  useEffect(() => {
    if (isOpen) {
      checkServerConnection();
      startCamera();
      loadExistingData();
    } else {
      stopCamera();
    }
    // eslint-disable-next-line
  }, [isOpen]);

  const checkServerConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setServerConnected(false);
        faceTrainingToast.error('Please log in first to use face recognition.');
        return;
      }

      const response = await faceRecognitionAPI.healthCheck();
      setServerConnected(true);
    } catch (error) {
      setServerConnected(false);

      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        faceTrainingToast.error('Please log in first to use face recognition.');
      } else if (error.message.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        faceTrainingToast.error('Cannot connect to face recognition server. Please check your connection.');
      } else {
        faceTrainingToast.error('Face recognition server is not available. Please try again.');
      }
    }
  };

  const loadExistingData = async () => {
    if (!user?.id) return;

    try {
      const response = await faceRecognitionAPI.getFaceStatus(user.id);
      if (response.success) {
        setFaceStatus(response.status);
        setCurrentSample(response.status.samples || 0);
        setSamples(Array(response.status.samples || 0).fill(null));
      }
    } catch (error) {}
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      faceTrainingToast.error('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureSample = async () => {
    if (!videoRef.current || !serverConnected) return;

    if (currentSample >= REQUIRED_SAMPLES) {
      faceTrainingToast.info(`Maximum ${REQUIRED_SAMPLES} samples already collected.`);
      setIsCapturing(false);
      return;
    }

    try {
      const imageData = faceRecognitionAPI.captureImageFromVideo(videoRef.current);
      const hasFace = await detectFaceInImage(imageData);

      if (!hasFace) {
        faceTrainingToast.error(`No face detected in sample ${currentSample + 1}. Please position your face in the camera.`);
        return;
      }

      setCurrentSample(prev => prev + 1);
      setSamples(prev => [...prev, imageData]);
      faceTrainingToast.success(`✅ Face detected! Sample ${currentSample + 1}/${REQUIRED_SAMPLES} captured`);

      if (currentSample + 1 >= REQUIRED_SAMPLES) {
        setIsCapturing(false);
        await trainModel();
      }
    } catch (error) {
      faceTrainingToast.error('Failed to capture face sample');
    }
  };

  // Simple face detection function
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
          const imageDataCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageDataCanvas.data;

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
          resolve(hasFace);
        };

        img.onerror = () => {
          resolve(false);
        };
      });
    } catch (error) {
      return false;
    }
  };

  const startAutoCapture = () => {
    if (!serverConnected) {
      faceTrainingToast.error('Face recognition server is not available');
      return;
    }

    if (!user?.id) {
      faceTrainingToast.error('User not found');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      faceTrainingToast.error('Please log in first to use face recognition');
      return;
    }

    setIsCapturing(true);
    setCurrentSample(0);
    setSamples([]);

    let captureInterval;
    let failedAttempts = 0;
    const maxFailedAttempts = 50;

    captureInterval = setInterval(async () => {
      if (currentSample >= REQUIRED_SAMPLES) {
        clearInterval(captureInterval);
        setIsCapturing(false);
        faceTrainingToast.success(`✅ Training complete! ${REQUIRED_SAMPLES} samples collected.`);
        return;
      }

      if (failedAttempts >= maxFailedAttempts) {
        clearInterval(captureInterval);
        setIsCapturing(false);
        faceTrainingToast.error('Too many failed attempts. Please ensure your face is visible in the camera.');
        return;
      }

      const previousSample = currentSample;
      await captureSample();

      if (currentSample >= REQUIRED_SAMPLES) {
        clearInterval(captureInterval);
        setIsCapturing(false);
        return;
      }

      if (currentSample === previousSample) {
        failedAttempts++;
      } else {
        failedAttempts = 0;
      }
    }, CAPTURE_INTERVAL);
  };

  const trainModel = async () => {
    if (!user?.id) return;

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      const response = await faceRecognitionAPI.addFaceSample(user.id, samples);

      if (response.success) {
        const progressInterval = setInterval(() => {
          setTrainingProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);

        await new Promise(resolve => setTimeout(resolve, 1000));

        faceTrainingToast.success('Face model trained successfully!');
        onComplete(response);
      } else {
        faceTrainingToast.error(response.message || 'Failed to train face model');
      }
    } catch (error) {
      faceTrainingToast.error('Failed to train face model');
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
    }
  };

  const resetTraining = () => {
    setSamples([]);
    setCurrentSample(0);
    setIsTraining(false);
    setTrainingProgress(0);
    faceTrainingToast.success('Training reset successfully');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Camera className="w-6 h-6 mr-2" />
              Face Training
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
                <span className="text-red-700">Face recognition server is not running. Please start the server first.</span>
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
            </div>

            {/* Progress Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Samples Collected: {currentSample} / {REQUIRED_SAMPLES}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round((currentSample / REQUIRED_SAMPLES) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentSample / REQUIRED_SAMPLES) * 100}%` }}
                />
              </div>
            </div>

            {/* Training Progress */}
            {isTraining && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Training Model: {trainingProgress}%
                  </span>
                  <Loader className="w-4 h-4 animate-spin" />
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${trainingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Status Display */}
            {faceStatus && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="font-medium text-blue-700">Current Status</span>
                </div>
                <div className="text-sm text-blue-600">
                  <p>Samples: {faceStatus.samples}</p>
                  <p>Trained: {faceStatus.trained ? 'Yes' : 'No'}</p>
                  {faceStatus.last_training && (
                    <p>Last Training: {new Date(faceStatus.last_training).toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              {!isCapturing && !isTraining && currentSample < REQUIRED_SAMPLES && (
                <button
                  onClick={startAutoCapture}
                  disabled={!serverConnected}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Training
                </button>
              )}

              {currentSample >= REQUIRED_SAMPLES && !isTraining && (
                <button
                  onClick={trainModel}
                  disabled={!serverConnected}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Train Model
                </button>
              )}

              <button
                onClick={resetTraining}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>

            {/* Instructions */}
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Instructions:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Position your face in the camera view</li>
                <li>Make sure you have good lighting</li>
                <li>Look directly at the camera</li>
                <li>Keep your face still during capture</li>
                <li>We need {REQUIRED_SAMPLES} samples for training</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceTraining;
