import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Award, 
  Download, 
  Search, 
  Filter, 
  DownloadCloud, 
  FileText, 
  Users, 
  Calendar,
  RefreshCw,
  MoreVertical,
  ExternalLink,
  ShieldCheck,
  Building2,
  ChevronRight,
  Database
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';
import { formatDateIST } from '../../utils/timezoneUtils';

const AdminCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const toast = useCustomToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [certsRes, eventsRes] = await Promise.all([
        api.get('/api/certificates/admin/all'),
        api.get('/api/admin/events')  // Use admin events endpoint
      ]);
      
      if (certsRes.data.success) setCertificates(certsRes.data.certificates);
      // Admin events endpoint returns { events: [...] }
      if (eventsRes.data.events) setEvents(eventsRes.data.events);
      else if (eventsRes.data.success) setEvents(eventsRes.data.events || []);
    } catch (error) {
      toast.error('Failed to sync administrative data');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDownload = async (eventId, eventTitle) => {
    try {
      setBulkDownloading(true);
      toast.info(`Preparing bulk export for ${eventTitle}...`);
      
      const response = await api.get(`/api/certificates/admin/bulk-download/${eventId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificates_${eventTitle.replace(/\s+/g, '_')}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Bulk export completed successfully');
    } catch (error) {
      toast.error('No certificates found for this event yet. Generate them first.');
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleGlobalBulkDownload = async () => {
    try {
      setBulkDownloading(true);
      toast.info('Initializing global cryptographic export...');
      
      const response = await api.get('/api/certificates/admin/bulk-download-all', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `All_Eventra_Certificates_${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Global export completed successfully');
    } catch (error) {
      toast.error('Global export failed. Registry might be empty.');
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleGenerateForEvent = async (eventId, eventTitle) => {
    try {
      setGenerating(true);
      toast.info(`Generating certificates for ${eventTitle}...`);
      const res = await api.post(`/api/certificates/admin/generate-for-event/${eventId}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchData(); // Refresh list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate certificates');
    } finally {
      setGenerating(false);
    }
  };

  const filteredCerts = certificates.filter(cert => {
    const matchesSearch = 
      cert.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = selectedEvent === 'all' || cert.event?._id === selectedEvent;
    return matchesSearch && matchesEvent;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 lg:p-10">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10">
              <Award className="h-10 w-10 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                Certification Nexus
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-widest">Admin Control</span>
              </h1>
              <p className="text-gray-500 font-medium mt-1">Registry management and cryptographic verification portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex items-center">
              <button className="px-5 py-2 bg-blue-600 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20">All Records</button>
              <button className="px-5 py-2 hover:bg-white/5 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 transition-all">Verification Logs</button>
            </div>
            
            <button 
              onClick={handleGlobalBulkDownload}
              disabled={bulkDownloading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50"
              title="Download All Certificates in System"
            >
              <DownloadCloud className={`h-4 w-4 ${bulkDownloading ? 'animate-bounce' : ''}`} />
              <span>Export All</span>
            </button>

            <button 
              onClick={fetchData}
              className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
            >
              <RefreshCw className={`h-5 w-5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Total Issued</p>
            <h3 className="text-4xl font-black">{certificates.length}</h3>
            <div className="mt-4 flex items-center gap-2 text-green-400 text-xs font-bold">
              <Database className="h-4 w-4" />
              Neural Registry Sync Active
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Active Events</p>
            <h3 className="text-4xl font-black">{events.length}</h3>
            <div className="mt-4 flex items-center gap-2 text-blue-400 text-xs font-bold">
              <Building2 className="h-4 w-4" />
              Across {events.length} Institutions
            </div>
          </div>
          {/* Add more stats as needed */}
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 mb-8">
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="Search by ID, Name or Email Protocol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative min-w-[240px]">
                <Filter className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full pl-14 pr-10 py-5 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none text-sm font-bold uppercase tracking-widest"
                >
                  <option value="all">Global Records</option>
                  {events.map(ev => (
                    <option key={ev._id} value={ev._id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              {selectedEvent !== 'all' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleGenerateForEvent(selectedEvent, events.find(e => e._id === selectedEvent)?.title)}
                    disabled={generating}
                    className="px-8 py-5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-green-900/20 hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <Award className={`h-5 w-5 ${generating ? 'animate-spin' : ''}`} />
                    Generate Certs
                  </button>
                  <button
                    onClick={() => handleBulkDownload(selectedEvent, events.find(e => e._id === selectedEvent)?.title)}
                    disabled={bulkDownloading}
                    className="px-8 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <DownloadCloud className={`h-5 w-5 ${bulkDownloading ? 'animate-bounce' : ''}`} />
                    Export ZIP
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Credential Holder</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Event Protocol</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Issue Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">ID Reference</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-6 bg-white/[0.02]" />
                    </tr>
                  ))
                ) : filteredCerts.length > 0 ? (
                  filteredCerts.map((cert) => (
                    <tr key={cert._id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center font-black text-blue-400 text-xs">
                            {cert.user?.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{cert.user?.name}</p>
                            <p className="text-[10px] font-medium text-gray-500">{cert.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div>
                          <p className="text-sm font-bold line-clamp-1">{cert.event?.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <ShieldCheck className="h-3 w-3 text-green-500" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Verified</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="h-4 w-4" />
                          {formatDateIST(cert.createdAt)}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-mono text-[11px] text-gray-500">{cert.certificateId}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => window.open(`/verify-certificate/${cert.verificationCode}`, '_blank')}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-gray-400 hover:text-white"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-gray-400 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <FileText className="h-16 w-16" />
                        <p className="text-sm font-bold uppercase tracking-widest">Zero Records Detected</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-8 flex justify-between items-center text-gray-600">
          <p className="text-[10px] font-black uppercase tracking-widest">Displaying {filteredCerts.length} neural records</p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest">Eventra Central Hub</span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCertificates;
