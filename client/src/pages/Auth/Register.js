import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, GraduationCap, Camera, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import FaceTraining from '../../components/FaceRecognition/FaceTraining';
import useCustomToast from '../../utils/customToast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const { register: registerUser, login, googleLogin, loading, user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const toast = useCustomToast();

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      const result = await registerUser(data);
      if (result.success) {
        // Auto-login so face verification endpoint has auth token
        const loginRes = await login(data.email, data.password);
        if (loginRes.success) {
          // Check if user came from admin subscription page
          const selectedPlan = localStorage.getItem('selectedPlan');
          if (selectedPlan) {
            setRegistrationData({ ...data, selectedPlan });
            setShowFaceCapture(true);
            toast.info('Please complete face training for admin access');
            return;
          }
          
          if (loginRes.user?.role === 'admin') {
            navigate('/admin');
          } else {
            setRegistrationData(data);
            setShowFaceCapture(true);
            toast.info('Please complete face training for attendance tracking');
          }
        } else {
          navigate('/login');
        }
      } else {
        toast.error(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    }
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
          setRegistrationData(user);
          setShowFaceCapture(true);
          toast.info('Please complete face training for attendance tracking');
          return;
        }

        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Google registration failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred during Google registration');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google Registration Failed. Please try again.');
  };

  const handleFaceTrainingComplete = (result) => {
    
    toast.faceRegistrationSuccess('Face training completed successfully!');
    setShowFaceCapture(false);
    
    // Check if user came from admin subscription page
    if (registrationData?.selectedPlan) {
      // Clear the selected plan and redirect to payment
      localStorage.removeItem('selectedPlan');
      navigate(`/admin/subscription?plan=${registrationData.selectedPlan}`);
      return;
    }
    
    // Redirect based on user role - NO MORE FACE VERIFICATION REDIRECT
    if (registrationData?.role === 'admin') {
      navigate('/admin');
    } else {
      // Check if there's a redirect stored (from upcoming events)
      const redirectData = localStorage.getItem('redirectAfterVerification');
      if (redirectData) {
        // Clear redirect data and go directly to the target
        const redirect = JSON.parse(redirectData);
        localStorage.removeItem('redirectAfterVerification');
        
        if (redirect.type === 'event') {
          navigate(`/events/${redirect.eventId}`);
        } else {
          navigate('/dashboard');
        }
      } else {
        // Go directly to dashboard - no more face verification
        navigate('/dashboard');
      }
    }
  };

  const interests = [
    'Technology', 'Sports', 'Music', 'Art', 'Business', 
    'Science', 'Literature', 'Gaming', 'Photography', 'Dance'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0a0a0c]">
      <div className="max-w-3xl w-full space-y-8 relative">
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center relative z-10"
        >
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 mb-6">
            <GraduationCap className="h-10 w-10 text-blue-400" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            Join the Ecosystem
          </h2>
          <p className="mt-3 text-gray-400 font-medium">
            Start your premium event experience with <span className="text-blue-400">Eventra</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] border border-white/5 shadow-2xl relative z-10"
        >
          <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
                    type="text"
                    className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="your name"
                  />
                </div>
                {errors.name && <p className="text-[10px] font-bold text-red-400 ml-1">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } })}
                    type="email"
                    className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="your@example.com"
                  />
                </div>
                {errors.email && <p className="text-[10px] font-bold text-red-400 ml-1">{errors.email.message}</p>}
              </div>

              {/* Student ID */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Student ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    {...register('studentId', { required: 'ID is required' })}
                    type="text"
                    className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="202204178"
                  />
                </div>
                {errors.studentId && <p className="text-[10px] font-bold text-red-400 ml-1">{errors.studentId.message}</p>}
              </div>

              {/* Institute */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Institute
                </label>
                <div className="relative group">
                  <input
                    {...register('institute', { required: 'Institute is required' })}
                    type="text"
                    className="block w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Tula's Institute"
                  />
                </div>
                {errors.institute && <p className="text-[10px] font-bold text-red-400 ml-1">{errors.institute.message}</p>}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Phone Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    {...register('phoneNumber', { required: 'Phone is required', pattern: { value: /^[0-9]{10}$/, message: '10 digits required' } })}
                    type="tel"
                    className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="9876543210"
                  />
                </div>
                {errors.phoneNumber && <p className="text-[10px] font-bold text-red-400 ml-1">{errors.phoneNumber.message}</p>}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Date of Birth
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    {...register('dateOfBirth', { required: 'DOB is required' })}
                    type="date"
                    className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Create Your Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6' } })}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full pl-12 pr-12 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Create Password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Retype Your Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    {...register('confirmPassword', { required: 'Required', validate: (v) => v === password || 'Mismatch' })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="block w-full pl-12 pr-12 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Repeat Password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 text-center">
                Select Your Domains
              </label>
              <div className="flex flex-wrap justify-center gap-3">
                {interests.map((interest) => (
                  <label key={interest} className="cursor-pointer group">
                    <input {...register('interests')} type="checkbox" value={interest} className="hidden peer" />
                    <span className="px-5 py-2.5 rounded-full bg-black/40 border border-white/5 text-xs font-bold text-gray-500 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-500 transition-all inline-block group-hover:border-white/20">
                      {interest}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-6 space-y-4">
              <div className="flex items-center justify-center">
                <input {...register('terms', { required: true })} type="checkbox" className="h-4 w-4 rounded border-white/10 bg-black text-blue-600" />
                <label className="ml-3 text-[11px] text-gray-500">
                  I accept the <button type="button" className="text-white font-bold">Protocol Terms</button> and <button type="button" className="text-white font-bold">Privacy Layer</button>
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-900/30 transition-all flex items-center justify-center gap-3"
              >
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Initializing...</> : 'Establish Identity'}
              </motion.button>
            </div>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5">
            <div className="flex flex-col items-center gap-6">
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Neural Bridge Access</span>
              <div className="w-full max-w-xs flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  theme="filled_black"
                  shape="pill"
                  size="large"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-white hover:text-blue-400 transition-colors">
                Sign in to your node
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <FaceTraining
        isOpen={showFaceCapture}
        onComplete={handleFaceTrainingComplete}
        onClose={() => setShowFaceCapture(false)}
        user={registrationData}
      />
    </div>
  );
};

export default Register;
