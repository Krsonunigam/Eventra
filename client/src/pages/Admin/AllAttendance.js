import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  User, 
  Mail, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  FileText,
  AlertCircle,
  QrCode,
  Scan
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';

const AllAttendance = () => {
  const [records, setRecords] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const toast = useCustomToast();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/api/events');
      setEvents(response.data.events || []);
    } catch (error) {
      
    }
  };

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        event: selectedEvent,
        status: selectedStatus,
        page: currentPage,
        limit: 10
      });
      const response = await api.get(`/api/attendance/all?${params.toString()}`);
      setRecords(response.data.records || []);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      toast.fetchError('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedEvent, selectedStatus, currentPage]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttendance();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchAttendance]);

  const handleDownloadPDF = async () => {
    try {
      setExporting(true);
      const response = await api.get(`/api/attendance/export/pdf${selectedEvent ? `?eventId=${selectedEvent}` : ''}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Attendance report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF report');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black tracking-tight"
            >
              Attendance <span className="text-emerald-500">Records</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mt-2 font-medium"
            >
              Monitor and manage real-time student check-ins.
            </motion.p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-500/20"
          >
            {exporting ? (
              <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? 'Generating...' : 'Export Report'}
          </motion.button>
        </header>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search student or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
            <select 
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
            >
              <option value="">All Events</option>
              {events.map(event => (
                <option key={event._id} value={event._id} className="bg-gray-900">{event.title}</option>
              ))}
            </select>
          </div>

          <div className="relative group">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="present" className="bg-gray-900">Present</option>
              <option value="late" className="bg-gray-900">Late</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Student</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Event</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Check-in</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Method</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode='popLayout'>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="6" className="px-8 py-6 h-20 bg-white/[0.01]"></td>
                      </tr>
                    ))
                  ) : records.length > 0 ? (
                    records.map((record) => (
                      <motion.tr 
                        key={record._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-white/5">
                              <User className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-bold text-sm tracking-tight">{record.userId?.name || 'N/A'}</p>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                <Mail className="h-3 w-3" />
                                {record.userId?.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <p className="font-bold text-sm truncate max-w-[150px] tracking-tight">{record.eventId?.title || 'N/A'}</p>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {formatDate(record.eventId?.dateTime?.start)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <p className="font-bold text-sm tracking-tight">{formatTime(record.timestamp)}</p>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">{formatDate(record.timestamp)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            record.status === 'present' 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${record.status === 'present' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                            {record.status}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-gray-400">
                            {record.method?.startsWith('face') ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                                <Scan className="h-3 w-3 text-blue-400" />
                                <span className="text-[10px] font-bold uppercase tracking-tight">Face Recognition</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                                <QrCode className="h-3 w-3 text-emerald-400" />
                                <span className="text-[10px] font-bold uppercase tracking-tight">QR Code</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className="p-2 hover:bg-white/10 rounded-xl transition-all">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-white/5 rounded-full">
                            <AlertCircle className="h-10 w-10 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-xl font-bold">No records found</p>
                            <p className="text-gray-500 text-sm">Try adjusting your filters or search terms.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium tracking-tight">
              Showing page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllAttendance;
