import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Shield, 
  Users, 
  CheckCircle, 
  Clock, 
  Calendar, 
  MapPin,
  Eye,
  Activity,
  BarChart3,
  Download,
  RefreshCw,
  Camera,
  Upload
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';
import AdminHybridScanner from '../../components/Admin/AdminHybridScanner';
import QrScanner from 'qr-scanner';

const AdminAttendance = () => {
  const toast = useCustomToast();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [uploadingQR, setUploadingQR] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Use the priority-sorted endpoint: ongoing > in-window > future
      const response = await api.get('/api/attendance/events-for-attendance');
      setEvents(response.data.events || []);
    } catch (error) {
      
      // Fallback to generic events list
      try {
        const fallback = await api.get('/api/admin/events');
        setEvents(fallback.data.events || []);
      } catch (_) {
        toast.error('Failed to fetch events');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async (eventId) => {
    try {
      const response = await api.get(`/api/attendance/stats/${eventId}`);
      setAttendanceStats(response.data);
      setAttendanceRecords(response.data.attendanceRecords || []);
    } catch (error) {
      
      toast.error('Failed to fetch attendance statistics');
    }
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    fetchAttendanceStats(event._id);
  };

  // Inline QR image upload — no modal needed
  const handleQRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedEvent) {
      if (!selectedEvent) toast.error('Select an event first before uploading a QR code');
      return;
    }
    e.target.value = null; // reset so same file can be re-uploaded
    setUploadingQR(true);
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      const text = typeof result === 'string' ? result : result?.data;
      if (!text) throw new Error('No QR code found in image');

      let payload;
      try { payload = JSON.parse(text); } catch(_) { payload = { verificationCode: text }; }
      

      const response = await api.post('/api/attendance/admin/qr-scan', {
        qrData: payload,
        targetEventId: selectedEvent._id
      });
      if (response.data.success) {
        const name = response.data.student?.name || 'Student';
        toast.success(`Attendance marked for ${name}`);
        fetchAttendanceStats(selectedEvent._id);
      } else {
        toast.error(response.data.message || 'Could not mark attendance');
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'QR upload failed';
      const isAlready = error?.response?.data?.alreadyMarked;
      if (isAlready) toast.warning(msg);
      else toast.error(msg);
    } finally {
      setUploadingQR(false);
    }
  };

  const getEventStatus = (event) => {
    const meta = event._meta;
    if (!meta) {
      // Fallback calculation
      const now = new Date();
      const start = new Date(event.dateTime.start);
      const end = event.dateTime.end ? new Date(event.dateTime.end) : start;
      if (now >= start && now <= end) return 'ongoing';
      const windowOpen = new Date(start.getTime() - 15 * 60 * 1000);
      if (now >= windowOpen && now <= start) return 'in-window';
      return now < start ? 'upcoming' : 'ended';
    }
    if (meta.isOngoing) return 'ongoing';
    if (meta.isInWindow) return 'in-window';
    if (meta.isUpcoming) return 'upcoming';
    return new Date() < new Date(event.dateTime.start) ? 'future' : 'ended';
  };

  const isEventScannable = (event) => {
    const status = getEventStatus(event);
    return status === 'ongoing' || status === 'in-window';
  };

  const getStatusBadge = (event) => {
    const status = getEventStatus(event);
    switch (status) {
      case 'ongoing':   return { label: 'LIVE', cls: 'bg-red-500 text-white animate-pulse' };
      case 'in-window': return { label: 'OPEN', cls: 'bg-green-600 text-white' };
      case 'upcoming':  return { label: 'SOON', cls: 'bg-yellow-500 text-black' };
      case 'future':    return { label: 'Upcoming', cls: 'bg-gray-600 text-gray-300' };
      default:          return { label: 'Ended', cls: 'bg-gray-700 text-gray-400' };
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

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-32 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
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
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <Shield className="h-8 w-8 mr-3 text-blue-400" />
                Admin Attendance Management
              </h1>
              <p className="text-gray-400">Manage and monitor student attendance for events</p>
            </div>
            <button
              onClick={fetchEvents}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Events List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 p-6 rounded-xl border border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                Available Events
              </h2>
              <span className="text-gray-400 text-sm">{events.length} events</span>
            </div>

            <div className="space-y-4">
              {events.length === 0 && (
                <p className="text-gray-400 text-center py-8">No events found</p>
              )}
              {events.map((event) => {
                const badge = getStatusBadge(event);
                const scannable = isEventScannable(event);
                return (
                  <div
                    key={event._id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedEvent?._id === event._id
                        ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                        : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => handleEventSelect(event)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-3">
                        <h3 className="text-white font-medium mb-2 truncate">{event.title}</h3>
                        <div className="space-y-1 text-sm text-gray-300">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                            {formatDate(event.dateTime.start)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                            {formatTime(event.dateTime.start)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            {event.venue?.name || 'TBA'}
                          </div>
                          {event._meta && (
                            <div className="text-xs text-gray-500 mt-1">
                              Window: {formatTime(event._meta.windowOpen)} – {formatTime(event._meta.windowClose)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                        <span className={`px-2 py-1 text-xs rounded-full font-bold ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {scannable && (
                          <div className="flex flex-col items-end gap-1.5 mt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                setScannerOpen(true);
                              }}
                              className="flex items-center px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-medium rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
                            >
                              <Camera className="h-3 w-3 mr-1" />
                              Smart Scan
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                // Trigger hidden file input
                                setTimeout(() => fileInputRef.current?.click(), 50);
                              }}
                              disabled={uploadingQR}
                              className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all"
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              {uploadingQR ? 'Scanning...' : 'Upload QR'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Attendance Statistics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {selectedEvent ? (
              <>
                {/* Statistics Cards */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-green-400" />
                    Attendance Statistics
                  </h3>
                  {attendanceStats.statistics ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white">
                          {attendanceStats.statistics.totalAttendance}
                        </div>
                        <div className="text-gray-400 text-sm">Present</div>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">
                          {attendanceStats.statistics.attendanceRate}%
                        </div>
                        <div className="text-gray-400 text-sm">Rate</div>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">
                          {attendanceStats.statistics.statusCounts?.late || 0}
                        </div>
                        <div className="text-gray-400 text-sm">Late</div>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-400">
                          {attendanceStats.statistics.statusCounts?.absent || 0}
                        </div>
                        <div className="text-gray-400 text-sm">Absent</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-8">
                      No attendance data available
                    </div>
                  )}
                </div>

                {/* Recent Attendance Records */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-orange-400" />
                    Recent Attendance
                  </h3>
                  <div className="space-y-3">
                    {attendanceRecords.slice(0, 5).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            record.status === 'present' ? 'bg-green-400' :
                            record.status === 'late' ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          <div>
                            <div className="text-white text-sm font-medium">
                              {record.user.name}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {record.user.email}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white text-sm">
                            {formatDateTime(record.timestamp)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {record.method.toUpperCase()} • {record.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">Select an Event</h3>
                <p className="text-gray-400 text-sm">
                  Choose an event from the list to view attendance statistics and manage attendance.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Hidden file input for QR upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleQRUpload}
          className="hidden"
        />

        {/* Admin Hybrid Scanner Modal */}
        {scannerOpen && selectedEvent && (
          <AdminHybridScanner
            onClose={() => {
              setScannerOpen(false);
              // Keep selectedEvent selected for stats view
            }}
            onSuccess={(result) => {
              fetchAttendanceStats(selectedEvent._id); // Refresh stats live
              // Do NOT close the scanner — keep scanning same event
            }}
            eventId={selectedEvent._id}
            eventTitle={selectedEvent.title}
          />
        )}
      </div>
    </div>
  );
};

export default AdminAttendance;
