import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Camera, CheckCircle, AlertCircle, Shield, Cpu, Zap,
  RefreshCw, ArrowRight, Star, Lock, Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import FaceTraining from '../../components/FaceRecognition/FaceTraining';
import useCustomToast from '../../utils/customToast';
import api from '../../utils/axiosConfig';

const FaceTest = () => {
  const { user, refreshUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useCustomToast();

  const [showTraining, setShowTraining] = useState(false);
  const [faceStatus, setFaceStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Fetch latest face status from server
  const fetchFaceStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await api.get('/api/face/status');
      if (res.data.success) {
        setFaceStatus(res.data);
      }
    } catch (err) {
      // Fallback to user context data
      if (user) {
        setFaceStatus({
          faceDataCollected: user.faceDataCollected || false,
          faceTrainingCompleted: user.faceTrainingCompleted || false,
          isFaceVerified: user.isFaceVerified || false,
          faceSampleCount: user.faceSampleCount || 0,
          faceTrainingDate: user.faceTrainingDate || null,
          faceDataQuality: user.faceDataQuality || 'medium'
        });
      }
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchFaceStatus();
  }, [isAuthenticated]);

  const handleTrainingComplete = async (result) => {
    setShowTraining(false);
    toast.success('Face recognition setup complete!');
    await refreshUser();
    await fetchFaceStatus();
  };

  const isSetup = faceStatus?.faceDataCollected && faceStatus?.faceTrainingCompleted;

  const features = [
    { icon: Zap, title: 'Instant Attendance', desc: 'Mark attendance in under 2 seconds using your face', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { icon: Shield, title: 'End-to-End Encrypted', desc: 'Your biometric data is encrypted and never shared', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    { icon: Cpu, title: 'AI-Powered', desc: 'Advanced face recognition with 95%+ accuracy', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { icon: Activity, title: 'Real-Time Processing', desc: 'Face matching happens in milliseconds on our servers', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] py-12 px-4">
      {/* Background glow */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Camera className="h-3.5 w-3.5" />
            Biometric System
          </div>
          <h1 className="text-4xl font-black text-white mb-3">
            Face Recognition Setup
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Set up your biometric profile once and mark attendance at any event with just your face — no QR codes needed.
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-2xl border ${
            isSetup
              ? 'bg-green-500/5 border-green-500/20'
              : 'bg-yellow-500/5 border-yellow-500/20'
          }`}
        >
          {loadingStatus ? (
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
              <span className="text-gray-400">Checking face recognition status...</span>
            </div>
          ) : isSetup ? (
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-green-300 font-bold text-lg">Face Recognition Active ✅</h3>
                  <p className="text-green-400/70 text-sm">
                    {faceStatus?.faceSampleCount || 0} samples · Quality: {faceStatus?.faceDataQuality || 'high'}
                    {faceStatus?.faceTrainingDate && (
                      <> · Trained {new Date(faceStatus.faceTrainingDate).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTraining(true)}
                  className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm font-semibold hover:bg-green-500/20 transition-colors"
                >
                  Re-train
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  Dashboard <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-yellow-300 font-bold text-lg">Setup Required</h3>
                  <p className="text-yellow-400/70 text-sm">
                    Capture 25 face samples to enable biometric attendance
                  </p>
                </div>
              </div>
              <button
                onClick={fetchFaceStatus}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Refresh status"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Main CTA */}
        {!isSetup && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border border-blue-500/20 rounded-3xl p-8 text-center"
          >
            <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Camera className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">
              Ready to Set Up?
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              The process takes about 30 seconds. Make sure you're in good lighting and look directly at the camera.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowTraining(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black rounded-2xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all"
              >
                <Camera className="h-5 w-5" />
                Start Face Setup
              </motion.button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 font-semibold rounded-2xl transition-all"
              >
                Skip for now
              </button>
            </div>

            <p className="text-gray-600 text-xs mt-6">
              <Lock className="h-3 w-3 inline mr-1" />
              All biometric data is encrypted end-to-end
            </p>
          </motion.div>
        )}

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className={`p-5 rounded-2xl border ${f.bg}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl bg-black/20`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm mb-1">{f.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900/50 border border-white/5 rounded-2xl p-6"
        >
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            How It Works
          </h3>
          <div className="space-y-3">
            {[
              { step: '01', text: 'Click "Start Face Setup" and allow camera access' },
              { step: '02', text: 'Look at the camera — 25 samples are captured automatically in ~25 seconds' },
              { step: '03', text: 'Click "Upload" to send samples to our secure server' },
              { step: '04', text: 'Done! Use face recognition for all future event attendance' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-4">
                <span className="text-blue-400 font-black text-lg w-8 shrink-0">{step}</span>
                <p className="text-gray-400 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Back link */}
        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* FaceTraining Modal */}
      <FaceTraining
        isOpen={showTraining}
        onComplete={handleTrainingComplete}
        onClose={() => setShowTraining(false)}
        user={user}
      />
    </div>
  );
};

export default FaceTest;
