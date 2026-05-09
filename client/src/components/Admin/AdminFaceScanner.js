import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  CheckCircle, 
  X, 
  AlertCircle, 
  Scan, 
  User, 
  ShieldCheck,
  Zap,
  Activity,
  QrCode
} from 'lucide-react';
import useCustomToast from '../../utils/customToast';
import faceRecognitionAPI from '../../utils/faceRecognitionAPI';
import api from '../../utils/axiosConfig';

const AdminFaceScanner = ({ onClose, onSuccess, onSwitchToQR, eventId, eventTitle }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const toast = useCustomToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    checkServerConnection();
    startCamera();
    return () => stopCamera();
  }, []);

  const checkServerConnection = async () => {
    try {
      const res = await api.get('/api/pure-face/health');
      const ok = res.data?.status === 'healthy' || res.data?.ok === true || res.status === 200;
      setServerConnected(ok);
      
    } catch (error) {
      // Don't block — server might still work for verify even if health times out
      setServerConnected(false);
      
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureAndRecognize = async () => {
    // Allow even if serverConnected=false — let the API call fail naturally with a proper error
    if (!videoRef.current || isProcessing) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.85);

      
      

      const recognizeResponse = await api.post('/api/pure-face/recognize', { faceData: imageData });

      
      
      
      
      
      if (recognizeResponse.data.success && recognizeResponse.data.userId) {
        const userId = recognizeResponse.data.userId;
        
        
        
        const attendanceResponse = await api.post('/api/attendance/face-check-in', {
          targetEventId: eventId,
          userId
        });
        
        
        
        if (attendanceResponse.data.success) {
          setResult({ 
            success: true, 
            message: `Attendance marked for ${attendanceResponse.data.student?.name || 'Student'}`,
            student: attendanceResponse.data.student
          });
          toast.success('Face verified! Attendance marked.');
          
          if (onSuccess) onSuccess(attendanceResponse.data);
          setTimeout(() => onClose(), 3000);
        } else {
          throw new Error(attendanceResponse.data.message || 'Failed to mark attendance');
        }
      } else {
        const reason = recognizeResponse.data?.message || 'Face not found in event registry';
        
        setResult({ success: false, message: reason });
        toast.error(`Face not recognized: ${reason}`);
      }
    } catch (error) {
      
      setResult({ 
        success: false, 
        message: error.response?.data?.message || error.message || 'Verification Error' 
      });
      toast.error(error.response?.data?.message || 'Face scan failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-lg overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-2xl border border-blue-500/30">
              <Scan className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight italic">BIOMETRIC <span className="text-blue-500">SCAN</span></h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{eventTitle || 'Eventra Security'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8">
          {/* Camera Viewport */}
          <div className="relative rounded-[2rem] overflow-hidden bg-black aspect-square border border-white/10 mb-8 group">
            {!serverConnected ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-10 text-center">
                <AlertCircle className="h-12 w-12 mb-4 text-red-500 animate-pulse" />
                <h3 className="text-white font-bold mb-2">System Offline</h3>
                <p className="text-sm">The face recognition engine is not responding. Please contact support.</p>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                
                {/* HUD Elements */}
                <div className="absolute inset-0 pointer-events-none p-6">
                  {/* Corners */}
                  <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-blue-500/50 rounded-tl-xl"></div>
                  <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-blue-500/50 rounded-tr-xl"></div>
                  <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-blue-500/50 rounded-bl-xl"></div>
                  <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-blue-500/50 rounded-br-xl"></div>
                  
                  {/* Scanning Line */}
                  <AnimatePresence>
                    {isProcessing && (
                      <motion.div 
                        initial={{ top: '10%' }}
                        animate={{ top: '90%' }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute left-6 right-6 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10"
                      />
                    )}
                  </AnimatePresence>

                  {/* Status Overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-48 h-48 border border-white/20 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-40 h-40 border border-white/10 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Results Overlay */}
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`absolute bottom-6 left-6 right-6 p-4 rounded-2xl backdrop-blur-xl border flex items-center gap-4 ${
                    result.success ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-red-500/20 border-red-500/40'
                  }`}
                >
                  <div className={`p-2 rounded-full ${result.success ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {result.success ? <CheckCircle className="h-4 w-4 text-white" /> : <AlertCircle className="h-4 w-4 text-white" />}
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-widest ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.success ? 'Access Granted' : 'Access Denied'}
                    </p>
                    <p className="text-sm text-white font-medium">{result.message}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={captureAndRecognize}
              disabled={isProcessing || !cameraActive}
              className={`w-full py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center transition-all ${
                isProcessing || !cameraActive
                  ? 'bg-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/20'
              }`}
            >
              {isProcessing ? (
                <Activity className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Zap className="h-5 w-5 mr-2 text-yellow-400" />
              )}
              {isProcessing ? 'Verifying...' : 'Analyze Face'}
            </button>
            
            <div className="flex gap-3">
              <button 
                onClick={onSwitchToQR}
                className="flex-1 py-5 rounded-[1.5rem] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-black uppercase text-[10px] tracking-widest transition-all border border-emerald-500/20 flex items-center justify-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                Use QR Instead
              </button>
              
              <button 
                onClick={onClose}
                className="px-8 py-5 rounded-[1.5rem] bg-white/5 hover:bg-white/10 text-gray-400 transition-all border border-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-6 opacity-30 grayscale">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Secure Data</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">AI Powered</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminFaceScanner;
