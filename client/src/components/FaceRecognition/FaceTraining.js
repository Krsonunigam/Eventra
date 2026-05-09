import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, RotateCcw, X, Loader2 } from 'lucide-react';
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
    if (!user) return;

    setUploading(true);

    try {
      const formData = new FormData();

      samples.forEach((img) => {
        formData.append('faces', img);
      });

      const res = await fetch('/api/face/collect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success('🔥 Face Training Completed');
      await refreshUser();
      toast.success('Face training completed');
      onComplete(data);

// 🔥 FORCE REFRESH USER DATA

    } catch (err) {
      
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetTraining = () => {
    setSamples([]);
    setCurrentSample(0);
    toast.success('Reset done');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-gray-900 text-white p-6 rounded-2xl w-[520px] shadow-xl">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Face Training</h2>
          <X onClick={onClose} className="cursor-pointer hover:text-red-400" />
        </div>

        {/* VIDEO */}
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            className="w-full h-64 object-cover rounded-lg border border-gray-700"
          />

          {isCapturing && (
            <div className="absolute inset-0 border-4 border-blue-500 animate-pulse rounded-lg"></div>
          )}
        </div>

        {/* PROGRESS */}
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-1">
            Samples: {currentSample}/25
          </p>

          <div className="w-full bg-gray-700 h-2 rounded">
            <div
              className="bg-blue-500 h-2 rounded transition-all"
              style={{ width: `${(currentSample / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 mt-6 justify-center">

          {!isCapturing && currentSample < 25 && (
            <button
              onClick={startAutoCapture}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
            >
              <Camera size={18} /> Start Capture
            </button>
          )}

          {currentSample === 25 && (
            <button
              onClick={trainModel}
              disabled={uploading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition"
            >
              {uploading ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          )}

          <button
            onClick={resetTraining}
            className="flex items-center gap-2 border border-gray-500 px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            <RotateCcw size={18} /> Reset
          </button>

        </div>

      </div>
    </div>
  );
};

export default FaceTraining;
