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

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }

      // Check support for BarcodeDetector
      const supported = 'BarcodeDetector' in window;
      setSupportsDetector(supported);
      if (supported) {
        startRealTimeScanning();
      }
      startLaserAnimation();
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Camera access denied. Please allow camera permission.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    if (scanAnimRef.current) {
      cancelAnimationFrame(scanAnimRef.current);
      scanAnimRef.current = null;
    }
  };

  const startRealTimeScanning = async () => {
    try {
      const formats = ['qr_code'];
      const detector = new window.BarcodeDetector({ formats });

      const scan = async () => {
        if (!videoRef.current || isProcessing) {
          scanAnimRef.current = requestAnimationFrame(scan);
          return;
        }

        try {
          const codes = await detector.detect(videoRef.current);
          if (codes && codes.length > 0) {
            const text = codes[0].rawValue || codes[0].rawValue === '' ? codes[0].rawValue : codes[0].rawValue;
            if (text) {
              setScannedData(text);
              await processQRCode(text);
            }
          }
        } catch (_) {
          // ignore frame errors
        }

        scanAnimRef.current = requestAnimationFrame(scan);
      };

      scan();
    } catch (e) {
      console.log('BarcodeDetector not available or failed to start');
    }
  };

  const startLaserAnimation = () => {
    const max = 192; // approximately within overlay box
    const animate = () => {
      setLaserY(prev => (prev >= max ? 0 : prev + 3));
      scanAnimRef.current = requestAnimationFrame(animate);
    };
    if (!scanAnimRef.current) {
      scanAnimRef.current = requestAnimationFrame(animate);
    }
  };

  const processQRCode = async (qrData) => {
    setIsProcessing(true);
    setScanCount(prev => prev + 1);
    
    try {
      console.log('Processing QR code for admin:', qrData);
      
      // Send QR data for admin attendance marking (as object if possible)
      let payloadQR = qrData;
      try {
        payloadQR = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      } catch (_) {
        // leave as is if not JSON string
      }
      const response = await api.post('/api/attendance/admin/qr-scan', {
        qrData: payloadQR
      });

      if (response.data.success) {
        setAttendanceResult({
          success: true,
          data: response.data
        });
        toast.success('Student attendance marked successfully!');
        
        // Call the onSuccess callback with attendance data
        if (onSuccess) {
          onSuccess(response.data);
        }
        
        // Show success for 3 seconds then allow next scan
        setTimeout(() => {
          setAttendanceResult(null);
          setScannedData(null);
        }, 3000);
      } else {
        setAttendanceResult({
          success: false,
          message: response.data.message
        });
        toast.error(response.data.message || 'Attendance marking failed');
        
        // Show error for 2 seconds then clear
        setTimeout(() => {
          setAttendanceResult(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Admin QR attendance error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
      const isAlreadyMarked = error.response?.data?.alreadyMarked;
      
      setAttendanceResult({
        success: false,
        message: errorMessage,
        alreadyMarked: isAlreadyMarked
      });
      
      if (isAlreadyMarked) {
        toast.warning(errorMessage);
      } else {
        toast.error(errorMessage);
      }
      
      // Show error for 3 seconds then clear
      setTimeout(() => {
        setAttendanceResult(null);
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitManualBooking = async () => {
    if (!manualBookingId?.trim()) {
      toast.error('Please enter a Booking ID');
      return;
    }
    setIsProcessing(true);
    try {
      const response = await api.post('/api/attendance/admin/qr-scan', {
        qrData: { bookingId: manualBookingId.trim() }
      });
      if (response.data.success) {
        setAttendanceResult({ success: true, data: response.data });
        toast.success('Student attendance marked successfully!');
        
        // Call the onSuccess callback with attendance data
        if (onSuccess) {
          onSuccess(response.data);
        }
        
        setManualBookingId('');
        setTimeout(() => {
          setAttendanceResult(null);
        }, 3000);
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
      setIsProcessing(false);
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
      console.error('QR scan error:', error);
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
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    >
      <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-400 mr-2" />
            <h3 className="text-xl font-semibold text-white flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              Admin QR Scanner
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Event Info */}
        <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-500">
          <div className="flex items-center text-blue-300 text-sm mb-1">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="font-medium">Event: {eventTitle || 'Current Event'}</span>
          </div>
          <div className="flex items-center text-blue-300 text-sm">
            <Users className="h-4 w-4 mr-2" />
            <span>Scan student QR codes to mark attendance</span>
          </div>
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
            <div className="w-48 h-48 border-2 border-blue-400 rounded-lg relative">
              <div className="absolute inset-0 border-2 border-blue-400 rounded-lg animate-pulse"></div>
              <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-blue-400"></div>
              <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-blue-400"></div>
              <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-blue-400"></div>
              <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-blue-400"></div>
              {/* Scanning laser */}
              <div
                className="absolute left-0 right-0 h-0.5 bg-red-500 opacity-80"
                style={{ top: `${laserY}px` }}
              />
              
              {/* Admin indicator */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                  ADMIN SCANNER
                </div>
              </div>
            </div>
          </div>

          {/* Processing indicator */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                <p className="text-sm">Processing QR Code...</p>
                <p className="text-xs text-gray-300">Marking student attendance</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-300 text-sm mb-2">
            Position the student's QR code from their event pass within the frame
          </p>
          <p className="text-gray-400 text-xs">
            Attendance can be marked 15 minutes before event starts
          </p>
          {scanCount > 0 && (
            <p className="text-blue-400 text-xs mt-1">
              Scans processed: {scanCount}
            </p>
          )}
        </div>

        {/* QR Code Upload */}
        <div className="mt-4 bg-gray-700 rounded-lg p-3">
          <div className="text-left text-gray-200 text-sm mb-2 font-medium">Upload QR Code Image</div>
          <div
            className="border-2 border-dashed border-gray-500 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {isUploading ? (
              <div className="text-blue-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
                <p className="text-sm">Processing QR code...</p>
              </div>
            ) : uploadedFile ? (
              <div className="text-green-400">
                <FileImage className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{uploadedFile.name}</p>
                <p className="text-xs text-gray-400">Click to upload another</p>
              </div>
            ) : (
              <div className="text-gray-400">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Drop QR image here or click to browse</p>
                <p className="text-xs text-gray-500">Supports JPG, PNG, WebP</p>
              </div>
            )}
          </div>
        </div>

        {/* Manual Booking ID Entry */}
        <div className="mt-4 bg-gray-700 rounded-lg p-3">
          <div className="text-left text-gray-200 text-sm mb-2 font-medium">Mark via Booking ID</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualBookingId}
              onChange={(e) => setManualBookingId(e.target.value)}
              placeholder="Enter Booking ID"
              className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={submitManualBooking}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg"
            >
              Mark
            </button>
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={resetScanner}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          >
            Reset
          </button>
          <button
            onClick={scanQRCode}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center"
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
                  <div className="text-left text-sm text-gray-300 space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span><strong>Student:</strong> {attendanceResult.data.student.name}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span><strong>Email:</strong> {attendanceResult.data.student.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span><strong>Event:</strong> {attendanceResult.data.event.title}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span><strong>Time:</strong> {formatTime(attendanceResult.data.attendance.timestamp)}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span><strong>Location:</strong> {attendanceResult.data.event.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-gray-400" />
                      <span><strong>Status:</strong> {attendanceResult.data.timing.status}</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-gray-400" />
                      <span><strong>Method:</strong> {attendanceResult.data.attendance.method}</span>
                    </div>
                  </div>
                )}
                
                <div className="mt-3 text-xs text-gray-400">
                  Ready for next scan...
                </div>
              </div>
            ) : (
              <div className="text-center">
                {attendanceResult.alreadyMarked ? (
                  <>
                    <Clock className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                    <h4 className="text-yellow-400 font-semibold mb-2">Already Marked</h4>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
                    <h4 className="text-red-400 font-semibold mb-2">Scan Failed</h4>
                  </>
                )}
                <p className="text-gray-300 text-sm">{attendanceResult.message}</p>
                <div className="mt-2 text-xs text-gray-400">
                  {attendanceResult.alreadyMarked ? 'Student already attended' : 'Try scanning again...'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <h5 className="text-white text-sm font-medium mb-2">Admin Instructions:</h5>
          <ul className="text-gray-300 text-xs space-y-1">
            <li>• Ask students to show their event pass QR code</li>
            <li>• Position the QR code within the scanning frame OR upload QR image</li>
            <li>• Attendance is automatically marked and saved to database</li>
            <li>• Students can only be marked present once per event</li>
            <li>• Attendance window: 15 minutes before to 30 minutes after start</li>
            <li>• All attendance records are tracked with admin verification</li>
            <li>• Alternative: Enter Booking ID manually or upload QR image file</li>
          </ul>
        </div>

        {/* Statistics */}
        {scanCount > 0 && (
          <div className="mt-3 p-2 bg-blue-900 bg-opacity-30 rounded-lg">
            <div className="text-center text-blue-300 text-sm">
              <span className="font-medium">Scans Processed: {scanCount}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminQRScanner;
