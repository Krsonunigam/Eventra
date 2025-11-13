import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, GraduationCap, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import FaceTraining from '../../components/FaceRecognition/FaceTraining';
import useCustomToast from '../../utils/customToast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const { register: registerUser, login, loading, user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const toast = useCustomToast();

  const password = watch('password');

  const onSubmit = async (data) => {
    const result = await registerUser(data);
    if (result.success) {
      // Auto-login so face verification endpoint has auth token
      const loginRes = await login(data.email, data.password);
      if (loginRes.success) {
        // Check if user came from admin subscription page
        const selectedPlan = localStorage.getItem('selectedPlan');
        if (selectedPlan) {
          // Store the selected plan for after face recognition
          // Don't clear it yet, we'll need it after face training
          // Store registration data and show face training for admin users too
          setRegistrationData({ ...data, selectedPlan });
          setShowFaceCapture(true);
          toast.info('Please complete face training for admin access');
          return;
        }
        
        // Skip face recognition for admin users
        if (loginRes.user?.role === 'admin') {
          navigate('/admin');
        } else {
          // Store registration data and show face training for non-admin users
          setRegistrationData(data);
          setShowFaceCapture(true);
          toast.info('Please complete face training for attendance tracking');
        }
      } else {
        navigate('/login');
      }
    }
  };

  const handleFaceTrainingComplete = (result) => {
    console.log('Face training completed:', result);
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
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
              <Calendar className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-gray-400">
            Join Eventra and start managing events
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-800 p-8 rounded-xl border border-gray-700"
        >
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('name', { 
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters'
                      }
                    })}
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-300 mb-2">
                  Student ID
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('studentId', { 
                      required: 'Student ID is required',
                      minLength: {
                        value: 3,
                        message: 'Student ID must be at least 3 characters'
                      }
                    })}
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Enter your student ID"
                  />
                </div>
                {errors.studentId && (
                  <p className="mt-1 text-sm text-red-400">{errors.studentId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="institute" className="block text-sm font-medium text-gray-300 mb-2">
                  Institute/University
                </label>
                <input
                  {...register('institute', { 
                    required: 'Institute is required',
                    minLength: {
                      value: 2,
                      message: 'Institute name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter your institute name"
                />
                {errors.institute && (
                  <p className="mt-1 text-sm text-red-400">{errors.institute.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('dateOfBirth', { 
                      required: 'Date of birth is required',
                      validate: (value) => {
                        const age = new Date().getFullYear() - new Date(value).getFullYear();
                        return age >= 18 || 'You must be 18 years or older';
                      }
                    })}
                    type="date"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('phoneNumber', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Please enter a valid 10-digit phone number'
                      }
                    })}
                    type="tel"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-400">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('confirmPassword', { 
                      required: 'Please confirm your password',
                      validate: (value) => value === password || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Interests (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {interests.map((interest) => (
                    <label key={interest} className="flex items-center">
                      <input
                        {...register('interests')}
                        type="checkbox"
                        value={interest}
                        className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-600 rounded bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-300">{interest}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                {...register('terms', { required: 'You must accept the terms and conditions' })}
                type="checkbox"
                className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-600 rounded bg-gray-700"
              />
              <label className="ml-2 block text-sm text-gray-300">
                I agree to the{' '}
                <button type="button" className="text-cyan-400 hover:text-cyan-300">
                  Terms and Conditions
                </button>{' '}
                and{' '}
                <button type="button" className="text-cyan-400 hover:text-cyan-300">
                  Privacy Policy
                </button>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-400">{errors.terms.message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Face Training Modal */}
      <FaceTraining
        isOpen={showFaceCapture}
        onComplete={handleFaceTrainingComplete}
        onClose={() => setShowFaceCapture(false)}
      />
    </div>
  );
};

export default Register;
