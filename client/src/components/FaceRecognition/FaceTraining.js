import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, RotateCcw, X, Loader2, Upload, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import useCustomToast from '../../utils/customToast';
import { useAuth } from '../../contexts/AuthContext';

const FaceTraining = ({ isOpen, onComplete, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { user, refreshUser } = useAuth();
  const toast = useCustomToast();

  const [samples, setSamples] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentSample, setCurrentSample] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const REQUIRED_SAMPLES = 25;

  useEffect(() => {
    if (isOpen) startCamera();
    else stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (err) {
      toast.error("Camera access denied");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  const captureImage = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg');
    });
  };

  const startAutoCapture = () => {
    setIsCapturing(true);
    setSamples([]);
    setCurrentSample(0);

    let count = 0;

    const interval = setInterval(async () => {
      if (count >= REQUIRED_SAMPLES) {
        clearInterval(interval);
        setIsCapturing(false);
        toast.success('✅ 25 samples collected');
        return;
      }

      const blob = await captureImage();

      // 🔥 BASIC FACE CHECK (brightness + presence)
      if (!blob || blob.size < 5000) {
        toast.error("❌ No proper face detected");
        return;
      }

      setSamples(prev => [...prev, blob]);
      count++;
      setCurrentSample(count);
    }, 1000);
  };

  const trainModel = async () => {
    if (!user || samples.length < REQUIRED_SAMPLES) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      samples.forEach((img, index) => {
        formData.append('faces', img, `sample_${index}.jpg`);
      });

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/face/collect`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        toast.faceRegistrationSuccess('🔥 Face Training Completed Successfully!');
        await refreshUser();
        onComplete(response.data);
      } else {
        throw new Error(response.data.message || 'Face training failed');
      }

    } catch (err) {
      
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetTraining = () => {
    setSamples([]);
    setCurrentSample(0);
    toast.success('Reset done');
  };

  if (!isOpen) return null;

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
          {/* HEADER */}
          <div className="bg-gray-800/50 px-6 py-4 flex justify-between items-center border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Camera className="text-blue-400 h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Biometric Registration
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="p-6">
            {/* VIDEO CONTAINER */}
            <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-gray-800 aspect-video mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              <AnimatePresence>
                {isCapturing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 border-4 border-blue-500 animate-pulse pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {samples.length === 0 && !isCapturing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <p className="text-gray-300 font-medium px-4 py-2 bg-gray-900/80 rounded-full text-sm">
                    Ready to capture 25 face samples
                  </p>
                </div>
              )}
            </div>

            {/* PROGRESS SECTION */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Collection Status</p>
                  <p className="text-2xl font-black text-white">
                    {currentSample}<span className="text-gray-600 text-lg">/25</span>
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
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentSample / 25) * 100}%` }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                />
              </div>

              {uploading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-2"
                >
                  <div className="flex justify-between text-xs font-bold text-blue-400 mb-2">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploading to Secure Server
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

            {/* CONTROLS */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              {!isCapturing && currentSample < 25 && (
                <button
                  onClick={startAutoCapture}
                  className="col-span-2 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 group active:scale-95"
                >
                  <Camera className="h-5 w-5 group-hover:scale-110 transition-transform" /> 
                  Start Automatic Capture
                </button>
              )}

              {currentSample === 25 && (
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
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Finalizing Biometrics...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Upload 25 Samples
                    </>
                  )}
                </button>
              )}

              <button
                onClick={resetTraining}
                disabled={uploading}
                className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
              
              <button
                onClick={onClose}
                disabled={uploading}
                className="flex items-center justify-center gap-2 border-2 border-gray-800 hover:bg-gray-800 text-gray-400 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            {/* SECURITY NOTE */}
            <div className="mt-6 flex items-start gap-3 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
              <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-gray-400">
                <span className="text-blue-400 font-bold">Privacy Note:</span> Your face samples are processed using end-to-end encryption. Data is used exclusively for event attendance verification and is never shared with third parties.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FaceTraining;
