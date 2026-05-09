import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, X, CheckCircle, AlertCircle, Clock, MapPin, Calendar, User } from 'lucide-react';
import useCustomToast from '../../utils/customToast';
import api from '../../utils/axiosConfig';
import QrScanner from 'qr-scanner';

const QRScanner = ({ onClose, onSuccess, eventId }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const qrScannerRef = useRef(null);
  const processingRef = useRef(false);
  const toast = useCustomToast();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        // Fix: Start QrScanner ONLY after video metadata is ready (fixes race condition)
        videoRef.current.onloadedmetadata = () => {
          setIsScanning(true);
          startQRScanner();
        };
      }
    } catch (error) {
      
      toast.error('Camera access denied. Please allow camera permission or use image upload.');
    }
  };

  const stopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const startQRScanner = () => {
    // Guard: don't create duplicate scanner instances
    if (!videoRef.current || qrScannerRef.current) return;

    
    qrScannerRef.current = new QrScanner(
      videoRef.current,
      (result) => {
        const qrText = typeof result === 'string' ? result : result?.data;
        if (!qrText || processingRef.current) {
          
          return;
        }
        
        setScannedData(qrText);
        processQRCode(qrText);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
        preferredCamera: 'environment',
      }
    );

    qrScannerRef.current.start().then(() => {
      
    }).catch((error) => {
      
      toast.error('QR scanner failed to initialize. Try refreshing or using image upload.');
    });
  };

  const processQRCode = async (qrData) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    
    try {
      
      
      let payloadQR = qrData;
      try {
        payloadQR = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        
      } catch (_) {
        
      }

      
      const response = await api.post('/api/attendance/qr-scan', {
        qrData: payloadQR
      });

      

      if (response.data.success) {
        setAttendanceResult({ success: true, data: response.data });
        toast.success('Attendance marked successfully!');
        setTimeout(() => onSuccess(response.data), 2000);
      } else {
        setAttendanceResult({ success: false, message: response.data.message });
        toast.error(response.data.message || 'Attendance marking failed');
      }
    } catch (error) {
      
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
      setAttendanceResult({ success: false, message: errorMessage });
      toast.error(errorMessage);
    } finally {
      // Allow re-scanning after 3s on failure
      setTimeout(() => {
        processingRef.current = false;
        setIsProcessing(false);
      }, 3000);
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || isProcessing) return;

    QrScanner.scanImage(videoRef.current, { returnDetailedScanResult: true })
      .then((result) => {
        const qrText = typeof result === 'string' ? result : result?.data;
        if (!qrText) {
          toast.error('No QR code detected');
          return;
        }

        setScannedData(qrText);
        processQRCode(qrText);
      })
      .catch(() => {
        toast.error('No QR code detected');
      });
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    >
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            QR Code Scanner
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 bg-gray-900 rounded-lg"
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          {/* QR scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-green-400 rounded-lg relative">
              <div className="absolute inset-0 border-2 border-green-400 rounded-lg animate-pulse"></div>
              <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-green-400"></div>
              <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-green-400"></div>
              <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-green-400"></div>
              <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-green-400"></div>
            </div>
          </div>

          {/* Processing indicator */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-2"></div>
                <p className="text-sm">Processing QR Code...</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-300 text-sm mb-2">
            Position the QR code from your event pass within the frame
          </p>
          <p className="text-gray-400 text-xs">
            Attendance can be marked 15 minutes before event starts
          </p>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={scanQRCode}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR Code
              </>
            )}
          </button>
        </div>

        {/* Attendance Result Display */}
        {attendanceResult && (
          <div className="mt-4 p-4 rounded-lg border">
            {attendanceResult.success ? (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                <h4 className="text-green-400 font-semibold mb-2">Attendance Marked!</h4>
                
                {attendanceResult.data && (
                  <div className="text-left text-sm text-gray-300 space-y-1">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{formatDate(attendanceResult.data.event.startTime)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{formatTime(attendanceResult.data.event.startTime)}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{attendanceResult.data.event.location}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Status: {attendanceResult.data.timing.status}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
                <h4 className="text-red-400 font-semibold mb-2">Attendance Failed</h4>
                <p className="text-gray-300 text-sm">{attendanceResult.message}</p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <h5 className="text-white text-sm font-medium mb-2">Instructions:</h5>
          <ul className="text-gray-300 text-xs space-y-1">
            <li>• Download your event pass from the booking confirmation</li>
            <li>• Open the QR code on your phone or print it</li>
            <li>• Position the QR code within the scanning frame</li>
            <li>• Attendance window opens 15 minutes before event starts</li>
            <li>• You can only mark attendance once per event</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default QRScanner;
