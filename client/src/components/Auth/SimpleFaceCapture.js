import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SimpleFaceCapture = ({ onCapture, onClose, isOpen, title = "Capture Your Face for Attendance" }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [quality, setQuality] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      setCameraReady(false);
      
      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video loaded:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          setCameraReady(true);
        };
        
        // Handle video errors
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          setError('Camera error. Please try again.');
          setCameraReady(false);
        };
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access to continue.');
      console.error('Camera error:', err);
      setCameraReady(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      setError('Camera not ready. Please wait a moment and try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Check video dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera not ready. Please wait a moment and try again.');
      return;
    }

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Analyze image quality
      const qualityScore = analyzeImageQuality(canvas);
      setQuality(qualityScore);

      setCapturedImage(imageData);
      setIsCapturing(false);
      
      if (qualityScore >= 0.7) {
        setSuccess(true);
        setError(null);
      } else {
        setError('Image quality is low. Please try again with better lighting.');
        setSuccess(false);
      }
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture image. Please try again.');
    }
  };

  const analyzeImageQuality = (canvas) => {
    try {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let brightness = 0;
      let contrast = 0;
      
      // Calculate brightness
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        brightness += (r + g + b) / 3;
      }
      brightness /= (data.length / 4);
      
      // Calculate contrast (simplified)
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = (r + g + b) / 3;
        sum += Math.pow(gray - brightness, 2);
      }
      contrast = Math.sqrt(sum / (data.length / 4));
      
      // Normalize quality score (0-1)
      const brightnessScore = Math.min(brightness / 128, 1);
      const contrastScore = Math.min(contrast / 50, 1);
      
      return (brightnessScore + contrastScore) / 2;
    } catch (error) {
      console.error('Quality analysis error:', error);
      return 0.5; // Default quality if analysis fails
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
    setSuccess(false);
    setQuality(null);
  };

  const confirmCapture = async () => {
    if (capturedImage && quality >= 0.7) {
      try {
        await onCapture(capturedImage, quality);
        onClose();
      } catch (error) {
        console.error('Face capture error:', error);
        setError('Failed to save face data. Please try again.');
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    setSuccess(false);
    setQuality(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            {!capturedImage ? (
              <div className="space-y-4">
                <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  {!cameraReady && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-white text-sm">Loading camera...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-gray-300 text-sm mb-4">
                    Position your face in the center of the frame with good lighting
                  </p>
                  
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={capturePhoto}
                      disabled={isCapturing || !cameraReady}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <Camera className="h-4 w-4" />
                      {isCapturing ? 'Capturing...' : 'Capture Photo'}
                    </button>
                    
                    <button
                      onClick={startCamera}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restart
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured face"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  {quality && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      Quality: {Math.round(quality * 100)}%
                    </div>
                  )}
                </div>

                {success ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Great! Image quality is good.</span>
                  </div>
                ) : error ? (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <button
                    onClick={retakePhoto}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retake
                  </button>
                  
                  {success && (
                    <button
                      onClick={confirmCapture}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SimpleFaceCapture;
