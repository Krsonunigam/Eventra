import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle, X, User, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import useCustomToast from '../../utils/customToast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/axiosConfig';

/**
 * FaceVerification — Fixed Version
 *
 * BUGS FIXED:
 * 1. Removed double-call: no longer calling /api/pure-face/verify separately.
 *    A single call to /api/attendance/face-recognition handles both verify + mark.
 * 2. Removed serverConnected gate — it was blocking the component when health check failed.
 * 3. Added skin-tone based face detection (client-side pre-check).
 * 4. Added retry button after failure.
 * 5. Added clear debug logs.
 */

const FaceVerification = ({ isOpen, onSuccess, onClose, eventId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const { user } = useAuth();
  const toast = useCustomToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]); // eslint-disable-line

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      
      setCameraError('Could not access camera. Please check permissions.');
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  /**
   * Client-side face detection (skin-tone heuristic).
   * This is just a pre-check — the real matching is done server-side.
   */
  const detectFaceInImage = async (imageData) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        let skinPixels = 0;
        const total = pixels.length / 4;

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          // Classic skin-tone heuristic
          if (r > 95 && g > 40 && b > 20 &&
              Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
              Math.abs(r - g) > 15 && r > g && r > b) {
            skinPixels++;
          }
        }

        const ratio = skinPixels / total;
        
        resolve(ratio > 0.08); // 8% skin pixels = likely a face present
      };
      img.onerror = () => resolve(true); // Allow on error (don't block)
      img.src = imageData;
    });
  };

  const captureFace = async () => {
    if (!videoRef.current || isProcessing) return;

    setIsProcessing(true);
    setFaceDetected(false);
    setVerificationResult(null);

    try {
      // Capture frame from video
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.85);

      

      // Pre-check: skin tone detection
      const hasFace = await detectFaceInImage(imageData);
      if (!hasFace) {
        
        setVerificationResult({ success: false, message: 'No face detected. Please position your face in the camera frame.' });
        toast.error('No face detected. Make sure your face is visible and well-lit.');
        setIsProcessing(false);
        return;
      }

      
      

      // SINGLE CALL: POST to /api/attendance/face-recognition
      // This endpoint handles BOTH face verification AND attendance marking in one step.
      const response = await api.post('/api/attendance/face-recognition', {
        eventId: eventId,
        faceData: imageData
      });

      

      if (response.data.success) {
        setFaceDetected(true);
        setVerificationResult({
          success: true,
          confidence: response.data.attendance?.confidence,
          message: response.data.message || 'Face verified! Attendance marked.'
        });
        toast.success('✅ Face recognized! Attendance marked successfully.');
        setTimeout(() => {
          onSuccess(response.data);
        }, 1500);
      } else {
        
        setVerificationResult({
          success: false,
          message: response.data.message || 'Face verification failed'
        });
        toast.error(response.data.message || 'Face not recognized');
      }
    } catch (error) {
      
      const msg = error.response?.data?.message || 'Face verification failed. Please try again.';
      setVerificationResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setVerificationResult(null);
    setTimeout(() => captureFace(), 1500); // Brief delay so user can position face
  };

  const retry = () => {
    setIsScanning(false);
    setVerificationResult(null);
    setFaceDetected(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Face Verification
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Camera Error */}
          {cameraError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{cameraError}</p>
                <button onClick={startCamera} className="text-red-600 text-xs underline mt-1">Try again</button>
              </div>
            </div>
          )}

          {/* Camera Preview */}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Face guide overlay */}
            {!verificationResult && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-40 h-48 border-2 rounded-[40px] transition-all duration-300 ${
                  faceDetected ? 'border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)]' :
                  isScanning ? 'border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]' :
                  'border-white/40'
                }`} />
              </div>
            )}

            {/* Scanning animation */}
            {isScanning && isProcessing && (
              <motion.div
                initial={{ top: '10%' }}
                animate={{ top: '90%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.8)]"
              />
            )}

            {/* Status chip */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <div className={`px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md ${
                isProcessing ? 'bg-blue-500/80 text-white' :
                faceDetected ? 'bg-green-500/80 text-white' :
                'bg-black/60 text-white'
              }`}>
                {isProcessing ? 'Scanning...' : faceDetected ? 'Face Detected ✓' : 'Position your face in frame'}
              </div>
            </div>
          </div>

          {/* Result Card */}
          <AnimatePresence>
            {verificationResult && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 rounded-xl border ${
                  verificationResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {verificationResult.success
                    ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    : <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  }
                  <div>
                    <p className={`font-semibold text-sm ${verificationResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {verificationResult.success ? 'Attendance Marked!' : 'Verification Failed'}
                    </p>
                    <p className={`text-xs mt-0.5 ${verificationResult.success ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                      {verificationResult.message}
                    </p>
                    {verificationResult.confidence != null && (
                      <p className="text-xs text-green-500 mt-0.5">
                        Confidence: {typeof verificationResult.confidence === 'number' 
                          ? `${(verificationResult.confidence * 100).toFixed(1)}%`
                          : verificationResult.confidence}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isScanning && !isProcessing && !verificationResult?.success && (
              <button
                onClick={startScanning}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Camera className="w-4 h-4" />
                {verificationResult ? 'Retry Scan' : 'Start Verification'}
              </button>
            )}

            {isScanning && isProcessing && (
              <div className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-xl py-3 flex items-center justify-center gap-2 text-blue-400">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Verifying...</span>
              </div>
            )}

            {verificationResult && !verificationResult.success && !isProcessing && (
              <button
                onClick={retry}
                className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Tips for best results:</p>
            <p>• Face the camera directly with good lighting</p>
            <p>• Remove glasses or hat if possible</p>
            <p>• Keep your face within the oval guide</p>
            <p>• The system compares your live image against your registered face samples</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FaceVerification;