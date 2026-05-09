import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, Calendar, Camera, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import FaceTraining from '../../components/FaceRecognition/FaceTraining';
import useCustomToast from '../../utils/customToast';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [userWithoutFaceData, setUserWithoutFaceData] = useState(null);
  const { login, googleLogin, loading } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const toast = useCustomToast();

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password);

    if (!result.success) {
      toast.error(result.error || 'Login failed');
      return;
    }

    const user = result.user;

    if (!user) {
      toast.error('User not loaded, try again');
      return;
    }

    if (user.role === 'admin') {
      setShowFaceCapture(false);
      setUserWithoutFaceData(null);
      navigate('/admin');
      return;
    }

      // 🔥 FINAL CHECK
    const hasCompletedFaceTraining =
      user.faceTrainingCompleted === true && user.faceDataCollected === true;

    if (!hasCompletedFaceTraining) {
      setUserWithoutFaceData(user);
      setShowFaceCapture(true);
      toast.info('Please complete face training for attendance tracking');
      return;
    }

    setShowFaceCapture(false);
    setUserWithoutFaceData(null);
    navigate('/dashboard');
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const result = await googleLogin(credentialResponse.credential);
      if (result.success) {
        const user = result.user;
        
        if (user.role === 'admin') {
          navigate('/admin');
          return;
        }

        const hasCompletedFaceTraining = 
          user.faceTrainingCompleted === true && user.faceDataCollected === true;

        if (!hasCompletedFaceTraining) {
          setUserWithoutFaceData(user);
          setShowFaceCapture(true);
          toast.info('Please complete face training for attendance tracking');
          return;
        }

        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Google login failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred during Google login');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google Login Failed. Please try again.');
  };

const handleFaceTrainingComplete = (result) => {
  
  toast.faceRegistrationSuccess('Face training completed successfully!');
  setShowFaceCapture(false);

  // Check if user came from admin subscription page
  if (userWithoutFaceData?.selectedPlan) {
    // Clear the selected plan and redirect to payment
    localStorage.removeItem('selectedPlan');
    navigate(`/admin/subscription?plan=${userWithoutFaceData.selectedPlan}`);
    return;
  }

  // Redirect based on user role
  if (userWithoutFaceData?.role === 'admin') {
    navigate('/admin');
  } else {
    navigate('/dashboard');
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0a0a0c]">
      <div className="max-w-md w-full space-y-8 relative">
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center relative z-10"
        >
          {/* <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 mb-6">
            <Calendar className="h-10 w-10 text-blue-400" />
          </div> */}
          <h2 className="text-4xl font-black text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-3 text-gray-400 font-medium">
            Continue your journey with <span className="text-blue-400">Eventra</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative z-10"
        >
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                Identity
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email or username is required',
                    validate: (value) => {
                      if (value === 'adminyadav') return true;
                      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                      return emailRegex.test(value) || 'Invalid email address';
                    }
                  })}
                  type="text"
                  className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="Email or username"
                />
              </div>
              {errors.email && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs font-bold text-red-400 ml-1">
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-tighter transition-colors">
                  Recovery
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  {...register('password', {
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
              {errors.password && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs font-bold text-red-400 ml-1">
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            <div className="flex items-center ml-1">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-white/10 bg-black text-blue-600 focus:ring-blue-500/50 transition-all"
              />
              <label htmlFor="remember-me" className="ml-3 block text-xs font-medium text-gray-400">
                Keep me logged in
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </motion.button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-gray-900 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  Secure Social Access
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_black"
                shape="pill"
                size="large"
                width="100%"
              />
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              New here?{' '}
              <Link to="/register" className="font-bold text-white hover:text-blue-400 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <FaceTraining
        isOpen={showFaceCapture}
        onComplete={handleFaceTrainingComplete}
        onClose={() => setShowFaceCapture(false)}
        user={userWithoutFaceData}
      />
    </div>
  );
};

export default Login;
