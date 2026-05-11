import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CheckCircle, RotateCcw, X, Loader2, Upload, AlertCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import useCustomToast from '../../utils/customToast';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';

const REQUIRED_SAMPLES = 25;
const CAPTURE_INTERVAL_MS = 800; // ms between captures

const FaceTraining = ({ isOpen, onComplete, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const { user, refreshUser, updateUserState } = useAuth();
  const toast = useCustomToast();

  const [samples, setSamples] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentSample, setCurrentSample] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);

  // ── Camera lifecycle ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      clearCapture();
    }
    return () => {
      stopCamera();
      clearCapture();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      toast.error('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const clearCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsCapturing(false);
  };

  // ── Capture a single frame from the video ────────────────────────────────
  const captureImage = () => {
    return new Promise(resolve => {
      if (!videoRef.current) return resolve(null);

      // Optimised: capture at 320×240 to reduce payload size
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.8); // 80% quality
    });
  };

  // ── Auto-capture 25 samples at intervals ─────────────────────────────────
  const startAutoCapture = () => {
    setIsCapturing(true);
    setSamples([]);
    setCurrentSample(0);
    setUploadDone(false);

    let count = 0;
    const capturedBlobs = [];

    intervalRef.current = setInterval(async () => {
      if (count >= REQUIRED_SAMPLES) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsCapturing(false);
        toast.success('✅ 25 samples collected! Ready to upload.');
        return;
      }

      const blob = await captureImage();
      if (!blob || blob.size < 3000) return; // skip blank/tiny frames

      capturedBlobs.push(blob);
      setSamples(prev => [...prev, blob]);
      count++;
      setCurrentSample(count);
    }, CAPTURE_INTERVAL_MS);
  };

  // ── Upload samples to backend ─────────────────────────────────────────────
  const trainModel = async () => {
    if (!user || samples.length < REQUIRED_SAMPLES) {
      toast.error(`Please capture ${REQUIRED_SAMPLES} samples first`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      samples.forEach((img, i) => formData.append('faces', img, `face_${i}.jpg`));

      const response = await axios.post(`${API_BASE_URL}/api/face/collect`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 120000, // 2 min timeout for 25 uploads
        onUploadProgress: e => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(pct);
        }
      });

      if (response.data.success) {
        // 1. Immediately patch AuthContext user state so dashboard updates NOW
        if (response.data.user) {
          updateUserState({
            faceDataCollected: true,
            faceTrainingCompleted: true,
            isFaceVerified: true,
            faceSampleCount: response.data.user.faceSampleCount,
            faceDataQuality: response.data.user.faceDataQuality,
            faceTrainingDate: response.data.user.faceTrainingDate
          });
        }

        // 2. Also do a full server refresh in the background (fire & forget)
        refreshUser().catch(() => {});

        setUploadDone(true);
        toast.success('🔥 Face Training Completed Successfully!');

        // Short delay so user sees the success state, then call onComplete
        setTimeout(() => {
          onComplete(response.data);
        }, 1200);
      } else {
        throw new Error(response.data.message || 'Face training failed');
      }
    } catch (err) {
      console.error('Face upload error:', err);
      const msg = err.response?.data?.message || err.message || 'Upload failed. Please retry.';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetTraining = () => {
    clearCapture();
    setSamples([]);
    setCurrentSample(0);
    setUploadDone(false);
    toast.success('Reset done. Ready to capture again.');
  };

  if (!isOpen) return null;

  const progress = (currentSample / REQUIRED_SAMPLES) * 100;
  const allCollected = currentSample >= REQUIRED_SAMPLES;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gray-900 text-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-800"
        >
          {/* Header */}
          <div className="bg-gray-800/50 px-6 py-4 flex justify-between items-center border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Camera className="text-blue-400 h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Biometric Registration
              </h2>
            </div>
            <button onClick={onClose} disabled={uploading} className="p-2 hover:bg-gray-700 rounded-full transition-colors disabled:opacity-40">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="p-6">
            {/* Success overlay */}
            {uploadDone ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10 gap-4"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-400" />
                </div>
                <h3 className="text-2xl font-black text-white">Training Complete!</h3>
                <p className="text-gray-400 text-center">
                  Your face has been registered successfully. You can now use face recognition for attendance.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Video */}
                <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-gray-800 aspect-video mb-6">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                  {isCapturing && (
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 border-4 border-blue-500 pointer-events-none rounded-2xl"
                    />
                  )}

                  {!isCapturing && samples.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <p className="text-gray-300 font-medium px-4 py-2 bg-gray-900/80 rounded-full text-sm">
                        Ready to capture {REQUIRED_SAMPLES} face samples
                      </p>
                    </div>
                  )}

                  {isCapturing && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      REC
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Collection Status</p>
                      <p className="text-2xl font-black text-white">
                        {currentSample}<span className="text-gray-600 text-lg">/{REQUIRED_SAMPLES}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Quality</p>
                      <p className="text-sm font-bold text-green-400 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Optimized
                      </p>
                    </div>
                  </div>

                  <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    />
                  </div>

                  {allCollected && !uploading && (
                    <p className="text-center text-green-400 text-sm font-semibold">
                      ✅ All samples collected. Click upload to complete setup.
                    </p>
                  )}

                  {/* Upload progress bar */}
                  {uploading && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="flex justify-between text-xs font-bold text-blue-400 mb-1.5">
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Uploading to Secure Server...
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${uploadProgress}%` }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-3">
                  {!isCapturing && !allCollected && (
                    <button
                      onClick={startAutoCapture}
                      disabled={uploading}
                      className="col-span-2 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50"
                    >
                      <Camera className="h-5 w-5" />
                      Start Automatic Capture
                    </button>
                  )}

                  {isCapturing && (
                    <button
                      onClick={clearCapture}
                      className="col-span-2 flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
                    >
                      Stop Capture
                    </button>
                  )}

                  {allCollected && !isCapturing && (
                    <button
                      onClick={trainModel}
                      disabled={uploading}
                      className={`col-span-2 flex items-center justify-center gap-3 font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 ${
                        uploading
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20'
                      }`}
                    >
                      {uploading ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Finalizing Biometrics...</>
                      ) : (
                        <><Upload className="h-5 w-5" /> Upload {REQUIRED_SAMPLES} Samples</>
                      )}
                    </button>
                  )}

                  <button
                    onClick={resetTraining}
                    disabled={uploading}
                    className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl transition-colors disabled:opacity-40"
                  >
                    <RotateCcw className="h-4 w-4" /> Reset
                  </button>

                  <button
                    onClick={onClose}
                    disabled={uploading}
                    className="flex items-center justify-center gap-2 border-2 border-gray-800 hover:bg-gray-800 text-gray-400 font-bold py-3 rounded-xl transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Privacy Note */}
            <div className="mt-5 flex items-start gap-3 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
              <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-gray-400">
                <span className="text-blue-400 font-bold">Privacy Note:</span> Your face samples are processed
                using end-to-end encryption. Data is used exclusively for event attendance verification and is
                never shared with third parties.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FaceTraining;
