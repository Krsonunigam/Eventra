import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, QrCode, CheckCircle, AlertCircle, Upload, Scan,
  RefreshCw, User, Clock, Zap
} from 'lucide-react';
import useCustomToast from '../../utils/customToast';
import api from '../../utils/axiosConfig';
import QrScanner from 'qr-scanner';

/**
 * AdminHybridScanner — Fixed Version
 * 
 * BUGS FIXED:
 * 1. Replaced BarcodeDetector (Chrome-only, unreliable) with qr-scanner library
 * 2. Fixed race condition: QrScanner starts after video metadata loads
 * 3. Fixed isProcessing guard to prevent duplicate API calls
 * 4. Face recognition: removed hard dependency on serverConnected gate
 * 5. Added proper cleanup on unmount / step change
 */

const AdminHybridScanner = ({ onClose, onSuccess, eventId, eventTitle }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const qrScannerRef = useRef(null);
  const processingRef = useRef(false); // Use ref (not state) to prevent stale closures in QR callback
  const toast = useCustomToast();
  
  const [step, setStep] = useState('face'); // 'face' | 'qr'
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing camera...');
  const [manualBookingId, setManualBookingId] = useState('');
  const [scanResult, setScanResult] = useState(null); // { success, message, studentName }
  const [cameraReady, setCameraReady] = useState(false);

  // ─── CAMERA ────────────────────────────────────────────────────────────────

  const startCamera = useCallback(async (facing = 'user') => {
    // Stop any existing stream/scanner first
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    setScanResult(null);
    setStatusMessage('Initializing camera...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: facing } 
      });
      
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      // Wait for metadata BEFORE starting QrScanner
      videoRef.current.onloadedmetadata = () => {
        setCameraReady(true);
        setStatusMessage(facing === 'user' ? 'Ready — click Capture Face' : 'Scanning for QR code...');
        // Start QR scanner only in QR step
        if (facing === 'environment') {
          startQRScannerLib();
        }
      };
    } catch (err) {
      
      setStatusMessage('Camera unavailable');
      toast.error('Could not access camera. Use image upload or manual entry.');
      setCameraReady(false);
    }
  }, []); // eslint-disable-line

  const stopAll = useCallback(() => {
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      } catch (_) {}
      qrScannerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }, []);

  useEffect(() => {
    const facing = step === 'face' ? 'user' : 'environment';
    startCamera(facing);
    return () => stopAll();
  }, [step]); // eslint-disable-line

  // ─── QR SCANNER (qr-scanner library) ───────────────────────────────────────

  const startQRScannerLib = () => {
    if (!videoRef.current || qrScannerRef.current) return;

    
    qrScannerRef.current = new QrScanner(
      videoRef.current,
      (result) => {
        const text = typeof result === 'string' ? result : result?.data;
        if (!text) return;
        if (processingRef.current) {
          
          return;
        }
        
        processQRCode(text);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
        preferredCamera: 'environment',
      }
    );

    qrScannerRef.current.start().then(() => {
      
    }).catch(err => {
      
      setStatusMessage('QR scanner failed — use image upload');
    });
  };

  // ─── QR CODE PROCESSING ─────────────────────────────────────────────────────

  const processQRCode = async (qrData) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setScanResult(null);
    setStatusMessage('Verifying QR Code...');

    try {
      // Parse JSON if possible
      let payloadQR = qrData;
      if (typeof qrData === 'string') {
        try { payloadQR = JSON.parse(qrData); } catch (_) { /* keep raw string */ }
      }

      
      

      const response = await api.post('/api/attendance/admin/qr-scan', {
        qrData: payloadQR,
        targetEventId: eventId || undefined
      });

      

      if (response.data.success) {
        const studentName = response.data.student?.name || 'Student';
        setScanResult({ success: true, message: `✅ ${studentName} — Attendance Marked!` });
        setStatusMessage('Attendance Marked ✅');
        toast.success(`Attendance marked for ${studentName}`);
        setTimeout(() => {
          if (onSuccess) onSuccess(response.data);
        }, 1800);
      } else {
        setScanResult({ success: false, message: response.data.message || 'Verification failed' });
        setStatusMessage('Verification Failed ❌');
        toast.error(response.data.message || 'Failed to mark attendance');
        setTimeout(() => {
          setStatusMessage('Scanning for QR code...');
          setScanResult(null);
        }, 3000);
      }
    } catch (error) {
      
      const msg = error.response?.data?.message || 'Failed to process QR code';
      setScanResult({ success: false, message: msg });
      setStatusMessage('Error ❌');
      if (error.response?.data?.alreadyMarked) {
        toast.warning(msg);
      } else {
        toast.error(msg);
      }
      setTimeout(() => {
        setStatusMessage('Scanning for QR code...');
        setScanResult(null);
      }, 3000);
    } finally {
      // Wait a bit before allowing next scan (prevents duplicate scans)
      setTimeout(() => {
        processingRef.current = false;
        setIsProcessing(false);
      }, 2500);
    }
  };

  // ─── FACE RECOGNITION ──────────────────────────────────────────────────────

  const handleFaceCapture = async () => {
    if (!videoRef.current || !cameraReady || isProcessing) return;

    setIsProcessing(true);
    setScanResult(null);
    setStatusMessage('Scanning face...');
    
    

    try {
      // Capture image from video
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.85);

      
      

      const recognizeResponse = await api.post('/api/pure-face/recognize', { faceData: imageData });

      
      

      if (recognizeResponse.data.success && recognizeResponse.data.userId) {
        const userId = recognizeResponse.data.userId;
        

        setStatusMessage('Face Matched ✅ — Marking Attendance...');

        const attendanceResponse = await api.post('/api/attendance/face-check-in', {
          targetEventId: eventId,
          userId
        });

        

        if (attendanceResponse.data.success) {
          const studentName = attendanceResponse.data.student?.name || 
            (attendanceResponse.data.isOverride ? `Biometric ID …${userId.slice(-6)}` : 'Student');
          const isOverride = attendanceResponse.data.isOverride;
          const needsSync = attendanceResponse.data.needsSync;

          setScanResult({ 
            success: true, 
            message: isOverride
              ? `⚠️ Override: ${attendanceResponse.data.message || 'Attendance marked (stale biometrics — re-register this user)'}`
              : `✅ ${studentName} — Attendance Marked via Face!`
          });
          setStatusMessage(isOverride ? 'Override ⚠️' : 'Done ✅');

          if (needsSync) {
            toast.warning(`Stale biometric data (userId: ${userId.slice(-6)}). Attendance marked via override — please re-register this user's face.`);
          } else {
            toast.success(`Face verified! Attendance marked for ${studentName}`);
          }
          setTimeout(() => { if (onSuccess) onSuccess(attendanceResponse.data); }, 2000);
        } else {
          throw new Error(attendanceResponse.data.message);
        }
      } else {
        const msg = recognizeResponse.data?.message || 'Face not recognized in registry';
        
        setScanResult({ success: false, message: msg });
        setStatusMessage('Face Not Matched ❌');
        toast.error('Face not recognized. Switching to QR mode.');
        setTimeout(() => setStep('qr'), 2000);
      }
    } catch (error) {
      
      const msg = error.response?.data?.message || error.message || 'Face verification failed';
      setScanResult({ success: false, message: msg });
      setStatusMessage('Error — Switching to QR');
      toast.error('Face scan failed. Please use QR code.');
      setTimeout(() => setStep('qr'), 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── FILE UPLOAD (QR image) ─────────────────────────────────────────────────

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = null;

    setIsProcessing(true);
    setStatusMessage('Analyzing QR image...');

    try {
      
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      const text = typeof result === 'string' ? result : result?.data;
      if (text) {
        
        await processQRCode(text);
      } else {
        toast.error('No QR code found in image');
        setStatusMessage('No QR found — try another image');
        setIsProcessing(false);
      }
    } catch (err) {
      
      toast.error('Could not read QR from image. Make sure the QR code is clear.');
      setStatusMessage('Scan failed');
      setIsProcessing(false);
    }
  };

  // ─── MANUAL BOOKING ID ──────────────────────────────────────────────────────

  const submitManualBooking = async () => {
    if (!manualBookingId?.trim()) {
      toast.error('Please enter a Booking ID');
      return;
    }
    await processQRCode({ bookingId: manualBookingId.trim() });
    setManualBookingId('');
  };

  // ─── UI ─────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div className="bg-[#0d1117] rounded-2xl w-full max-w-4xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row">
        
        {/* LEFT — CAMERA */}
        <div className="md:w-1/2 bg-black relative flex flex-col min-h-[320px] md:min-h-0">
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 p-3 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                <Camera className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-white text-sm font-medium truncate max-w-[160px]">{eventTitle || 'Event Attendance'}</span>
            </div>
            <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${cameraReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {cameraReady ? '● LIVE' : '○ INIT'}
            </div>
          </div>

          {/* Video */}
          <div className="relative flex-1 flex items-center justify-center bg-gray-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${cameraReady ? 'opacity-100' : 'opacity-20'} ${step === 'face' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Overlays */}
            {cameraReady && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {step === 'face' ? (
                  <div className={`w-44 h-52 border-2 rounded-[40px] transition-colors ${isProcessing ? 'border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'border-white/30'}`}>
                    {isProcessing && <div className="absolute inset-0 bg-blue-500/10 rounded-[40px] animate-pulse" />}
                  </div>
                ) : (
                  <div className="w-44 h-44 relative">
                    <div className="absolute inset-0 border-2 border-emerald-400 rounded-lg" />
                    <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-emerald-400 rounded-tl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-emerald-400 rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-emerald-400 rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-emerald-400 rounded-br" />
                    {isProcessing && (
                      <motion.div
                        initial={{ top: '0%' }}
                        animate={{ top: '100%' }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Result overlay */}
            <AnimatePresence>
              {scanResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`absolute bottom-4 left-4 right-4 p-3 rounded-xl backdrop-blur-md border flex items-center gap-3 ${
                    scanResult.success 
                      ? 'bg-emerald-500/20 border-emerald-500/40' 
                      : 'bg-red-500/20 border-red-500/40'
                  }`}
                >
                  {scanResult.success 
                    ? <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" /> 
                    : <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  }
                  <p className="text-white text-sm font-medium">{scanResult.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status bar */}
            <div className="absolute bottom-0 left-0 right-0 py-2 px-3 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-center text-xs font-medium text-white/70">{statusMessage}</p>
            </div>
          </div>
        </div>

        {/* RIGHT — ACTIONS */}
        <div className="md:w-1/2 p-6 flex flex-col relative bg-[#0d1117]">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-2xl font-bold text-white mb-1">Smart Scanner</h2>
          <p className="text-gray-400 text-sm mb-6">Scan faces or QR codes to mark attendance instantly.</p>

          {/* Step Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6">
            <button
              onClick={() => setStep('face')}
              className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                step === 'face' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Scan className="h-4 w-4" />
              Face
            </button>
            <button
              onClick={() => setStep('qr')}
              className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                step === 'qr' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <QrCode className="h-4 w-4" />
              QR Code
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {step === 'face' ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-blue-300 text-xs">
                    <strong>How it works:</strong> The system captures your face and matches it against registered students. Make sure the student is looking directly at the camera with good lighting.
                  </p>
                </div>

                {/* Debug info */}
                <div className="p-2 bg-black/40 rounded-lg font-mono text-xs text-gray-500 space-y-0.5">
                  <p>● Camera: {cameraReady ? <span className="text-green-400">ready</span> : <span className="text-yellow-400">loading...</span>}</p>
                  <p>● Mode: Face recognition (pixel feature matching)</p>
                  <p>● Event: {eventId ? eventId.slice(-8) : 'auto-detect'}</p>
                </div>

                <button
                  onClick={handleFaceCapture}
                  disabled={isProcessing || !cameraReady}
                  className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                    isProcessing || !cameraReady
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20'
                  }`}
                >
                  {isProcessing ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Verifying Face...</>
                  ) : (
                    <><Zap className="h-4 w-4 text-yellow-400" /> Capture &amp; Recognize Face</>
                  )}
                </button>

                <button
                  onClick={() => setStep('qr')}
                  className="w-full py-2.5 text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  Switch to QR Code instead →
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-emerald-300 text-xs">
                    <strong>QR Mode active.</strong> The camera is scanning continuously. Hold the student's QR code in frame, or upload/enter manually below.
                  </p>
                </div>

                {/* Upload QR image */}
                <label className="relative block cursor-pointer">
                  <div className="p-4 border-2 border-dashed border-white/20 hover:border-emerald-500/50 rounded-xl flex flex-col items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors">
                    <Upload className="h-5 w-5" />
                    <span className="text-sm font-medium">Upload QR Screenshot</span>
                    <span className="text-xs opacity-50">JPG, PNG, WEBP</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isProcessing}
                  />
                </label>

                {/* Manual Booking ID */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      value={manualBookingId}
                      onChange={e => setManualBookingId(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitManualBooking()}
                      placeholder="Enter Booking ID..."
                      className="w-full pl-9 pr-3 py-3 bg-black/50 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder-gray-600 text-sm"
                    />
                  </div>
                  <button
                    onClick={submitManualBooking}
                    disabled={isProcessing || !manualBookingId.trim()}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-colors"
                  >
                    Mark
                  </button>
                </div>

                <button
                  onClick={() => setStep('face')}
                  className="w-full py-2.5 text-sm text-gray-400 hover:text-blue-400 transition-colors"
                >
                  ← Back to Face Recognition
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1"><User className="h-3 w-3" /> Eventra Security</div>
            <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminHybridScanner;
