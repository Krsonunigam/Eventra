import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Download, 
  Eye, 
  Search, 
  Calendar, 
  MapPin, 
  FileCheck, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Clock
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';
import { formatDateIST } from '../../utils/timezoneUtils';

const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingId, setGeneratingId] = useState(null);
  const toast = useCustomToast();

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/certificates/my-certificates');
      if (response.data.success) {
        setCertificates(response.data.certificates);
      }
    } catch (error) {
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certId, certName) => {
    try {
      setGeneratingId(certId);
      const response = await api.get(`/api/certificates/download/${certId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate_${certName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      toast.error('Failed to download certificate');
    } finally {
      setGeneratingId(null);
    }
  };

  const filteredCertificates = certificates.filter(cert => 
    cert.event?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.certificateId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <Award className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">My Certifications</h1>
              <p className="text-gray-400 font-medium">Your verified achievements and participation history</p>
            </div>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search certificates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>
            <button 
              onClick={fetchCertificates}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-bold"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 font-medium">Scanning blockchain for your records...</p>
          </div>
        ) : filteredCertificates.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCertificates.map((cert) => (
              <motion.div
                key={cert._id}
                variants={cardVariants}
                className="group relative bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
              >
                {/* Decorative Elements */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
                      <FileCheck className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                      <ShieldCheck className="h-3 w-3 text-green-400" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-green-400">Verified</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {cert.event?.title}
                  </h3>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateIST(cert.event?.dateTime?.start)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{cert.event?.venue?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{cert.metadata?.eventDuration?.toFixed(1)} Hours Credited</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-white/5">
                    <button
                      onClick={() => handleDownload(cert._id, cert.event?.title)}
                      disabled={generatingId === cert._id}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {generatingId === cert._id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Download PDF
                    </button>
                    <button 
                      onClick={() => window.open(`/verify-certificate/${cert.verificationCode}`, '_blank')}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group/btn"
                      title="Verify Certificate"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover/btn:text-white" />
                    </button>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <span className="text-[10px] text-gray-500 font-mono tracking-tighter">
                      ID: {cert.certificateId}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 bg-white/5 border border-white/10 border-dashed rounded-[3rem]"
          >
            <div className="p-6 rounded-full bg-white/5 mb-6">
              <AlertCircle className="h-16 w-16 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No Certifications Found</h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : 'Attend events and ask your admin to generate certificates after the event ends.'}
            </p>
            {!searchQuery && (
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => window.location.href = '/events'}
                  className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-blue-400 transition-all"
                >
                  Explore Events
                </button>
                <button 
                  onClick={fetchCertificates}
                  className="px-8 py-3 bg-white/10 border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" /> Check Again
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyCertificates;
