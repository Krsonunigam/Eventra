import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  QrCode, 
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Phone,
  Mail
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';
import { useAuth } from '../../contexts/AuthContext';
// QRScanner component removed - replaced with image recognition

const Attendance = () => {
  const toast = useCustomToast();
  const { user } = useAuth();
  const [currentEvents, setCurrentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendanceMode, setAttendanceMode] = useState(null); // 'face', 'image-recognition', 'booking', 'qr-upload'
  const [faceVerifying, setFaceVerifying] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [bookingId, setBookingId] = useState('');
  const [qrUploadFile, setQrUploadFile] = useState(null);
  const [imageRecognitionFile, setImageRecognitionFile] = useState(null);

  useEffect(() => {
    fetchCurrentEvents();
  }, []);

  const fetchCurrentEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events/current');
      setCurrentEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching current events:', error);
      
      // Try fallback endpoint
      try {
        const fallbackResponse = await api.get('/api/events/upcoming/events');
        setCurrentEvents(fallbackResponse.data.events || []);
        console.log('Using fallback endpoint for events');
      } catch (fallbackError) {
        console.error('Fallback endpoint also failed:', fallbackError);
        setCurrentEvents([]);
        toast.error('Unable to fetch current events. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFaceRecognition = async (eventId) => {
    try {
      setFaceVerifying(true);
      setAttendanceResult(null);

      // Use the correct face recognition endpoint
      const response = await api.post('/api/attendance/face-recognition', {
        eventId: eventId,
        faceData: 'camera_capture_data' // This would be actual face data from camera
      });

      if (response.data.success) {
        setAttendanceResult({
          success: true,
          message: 'Attendance marked successfully with face recognition',
          eventTitle: response.data.event.title,
          attendanceTime: response.data.attendance.timestamp,
          status: response.data.attendance.status
        });
        toast.success('Face recognized! Attendance marked successfully');
        fetchCurrentEvents(); // Refresh events
      } else {
        setAttendanceResult({
          success: false,
          message: response.data.message || 'Face recognition failed'
        });
        toast.error('Face recognition failed');
      }
    } catch (error) {
      console.error('Face recognition error:', error);
      setAttendanceResult({
        success: false,
        message: 'Face recognition failed. Please try alternative methods.'
      });
      toast.error('Face recognition failed');
    } finally {
      setFaceVerifying(false);
    }
  };

  // QR scan handler removed - replaced with image recognition

  const handleBookingIdVerification = async (eventId, bookingId) => {
    try {
      setAttendanceResult(null);

      const response = await api.post('/api/attendance/booking-verify', {
        eventId: eventId,
        bookingId: bookingId
      });

      if (response.data.success) {
        setAttendanceResult({
          success: true,
          message: 'Attendance marked successfully with booking ID',
          eventTitle: response.data.event.title,
          attendanceTime: response.data.attendance.timestamp,
          status: response.data.attendance.status
        });
        toast.success('Booking verified! Attendance marked successfully');
        fetchCurrentEvents(); // Refresh events
      } else {
        setAttendanceResult({
          success: false,
          message: response.data.message || 'Booking ID verification failed'
        });
        toast.error('Booking ID verification failed');
      }
    } catch (error) {
      console.error('Booking ID verification error:', error);
      setAttendanceResult({
        success: false,
        message: 'Booking ID verification failed'
      });
      toast.error('Booking ID verification failed');
    }
  };

  const handleImageRecognition = async (eventId, file) => {
    try {
      setImageProcessing(true);
      setAttendanceResult(null);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('eventId', eventId);

      const response = await api.post('/api/attendance/image-recognition', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setAttendanceResult({
          success: true,
          message: 'QR code detected and verified! Attendance marked successfully',
          eventTitle: response.data.event.title,
          attendanceTime: response.data.attendance.timestamp,
          status: response.data.attendance.status,
          recognitionDetails: response.data.recognitionDetails,
          qrCodeData: response.data.qrCodeData
        });
        toast.success('QR code detected! Attendance marked successfully');
        fetchCurrentEvents(); // Refresh events
      } else {
        setAttendanceResult({
          success: false,
          message: response.data.message || 'Image recognition failed'
        });
        toast.error('Image recognition failed');
      }
    } catch (error) {
      console.error('Image recognition error:', error);
      setAttendanceResult({
        success: false,
        message: 'Image recognition failed'
      });
      toast.error('Image recognition failed');
    } finally {
      setImageProcessing(false);
    }
  };

  const handleQRUpload = async (eventId, file) => {
    try {
      setAttendanceResult(null);

      const formData = new FormData();
      formData.append('qrImage', file);
      formData.append('eventId', eventId);

      const response = await api.post('/api/attendance/qr-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setAttendanceResult({
          success: true,
          message: 'Attendance marked successfully with uploaded QR code',
          eventTitle: response.data.event.title,
          attendanceTime: response.data.attendance.timestamp,
          status: response.data.attendance.status
        });
        toast.success('QR code uploaded and verified! Attendance marked successfully');
        fetchCurrentEvents(); // Refresh events
      } else {
        setAttendanceResult({
          success: false,
          message: response.data.message || 'QR code upload verification failed'
        });
        toast.error('QR code upload verification failed');
      }
    } catch (error) {
      console.error('QR upload error:', error);
      setAttendanceResult({
        success: false,
        message: 'QR code upload verification failed'
      });
      toast.error('QR code upload verification failed');
    }
  };


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isEventActive = (event) => {
    const now = new Date();
    const start = new Date(event.dateTime.start);
    const end = new Date(event.dateTime.end);
    return now >= start && now <= end;
  };

  const hasBooking = (event) => {
    return event.userBooking && event.userBooking.status === 'confirmed';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Event Attendance</h1>
              <p className="text-gray-400">Mark your attendance for ongoing events</p>
            </div>
            <button
              onClick={fetchCurrentEvents}
              disabled={loading}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Current Events */}
        {currentEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentEvents.map((event, index) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6"
              >
                {/* Event Image */}
                {event.image && (
                  <div className="mb-4">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Event Details */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                  <div className="text-gray-400 text-sm mb-4" dangerouslySetInnerHTML={{ __html: event.description }}></div>

                  <div className="space-y-2">
                    <div className="flex items-center text-gray-300 text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-cyan-400" />
                      {formatDate(event.dateTime.start)}
                    </div>
                    <div className="flex items-center text-gray-300 text-sm">
                      <Clock className="h-4 w-4 mr-2 text-cyan-400" />
                      {formatTime(event.dateTime.start)}
                    </div>
                    <div className="flex items-center text-gray-300 text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-cyan-400" />
                      {event.venue.name}
                    </div>
                  </div>
                </div>

                {/* Attendance Status */}
                <div className="mb-4">
                  {hasBooking(event) ? (
                    <div className="flex items-center text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      You have a confirmed booking
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400 text-sm">
                      <XCircle className="h-4 w-4 mr-2" />
                      No booking found
                    </div>
                  )}
                </div>

                {/* Attendance Actions */}
                {isEventActive(event) && hasBooking(event) ? (
                  <div className="space-y-3">
                    {/* Primary Method - Face Recognition */}
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setAttendanceMode('face');
                        handleFaceRecognition(event._id);
                      }}
                      disabled={faceVerifying}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center shadow-lg"
                    >
                      {faceVerifying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Verifying Face...
                        </>
                      ) : (
                        <>
                          <Camera className="h-5 w-5 mr-2" />
                          Mark Attendance (Face Recognition) - RECOMMENDED
                        </>
                      )}
                    </button>

                    <div className="text-center text-gray-400 text-sm font-medium">
                      Alternative Methods
                    </div>

                    {/* QR Code Image Recognition Method */}
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setAttendanceMode('image-recognition');
                      }}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Upload QR Code Image
                    </button>

                    {/* Booking ID Method */}
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setAttendanceMode('booking');
                      }}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Enter Booking ID
                    </button>

                    {/* QR Upload Method */}
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setAttendanceMode('qr-upload');
                      }}
                      className="w-full border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Upload QR Code Image
                    </button>
                  </div>
                ) : !hasBooking(event) ? (
                  <div className="text-center text-gray-400 text-sm py-4">
                    <XCircle className="h-8 w-8 mx-auto mb-2" />
                    No access - You don't have a booking for this event
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm py-4">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    Event is not currently active
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Active Events</h3>
            <p className="text-gray-500 mb-4">There are no events happening right now.</p>
            <button
              onClick={fetchCurrentEvents}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
            >
              Refresh Events
            </button>
          </motion.div>
        )}

        {/* Image Recognition Modal */}
        {attendanceMode === 'image-recognition' && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-white mb-4">QR Code Image Recognition</h3>
              <p className="text-gray-400 mb-4">
                Upload an image of your event pass with the QR code clearly visible for attendance verification.
              </p>
              
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-300 text-sm mb-2">Event: {selectedEvent.title}</p>
                  <p className="text-gray-400 text-xs">
                    Position the student's QR code from their event pass within the frame. Make sure the QR code is clear and readable.
                  </p>
                </div>

                {/* QR Code Positioning Guide */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <QrCode className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-blue-300 font-medium text-sm mb-1">QR Code Positioning Tips:</h4>
                      <ul className="text-blue-200 text-xs space-y-1">
                        <li>• Ensure QR code is clearly visible and not blurry</li>
                        <li>• Good lighting helps with recognition</li>
                        <li>• Position QR code in the center of the image</li>
                        <li>• Avoid shadows or reflections on the QR code</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Pass Image with QR Code
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageRecognitionFile(e.target.files[0])}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-500 file:text-white hover:file:bg-green-600"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    Upload an image containing the QR code from your event pass
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setAttendanceMode(null);
                      setSelectedEvent(null);
                      setImageRecognitionFile(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (imageRecognitionFile) {
                        handleImageRecognition(selectedEvent._id, imageRecognitionFile);
                        setAttendanceMode(null);
                        setSelectedEvent(null);
                        setImageRecognitionFile(null);
                      } else {
                        toast.error('Please select an image');
                      }
                    }}
                    disabled={imageProcessing}
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    {imageProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Process QR Code'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking ID Modal */}
        {attendanceMode === 'booking' && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Enter Booking ID</h3>
              <p className="text-gray-400 mb-4">
                Enter your booking ID to mark attendance for this event.
              </p>
              
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-300 text-sm mb-2">Event: {selectedEvent.title}</p>
                  <p className="text-gray-400 text-xs">
                    You can find your booking ID in your booking confirmation email or event pass.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Booking ID
                  </label>
                  <input
                    type="text"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="Enter your booking ID"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setAttendanceMode(null);
                      setSelectedEvent(null);
                      setBookingId('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (bookingId.trim()) {
                        handleBookingIdVerification(selectedEvent._id, bookingId.trim());
                        setAttendanceMode(null);
                        setSelectedEvent(null);
                        setBookingId('');
                      } else {
                        toast.error('Please enter a booking ID');
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    Verify Booking ID
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Upload Modal */}
        {attendanceMode === 'qr-upload' && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Upload QR Code</h3>
              <p className="text-gray-400 mb-4">
                Upload an image of your QR code to mark attendance.
              </p>
              
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-300 text-sm mb-2">Event: {selectedEvent.title}</p>
                  <p className="text-gray-400 text-xs">
                    Upload a clear image of your QR code from your event pass.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    QR Code Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setQrUploadFile(e.target.files[0])}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-500 file:text-white hover:file:bg-cyan-600"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setAttendanceMode(null);
                      setSelectedEvent(null);
                      setQrUploadFile(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (qrUploadFile) {
                        handleQRUpload(selectedEvent._id, qrUploadFile);
                        setAttendanceMode(null);
                        setSelectedEvent(null);
                        setQrUploadFile(null);
                      } else {
                        toast.error('Please select a QR code image');
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                  >
                    Upload & Verify
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Attendance Result Modal */}
        {attendanceResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
              <div className="text-center">
                {attendanceResult.success ? (
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                )}
                
                <h3 className="text-xl font-bold text-white mb-2">
                  {attendanceResult.success ? 'Success!' : 'Failed'}
                </h3>
                
                <p className="text-gray-400 mb-4">
                  {attendanceResult.message}
                </p>

                {attendanceResult.success && (
                  <div className="bg-gray-700 p-4 rounded-lg mb-4 text-left">
                    <p className="text-white text-sm">
                      <strong>Event:</strong> {attendanceResult.eventTitle}
                    </p>
                    <p className="text-white text-sm">
                      <strong>Time:</strong> {new Date(attendanceResult.attendanceTime).toLocaleString()}
                    </p>
                    <p className="text-white text-sm">
                      <strong>Status:</strong> {attendanceResult.status}
                    </p>
                    {attendanceResult.recognitionDetails && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <p className="text-green-300 text-sm font-medium mb-2">QR Code Detection Details:</p>
                        <p className="text-gray-300 text-xs">
                          <strong>Confidence:</strong> {Math.round(attendanceResult.recognitionDetails.confidence * 100)}%
                        </p>
                        <p className="text-gray-300 text-xs">
                          <strong>Processing Time:</strong> {attendanceResult.recognitionDetails.processingTime}ms
                        </p>
                        <p className="text-gray-300 text-xs">
                          <strong>Image Quality:</strong> {attendanceResult.recognitionDetails.imageQuality}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setAttendanceResult(null);
                    setAttendanceMode(null);
                    setSelectedEvent(null);
                  }}
                  className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner component removed - replaced with image recognition */}
      </div>
    </div>
  );
};

export default Attendance;