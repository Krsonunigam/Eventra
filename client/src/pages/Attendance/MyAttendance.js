import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Info,
  ShieldCheck,
  QrCode,
  Scan
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';

const MyAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useCustomToast();

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/attendance/my');
      setAttendance(response.data.records || []);
    } catch (error) {
      toast.fetchError('Failed to load your attendance history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-64 bg-white/5 rounded-lg mb-8 animate-pulse"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 w-full bg-white/5 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black tracking-tight"
          >
            My <span className="text-emerald-500">Attendance</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 mt-2 font-medium"
          >
            Track your presence and check-in history across all events.
          </motion.p>
        </header>

        {attendance.length > 0 ? (
          <div className="grid gap-6">
            {attendance.map((record, index) => (
              <motion.div
                key={record._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all duration-500"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Event Image */}
                  <div className="w-full md:w-48 h-48 md:h-auto relative overflow-hidden">
                    <img 
                      src={record.eventId?.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'} 
                      alt={record.eventId?.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0a0a0c]/20"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <h3 className="text-xl font-bold tracking-tight group-hover:text-emerald-400 transition-colors">
                          {record.eventId?.title}
                        </h3>
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          record.status === 'present' 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : record.status === 'late'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          {record.status === 'present' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {record.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-gray-400">
                          <div className="p-2 bg-white/5 rounded-xl">
                            <Calendar className="h-4 w-4 text-emerald-500" />
                          </div>
                          <span className="text-sm">{formatDate(record.eventId?.dateTime?.start)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400">
                          <div className="p-2 bg-white/5 rounded-xl">
                            <MapPin className="h-4 w-4 text-emerald-500" />
                          </div>
                          <span className="text-sm truncate">{record.eventId?.venue?.name || 'TBA'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400">
                          <div className="p-2 bg-white/5 rounded-xl">
                            <Clock className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Check-in</span>
                            <span className="text-sm text-white font-medium">{formatTime(record.timestamp)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400">
                          <div className="p-2 bg-white/5 rounded-xl">
                            {record.method === 'face' ? <Scan className="h-4 w-4 text-emerald-500" /> : <QrCode className="h-4 w-4 text-emerald-500" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Verified Via</span>
                            <span className="text-sm text-white font-medium uppercase">
                              {record.method.startsWith('face') ? 'Face Recognition' : 
                               record.method.startsWith('qr') ? 'QR Scan' : 
                               record.method}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Organizer Footer */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-emerald-500" />
                        </div>
                        <span className="text-xs text-gray-500">Organized by <span className="text-gray-300 font-bold">{record.eventId?.organizer?.name || 'Eventra'}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-500/60 font-black tracking-tighter uppercase">
                        <ShieldCheck className="h-3 w-3" />
                        Securely Verified
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[3rem]"
          >
            <div className="p-6 bg-white/5 rounded-full mb-6">
              <Info className="h-12 w-12 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Attendance Records Yet</h3>
            <p className="text-gray-500 max-w-sm text-center">Your attendance history will appear here once you've checked into an event.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyAttendance;
