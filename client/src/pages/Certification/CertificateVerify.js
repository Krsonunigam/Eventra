import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  Calendar, 
  Award, 
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Building2,
  Clock
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import { formatDateIST } from '../../utils/timezoneUtils';

const CertificateVerify = () => {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [verificationData, setVerificationData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get('id');

    const verify = async () => {
      try {
        setLoading(true);
        // Use verify-id endpoint for manual IDs, or verify/code for QR scans
        const endpoint = id 
          ? `/api/certificates/verify-id/${id}` 
          : `/api/certificates/verify/${code}`;
          
        const response = await api.get(endpoint);
        if (response.data.success) {
          setVerificationData(response.data.data);
        } else {
          setError('Invalid or expired certificate code');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Verification system error');
      } finally {
        setLoading(false);
      }
    };

    if (code || id) verify();
  }, [code]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* Neural Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#2563eb 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-xl w-full relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Return to Base</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900/60 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 sm:p-12 shadow-2xl overflow-hidden relative"
        >
          {/* Header Status */}
          <div className="text-center mb-12">
            <div className={`inline-flex items-center justify-center p-6 rounded-full mb-6 ${loading ? 'bg-blue-500/10' : error ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              {loading ? (
                <ShieldCheck className="h-16 w-16 text-blue-500 animate-pulse" />
              ) : error ? (
                <ShieldAlert className="h-16 w-16 text-red-500" />
              ) : (
                <ShieldCheck className="h-16 w-16 text-green-500" />
              )}
            </div>
            
            <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">
              {loading ? 'Validating ID...' : error ? 'Verification Failed' : 'Authentic Record'}
            </h1>
            <p className="text-gray-500 font-medium tracking-tighter uppercase text-xs">
              Blockchain-Verified Certificate Layer
            </p>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl mb-8">
                <p className="text-red-400 font-bold">{error}</p>
                <p className="text-sm text-red-400/60 mt-2">This ID does not match any records in the Eventra neural database.</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
              >
                Retry Validation
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Recipient Card */}
              <div className="p-6 bg-white/5 border border-white/5 rounded-3xl group hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl">
                    <User className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Credential Holder</p>
                    <h3 className="text-xl font-bold">{verificationData.recipient}</h3>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
                </div>
              </div>

              {/* Event Card */}
              <div className="p-6 bg-white/5 border border-white/5 rounded-3xl group hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/10 rounded-2xl">
                    <Award className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Authenticated Achievement</p>
                    <h3 className="text-xl font-bold line-clamp-1">{verificationData.event}</h3>
                  </div>
                </div>
              </div>

              {/* Meta Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white/5 border border-white/5 rounded-3xl">
                  <Calendar className="h-4 w-4 text-gray-500 mb-2" />
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Event Date</p>
                  <p className="text-sm font-bold">{formatDateIST(verificationData.eventDate)}</p>
                </div>
                <div className="p-5 bg-white/5 border border-white/5 rounded-3xl">
                  <ShieldCheck className="h-4 w-4 text-gray-500 mb-2" />
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Issue Status</p>
                  <p className="text-sm font-bold uppercase text-green-400">{verificationData.status}</p>
                </div>
              </div>

              {/* Full Details for Authorized Users */}
              {verificationData.fullDetails && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-gray-300">{verificationData.fullDetails.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-gray-300">{verificationData.fullDetails.institute}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Verification Hash</span>
                    <span className="text-[10px] font-mono text-blue-400">{verificationData.fullDetails.verificationCode}</span>
                  </div>
                </motion.div>
              )}

              {/* Trust Badge */}
              <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/10 rounded-2xl mt-8">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-green-500/60" />
                  <span className="text-[10px] font-bold text-green-500/80 uppercase tracking-widest">Eventra Trusted Issuer</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-green-500/80 uppercase tracking-widest">Active ID</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Footer Branding */}
          {!loading && !error && (
            <div className="mt-12 pt-8 border-t border-white/5 text-center">
              <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] mb-4">Eventra Verification Node</p>
              <div className="flex justify-center items-center gap-6">
                <img src="/logo192.png" alt="Eventra" className="h-6 w-6 grayscale opacity-30" />
                <span className="text-gray-800 font-bold tracking-tighter">SECURE. AUTHENTIC. VERIFIED.</span>
              </div>
            </div>
          )}
        </motion.div>
        
        <p className="text-center mt-8 text-gray-700 font-mono text-[10px]">
          CID: {code} // NODE: {window.location.hostname}
        </p>
      </div>
    </div>
  );
};

export default CertificateVerify;
