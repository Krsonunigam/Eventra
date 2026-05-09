import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Calendar, 
  User, 
  Shield,
  Users,
  Eye,
  Upload,
  FileImage
} from 'lucide-react';
import useCustomToast from '../../utils/customToast';
import api from '../../utils/axiosConfig';
import QrScanner from 'qr-scanner';

const AdminQRScanner = ({ onClose, onSuccess, eventId, eventTitle }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const scanAnimRef = useRef(null);
  const toast = useCustomToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [manualBookingId, setManualBookingId] = useState('');
  const [supportsDetector, setSupportsDetector] = useState(false);
  const [laserY, setLaserY] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  // 30-second event lock state
  const [eventLockActive, setEventLockActive] = useState(false);
  const [eventLockRemaining, setEventLockRemaining] = useState(0);
  const eventLockTimerRef = useRef(null);
  const eventLockCountdownRef = useRef(null);

  // Live decode feedback
  const [lastDecodedRaw, setLastDecodedRaw] = useState(null);
  const [lastDecodedParsed, setLastDecodedParsed] = useState(null);
  const [lastApiError, setLastApiError] = useState(null);

  const scannerRef = useRef(null);
  const processingRef = useRef(false); // Ref to avoid stale closure in QrScanner callback

  // Start 30-second event lock after successful scan
  const startEventLock = () => {
    // Clear any existing timers
    clearTimeout(eventLockTimerRef.current);
    clearInterval(eventLockCountdownRef.current);

    setEventLockActive(true);
    setEventLockRemaining(30);

    // Countdown every second
    let remaining = 30;
    eventLockCountdownRef.current = setInterval(() => {
      remaining -= 1;
      setEventLockRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(eventLockCountdownRef.current);
      }
    }, 1000);

    // Release lock after 30s
    eventLockTimerRef.current = setTimeout(() => {
      setEventLockActive(false);
      setEventLockRemaining(0);
    }, 30000);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(eventLockTimerRef.current);
      clearInterval(eventLockCountdownRef.current);
    };
  }, []);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      scannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          if (!result) return;
          const text = result.data;
          // Use ref (not state) to avoid stale closure bug — state reads always give initial value here
          if (!text || processingRef.current) {
            
            return;
          }
          
          setScannedData(text);
          await processQRCode(text);
          setTimeout(() => { setScannedData(null); }, 5000);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
          preferredCamera: 'environment'
        }
      );

      await scannerRef.current.start();
      setIsScanning(true);
      startLaserAnimation();
    } catch (error) {
      
      toast.error('Could not start camera. Please check permissions.');
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const startLaserAnimation = () => {
    const animate = () => {
      setLaserY(prev => (prev >= 250 ? 0 : prev + 4));
      scanAnimRef.current = requestAnimationFrame(animate);
    };
    if (scanAnimRef.current) cancelAnimationFrame(scanAnimRef.current);
    scanAnimRef.current = requestAnimationFrame(animate);
  };

  const processQRCode = async (qrData) => {
    if (processingRef.current) {
      
      return;
    }
    processingRef.current = true;
    setIsProcessing(true);
    setScanCount(prev => prev + 1);
    setLastApiError(null);
    
    try {
      
      
      // Show raw decode immediately
      setLastDecodedRaw(qrData);
      
      let payloadQR = qrData;
      try {
        payloadQR = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        
        setLastDecodedParsed(payloadQR);
      } catch (_) {
        
        setLastDecodedParsed({ raw: qrData });
      }

      

      const response = await api.post('/api/attendance/admin/qr-scan', {
        qrData: payloadQR,
        targetEventId: eventId
      });

      

      if (response.data.success) {
        setAttendanceResult({ success: true, data: response.data });
        toast.success(`Access Granted: ${response.data.student?.name || 'Student'}`);
        if (onSuccess) onSuccess(response.data);
        startEventLock(); // Start 30s event lock
        setTimeout(() => { setAttendanceResult(null); setScannedData(null); }, 4000);
      } else {
        setLastApiError(response.data.message || 'Marking failed');
        setAttendanceResult({ success: false, message: response.data.message });
        toast.error(response.data.message || 'Attendance marking failed');
        setTimeout(() => { setAttendanceResult(null); }, 3000);
      }
    } catch (error) {
      
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
      const isAlreadyMarked = error.response?.data?.alreadyMarked;
      setLastApiError(errorMessage);
      setAttendanceResult({ success: false, message: errorMessage, alreadyMarked: isAlreadyMarked });
      if (isAlreadyMarked) {
        toast.warning(errorMessage);
      } else {
        toast.error(errorMessage);
      }
      setTimeout(() => { setAttendanceResult(null); }, 4000);
    } finally {
      // Hold lock for 2.5s to prevent duplicate scans of the same QR
      setTimeout(() => {
        processingRef.current = false;
        setIsProcessing(false);
      }, 2500);
    }
  };

  const submitManualBooking = async () => {
    if (!manualBookingId?.trim()) {
      toast.error('Please enter a Booking ID or Verification Code');
      return;
    }
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    try {
      const input = manualBookingId.trim();
      // Support: full ObjectId bookingId, 8-char verificationCode, or 6-digit code
      const isObjectId = /^[a-fA-F0-9]{24}$/.test(input);
      const payload = isObjectId 
        ? { bookingId: input } 
        : { verificationCode: input };  // treat as verificationCode for shorter codes

      
      const response = await api.post('/api/attendance/admin/qr-scan', {
        qrData: payload,
        targetEventId: eventId
      });
      if (response.data.success) {
        setAttendanceResult({ success: true, data: response.data });
        toast.success(`Attendance marked: ${response.data.student?.name || 'Student'}`);
        if (onSuccess) onSuccess(response.data);
        setManualBookingId('');
        setTimeout(() => { setAttendanceResult(null); }, 3000);
      } else {
        toast.error(response.data.message || 'Failed to mark attendance');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
      const isAlreadyMarked = error.response?.data?.alreadyMarked;
      if (isAlreadyMarked) {
        toast.warning(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setTimeout(() => { processingRef.current = false; setIsProcessing(false); }, 1000);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploading(true);
    setUploadedFile(file);

    try {
      // Use QrScanner to decode QR from image
      const result = await QrScanner.scanImage(file);
      if (result) {
        setScannedData(result);
        await processQRCode(result);
      } else {
        toast.error('No QR code found in the image');
      }
    } catch (error) {
      
      toast.error('Failed to scan QR code from image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const fakeEvent = { target: { files: [file] } };
        handleFileUpload(fakeEvent);
      } else {
        toast.error('Please drop an image file');
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const scanQRCode = () => {
    // For demo purposes, simulate QR code scanning
    // In a real app, you would use a QR code scanning library like 'qr-scanner'
    if (supportsDetector) return; // real-time scanning active

    // Mock QR data for testing - this would come from the student's event pass QR code
    const mockQRData = JSON.stringify({
      bookingId: '68d5f8257b1fb94676ea978a',
      eventId: eventId || '68d5f72face2975573e7d300',
      userId: '68d3af4a1585053c6daee637',
      verificationCode: 'TEST_1758853157726'
    });

    setScannedData(mockQRData);
    processQRCode(mockQRData);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const resetScanner = () => {
    setAttendanceResult(null);
    setScannedData(null);
    setIsProcessing(false);
    setLastDecodedRaw(null);
    setLastDecodedParsed(null);
    setLastApiError(null);
    // Also release event lock
    clearTimeout(eventLockTimerRef.current);
    clearInterval(eventLockCountdownRef.current);
    setEventLockActive(false);
    setEventLockRemaining(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
    >
      <div className="bg-[#0f0f0f] w-full h-full md:h-[95vh] md:w-[98vw] md:max-w-7xl md:rounded-3xl overflow-hidden border-none md:border md:border-white/10 shadow-2xl flex flex-col md:flex-row">
        
        {/* LEFT COLUMN - CAMERA FEED */}
        <div className="w-full md:w-[55%] bg-black relative flex flex-col h-[45vh] md:h-auto border-b md:border-b-0 md:border-r border-white/10">
          <div className="p-6 absolute top-0 w-full z-10 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-white font-bold text-lg leading-tight">Admin QR Scanner</h3>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-emerald-400 text-[10px] uppercase tracking-[0.2em] font-black">System Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="md:hidden p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="relative flex-grow flex items-center justify-center bg-gray-900">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${!isScanning ? 'opacity-0' : 'opacity-100'}`}
            />
            
            {!isScanning && (
              <div className="flex flex-col items-center justify-center text-gray-500 text-center px-10">
                <div className="w-16 h-16 border-4 border-white/5 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
                <p className="text-gray-400 font-medium tracking-wide">Syncing Security Feed...</p>
              </div>
            )}

            {/* Premium Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 md:w-80 md:h-80 border border-emerald-400/20 rounded-[2.5rem] relative">
                  {/* Glowing Corners */}
                  <div className="absolute -top-1 -left-1 w-12 h-12 border-l-[6px] border-t-[6px] border-emerald-500 rounded-tl-[2rem] shadow-[-5px_-5px_15px_rgba(16,185,129,0.4)]"></div>
                  <div className="absolute -top-1 -right-1 w-12 h-12 border-r-[6px] border-t-[6px] border-emerald-500 rounded-tr-[2rem] shadow-[5px_-5px_15px_rgba(16,185,129,0.4)]"></div>
                  <div className="absolute -bottom-1 -left-1 w-12 h-12 border-l-[6px] border-b-[6px] border-emerald-500 rounded-bl-[2rem] shadow-[-5px_5px_15px_rgba(16,185,129,0.4)]"></div>
                  <div className="absolute -bottom-1 -right-1 w-12 h-12 border-r-[6px] border-b-[6px] border-emerald-500 rounded-br-[2rem] shadow-[5px_5px_15px_rgba(16,185,129,0.4)]"></div>
                  
                  {/* Dynamic Laser */}
                  <motion.div 
                    animate={{ top: ['5%', '95%', '5%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-6 right-6 h-[3px] bg-red-500 shadow-[0_0_20px_#ef4444,0_0_40px_#ef4444] z-10 rounded-full opacity-80"
                  />

                  <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-xl border border-white/20">
                    Scanning Mode
                  </div>
                </div>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-30">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-white text-lg font-bold tracking-widest uppercase animate-pulse">Verifying Access</p>
              </div>
            )}
            
            {/* Context Badge */}
            <div className="absolute bottom-10 left-0 w-full flex justify-center z-10 px-6">
              <div className="px-6 py-3 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 text-center max-w-sm shadow-2xl">
                 <p className="text-[10px] text-emerald-400 uppercase tracking-[0.3em] font-black mb-1">Target Event</p>
                 <p className="text-white text-base font-bold truncate tracking-tight">{eventTitle || 'Event Attendance'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - CONTROLS & LOGS */}
        <div className="w-full md:w-[45%] p-6 md:p-8 flex flex-col relative bg-[#0f0f0f] overflow-y-auto custom-scrollbar">
          <button 
            onClick={onClose} 
            className="hidden md:flex absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="mb-6 mt-2 md:mt-0">
            <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Access Control</h2>
            <p className="text-gray-500 text-[11px] font-medium tracking-wide uppercase">Entry Management Portal</p>
          </div>

          <div className="space-y-5 flex-grow">
            
            {/* ATTENDANCE RESULT */}
            {attendanceResult ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl border ${
                  attendanceResult.success 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : attendanceResult.alreadyMarked 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-3 rounded-2xl mb-3 ${
                    attendanceResult.success ? 'bg-emerald-500 text-white' : 
                    attendanceResult.alreadyMarked ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {attendanceResult.success ? <CheckCircle className="h-6 w-6" /> : 
                     attendanceResult.alreadyMarked ? <Clock className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                  </div>
                  
                  <h4 className={`text-lg font-black mb-1 uppercase tracking-tight ${
                    attendanceResult.success ? 'text-emerald-400' : 
                    attendanceResult.alreadyMarked ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {attendanceResult.success ? 'Access Granted' : 
                     attendanceResult.alreadyMarked ? 'Duplicate' : 'Denied'}
                  </h4>
                  
                  <p className="text-gray-400 text-[11px] font-medium px-4 mb-4">{attendanceResult.message || 'System verification complete.'}</p>

                  {attendanceResult.success && attendanceResult.data && (
                    <div className="w-full space-y-2 px-2">
                      <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5 items-center">
                        <span className="text-[9px] text-gray-500 uppercase font-black">Student</span>
                        <span className="text-white text-xs font-bold">{attendanceResult.data.student?.name || '—'}</span>
                      </div>
                      {attendanceResult.data.attendance?.timestamp && (
                        <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5 items-center">
                          <span className="text-[9px] text-gray-500 uppercase font-black">Time</span>
                          <span className="text-white text-xs font-bold">{formatTime(attendanceResult.data.attendance.timestamp)}</span>
                        </div>
                      )}
                      {attendanceResult.data.isOverride && (
                        <div className="flex justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 items-center">
                          <span className="text-[9px] text-amber-500 uppercase font-black">Note</span>
                          <span className="text-amber-400 text-xs font-bold">Override — Re-register face</span>
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={() => setAttendanceResult(null)}
                    className="w-full mt-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                  >
                    Next Scan
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* MANUAL ENTRY */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Manual Bypass</label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-600">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={manualBookingId}
                        onChange={(e) => setManualBookingId(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && submitManualBooking()}
                        placeholder="Booking ID..."
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500/50 text-white placeholder-gray-700 text-sm font-bold"
                      />
                    </div>
                    <button
                      onClick={submitManualBooking}
                      disabled={isProcessing}
                      className="px-5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-emerald-500/10"
                    >
                      Mark
                    </button>
                  </div>
                </div>

                {/* UPLOAD */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Remote Scan</label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className="group border border-dashed border-white/10 rounded-2xl p-5 text-center hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-pointer relative"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-2"></div>
                        <p className="text-emerald-400 font-bold uppercase tracking-widest text-[9px]">Analyzing...</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-4">
                        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-emerald-500/10 transition-all shadow-lg">
                          <Upload className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-white text-xs font-bold tracking-tight">Upload Pass Image</p>
                          <p className="text-gray-600 text-[8px] uppercase font-black tracking-widest">JPG, PNG, WebP</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* GUIDELINES */}
                <div className="bg-white/5 rounded-2xl border border-white/5 p-5 relative overflow-hidden group">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-1.5 bg-emerald-500/20 rounded-md">
                      <Shield className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Operational Protocol</span>
                  </div>
                  <ul className="space-y-2">
                    {[
                      'Align QR code within primary focus zone',
                      'Manual verification for damaged passes',
                      'Strict window: -15m to +30m from start'
                    ].map((text, idx) => (
                      <li key={idx} className="flex items-start text-[10px] text-gray-500 font-medium leading-relaxed">
                        <div className="mt-1.5 w-1 h-1 bg-emerald-500 rounded-full mr-2 shrink-0"></div>
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* FOOTER STATS */}
          <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-[8px] text-gray-600 uppercase tracking-[0.3em] font-black mb-0.5">Verified</p>
                <div className="flex items-baseline space-x-1.5">
                   <span className="text-white text-2xl font-black tracking-tighter">{scanCount}</span>
                   <span className="text-emerald-500 text-[8px] font-black uppercase tracking-widest">Students</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={resetScanner}
                className="flex-1 sm:flex-none px-4 py-3 text-[9px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-[0.2em]"
              >
                Flush
              </button>
              <button 
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-3 bg-white text-black hover:bg-gray-200 text-[9px] font-black rounded-xl uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95"
              >
                Close Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminQRScanner;
