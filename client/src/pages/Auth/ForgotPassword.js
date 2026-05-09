import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Mail, KeyRound, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
  const [email, setEmail] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState(''); // Store OTP after verification
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const navigate = useNavigate();
  const toast = useCustomToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const onEmailSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.post('/api/auth/forgot-password', { email: data.email });
      if (res.data.success) {
        setEmail(data.email);
        setStep(2);
        setResendTimer(300); // 5 minutes
        toast.success(res.data.message || 'OTP sent successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    try {
      setLoading(true);
      const res = await api.post('/api/auth/forgot-password', { email });
      if (res.data.success) {
        setResendTimer(300);
        toast.success('OTP resent successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const onOTPSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.post('/api/auth/verify-otp', { email, otp: data.otp });
      if (res.data.success) {
        setVerifiedOtp(data.otp); // Save it in state for the reset step
        setStep(3);
        toast.success('OTP verified successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.post('/api/auth/reset-password', { 
        email, 
        otp: verifiedOtp, // Use the OTP saved from step 2
        newPassword: data.newPassword 
      });
      if (res.data.success) {
        toast.success('Password reset successfully');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0a0a0c]">
      <div className="max-w-md w-full space-y-8 relative">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center relative z-10"
        >
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 mb-6">
            <KeyRound className="h-10 w-10 text-blue-400" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'Reset Password'}
          </h2>
          <p className="mt-3 text-gray-400 font-medium">
            {step === 1 && 'Enter your email to receive a reset code'}
            {step === 2 && `Enter the 6-digit code sent to ${email}`}
            {step === 3 && 'Enter your new secure password'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative z-10"
        >
          {step === 1 && (
            <form className="space-y-5" onSubmit={handleSubmit(onEmailSubmit)}>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    })}
                    type="email"
                    className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs font-bold text-red-400 ml-1">
                    {errors.email.message}
                  </motion.p>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Code'}
              </motion.button>
            </form>
          )}

          {step === 2 && (
            <form className="space-y-5" onSubmit={handleSubmit(onOTPSubmit)}>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                  6-Digit Code
                </label>
                <input
                  {...register('otp', {
                    required: 'OTP is required',
                    minLength: { value: 6, message: 'OTP must be 6 digits' },
                    maxLength: { value: 6, message: 'OTP must be 6 digits' }
                  })}
                  type="text"
                  maxLength="6"
                  className="block w-full py-4 text-center tracking-[1em] font-mono text-2xl bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="------"
                />
                {errors.otp && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs font-bold text-red-400 ml-1 text-center">
                    {errors.otp.message}
                  </motion.p>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Code'}
              </motion.button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || loading}
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:hover:text-gray-400"
                >
                  {resendTimer > 0 ? `Resend code in ${formatTime(resendTimer)}` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form className="space-y-5" onSubmit={handleSubmit(onResetSubmit)}>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    {...register('newPassword', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters required' }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full pl-12 pr-12 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs font-bold text-red-400 ml-1">
                    {errors.newPassword.message}
                  </motion.p>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Update Password</>}
              </motion.button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
