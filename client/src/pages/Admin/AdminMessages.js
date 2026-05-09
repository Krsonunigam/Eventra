import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MoreVertical,
  Mail,
  User,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';
import { formatDateIST } from '../../utils/timezoneUtils';

const AdminMessages = () => {
  const toast = useCustomToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/contacts', {
        params: {
          page,
          search,
          status: statusFilter,
          limit: 10
        }
      });
      if (response.data.success) {
        setMessages(response.data.contacts);
        setTotalPages(response.data.totalPages);
        setTotalMessages(response.data.totalMessages);
      }
    } catch (error) {
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMessages();
  };

  const updateStatus = async (id, status, adminNotes = '') => {
    try {
      setUpdatingId(id);
      const response = await api.put(`/api/admin/contacts/${id}/status`, { status, adminNotes });
      if (response.data.success) {
        toast.success(`Message marked as ${status}`);
        setMessages(messages.map(m => m._id === id ? response.data.contact : m));
        if (selectedMessage?._id === id) {
          setSelectedMessage(response.data.contact);
        }
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'ongoing':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="h-3 w-3" /> Ongoing
          </span>
        );
      case 'resolved':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="h-3 w-3" /> Resolved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 sm:p-10">
      {/* Header Area */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              User Inquiries
            </h1>
            <p className="text-gray-500 font-medium uppercase tracking-widest text-xs">
              Manage Support Tickets & Feedback // Total: {totalMessages}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
              <input
                type="text"
                placeholder="Search queries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 pr-6 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-cyan-500/50 w-64 transition-all"
              />
            </form>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Messages List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-[2rem] animate-pulse" />
            ))
          ) : messages.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
              <MessageSquare className="h-16 w-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest">No messages found</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedMessage(msg)}
                  className={`group p-6 rounded-[2rem] border transition-all cursor-pointer ${
                    selectedMessage?._id === msg._id 
                    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{msg.name}</h3>
                        <p className="text-gray-500 text-sm font-medium">{msg.email}</p>
                      </div>
                    </div>
                    {getStatusBadge(msg.status)}
                  </div>

                  <div className="mb-4">
                    <h4 className="text-blue-400 font-bold text-sm mb-1 uppercase tracking-wider">{msg.subject}</h4>
                    <p className="text-gray-400 line-clamp-2 text-sm leading-relaxed">{msg.message}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDateIST(msg.createdAt)}</span>
                    </div>
                    <button className="text-blue-500 hover:text-blue-400 text-xs font-black uppercase tracking-widest flex items-center gap-1 group/btn">
                      Details <ExternalLink className="h-3 w-3 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-3 bg-white/5 border border-white/10 rounded-2xl disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-black text-sm uppercase tracking-widest text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-3 bg-white/5 border border-white/10 rounded-2xl disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Selected Message Detail */}
        <div className="lg:col-span-1">
          <div className="sticky top-10">
            <AnimatePresence mode="wait">
              {selectedMessage ? (
                <motion.div
                  key={selectedMessage._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-gray-900/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 shadow-2xl overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <MessageSquare className="h-32 w-32" />
                  </div>

                  <h2 className="text-2xl font-black mb-8 uppercase italic tracking-tighter">Inquiry Details</h2>

                  <div className="space-y-8 relative z-10">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Message Status</p>
                      <div className="flex gap-2">
                        {['pending', 'ongoing', 'resolved'].map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(selectedMessage._id, s)}
                            disabled={updatingId === selectedMessage._id}
                            className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              selectedMessage.status === s
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/5 text-gray-500 hover:bg-white/10'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-white/5 rounded-3xl space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Subject</p>
                        <p className="font-bold text-blue-400">{selectedMessage.subject}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Full Inquiry</p>
                        <p className="text-sm text-gray-300 leading-relaxed italic">"{selectedMessage.message}"</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <a href={`mailto:${selectedMessage.email}`} className="text-sm font-bold hover:text-blue-400 transition-colors">
                          {selectedMessage.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <span className="text-sm font-bold">{selectedMessage.name}</span>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-white/5">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 italic">Action Required</p>
                       <div className="flex gap-3">
                         <a 
                          href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                          className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 hover:text-white transition-all text-center"
                         >
                           Reply via Mail
                         </a>
                         <button 
                          onClick={() => updateStatus(selectedMessage._id, 'resolved')}
                          className="h-12 w-12 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all"
                         >
                           <Check className="h-6 w-6" />
                         </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-[3rem] text-center p-10">
                  <div className="p-6 bg-blue-500/10 rounded-[2rem] mb-6">
                    <MessageSquare className="h-10 w-10 text-blue-500" />
                  </div>
                  <h3 className="font-black uppercase tracking-widest text-sm mb-2">Review Mode</h3>
                  <p className="text-gray-600 text-xs leading-relaxed max-w-[200px]">
                    Select a message from the list to view full details and manage status.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
