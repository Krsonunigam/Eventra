import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import FaceTraining from '../../components/FaceRecognition/FaceTraining';
import FaceVerification from '../../components/FaceRecognition/FaceVerification';
import faceLocalStorage from '../../utils/faceLocalStorage';

const FaceVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showFaceTraining, setShowFaceTraining] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [hasFaceData, setHasFaceData] = useState(false);
  
  // Get redirect data from location state or localStorage
  const redirectData = location.state?.redirectData || 
    (localStorage.getItem('redirectAfterVerification') ? 
      JSON.parse(localStorage.getItem('redirectAfterVerification')) : null);

  useEffect(() => {
    // Check if user has face data
    const faceData = faceLocalStorage.getCurrentUserFaceData();
    if (faceData && faceData.samples && faceData.samples.length > 0) {
      setHasFaceData(true);
      setShowFaceVerification(true);
    } else {
      setShowFaceTraining(true);
    }
  }, []);

  const handleTrainingComplete = (result) => {
    
    setShowFaceTraining(false);
    setShowFaceVerification(true);
    setHasFaceData(true);
  };

  const handleVerificationSuccess = (result) => {
    
    setShowFaceVerification(false);
    
    // Clear the redirect data from localStorage
    localStorage.removeItem('redirectAfterVerification');
    
    // Navigate based on redirect data or user role
    if (redirectData && redirectData.type === 'event') {
      navigate(`/events/${redirectData.eventId}`);
    } else {
      // Check if user is admin and redirect accordingly
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleVerificationFailure = (error) => {
    
    // Could show error message or retry option
  };

  const handleTrainingClose = () => {
    setShowFaceTraining(false);
    // If no face data was collected, redirect to dashboard
    navigate('/dashboard');
  };

  const handleVerificationClose = () => {
    setShowFaceVerification(false);
    // Redirect to dashboard if verification is cancelled
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Face Recognition
          </h1>
          <p className="text-gray-400 mb-6">
            {hasFaceData 
              ? 'Please verify your identity to continue'
              : 'Please complete face training to continue'
            }
          </p>
          
          {!hasFaceData && (
            <button
              onClick={() => setShowFaceTraining(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Start Face Training
            </button>
          )}
          
          {hasFaceData && (
            <button
              onClick={() => setShowFaceVerification(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Verify Identity
            </button>
          )}
        </div>
      </motion.div>

      {/* Face Training Modal */}
      <FaceTraining
        isOpen={showFaceTraining}
        onComplete={handleTrainingComplete}
        onClose={handleTrainingClose}
      />

      {/* Face Verification Modal */}
      <FaceVerification
        isOpen={showFaceVerification}
        onSuccess={handleVerificationSuccess}
        onFailure={handleVerificationFailure}
        onClose={handleVerificationClose}
      />
    </div>
  );
};

export default FaceVerify;