import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';
import AdminQRScanner from '../../components/Admin/AdminQRScanner';

const AdminAttendance = () => {
  const toast = useCustomToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events/admin');
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
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
      console.error('Error fetching attendance stats:', error);
      toast.error('Failed to fetch attendance statistics');
    }
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    fetchAttendanceStats(event._id);
  };

  const isEventActive = (event) => {
    const now = new Date();
    const eventStart = new Date(event.dateTime.start);
    const attendanceWindow = new Date(eventStart.getTime() - 15 * 60 * 1000);
    const attendanceWindowEnd = new Date(eventStart.getTime() + 30 * 60 * 1000);
    
    return now >= attendanceWindow && now <= attendanceWindowEnd;
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
              {events.map((event) => (
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
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-2">{event.title}</h3>
                      <div className="space-y-1 text-sm text-gray-300">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(event.dateTime.start)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatTime(event.dateTime.start)}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {event.venue?.name || 'TBA'}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {event.capacity - event.availableSeats} / {event.capacity} attendees
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      {isEventActive(event) ? (
                        <div className="flex flex-col items-end space-y-2">
                          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                            Active
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                              setQrScannerOpen(true);
                            }}
                            className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            <QrCode className="h-4 w-4 mr-1" />
                            Scan
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">
                          {new Date() < new Date(event.dateTime.start) ? 'Upcoming' : 'Ended'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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

        {/* Admin QR Scanner Modal */}
        {qrScannerOpen && selectedEvent && (
          <AdminQRScanner
            onClose={() => {
              setQrScannerOpen(false);
              setSelectedEvent(null);
            }}
            onSuccess={(result) => {
              toast.success('Student attendance marked successfully!');
              fetchAttendanceStats(selectedEvent._id); // Refresh attendance data
              setQrScannerOpen(false);
              setSelectedEvent(null);
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
