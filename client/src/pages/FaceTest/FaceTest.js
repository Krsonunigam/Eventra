import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, User, Settings, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import FaceTraining from '../../components/FaceRecognition/FaceTraining';
import FaceVerification from '../../components/FaceRecognition/FaceVerification';
import faceRecognitionAPI from '../../utils/faceRecognitionAPI';
import { useAuth } from '../../contexts/AuthContext';
import useCustomToast from '../../utils/customToast';

const FaceTest = () => {
  const toast = useCustomToast();
  const { user } = useAuth();
  const [showTraining, setShowTraining] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [faceStatus, setFaceStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkServerStatus();
    if (user?.id) {
      loadFaceStatus();
    }
  }, [user]);

  const checkServerStatus = async () => {
    try {
      const response = await faceRecognitionAPI.healthCheck();
      setServerStatus(response);
      setLoading(false);
    } catch (error) {
      console.error('Server not available:', error);
      setServerStatus(null);
      setLoading(false);
    }
  };

  const loadFaceStatus = async () => {
    if (!user?.id) return;
    
    try {
      const response = await faceRecognitionAPI.getFaceStatus(user.id);
      if (response.success) {
        setFaceStatus(response.status);
      }
    } catch (error) {
      console.error('Error loading face status:', error);
    }
  };

  const handleTrainingComplete = (result) => {
    console.log('Training completed:', result);
    setShowTraining(false);
    toast.success('Face training completed successfully!');
    loadFaceStatus(); // Refresh status
  };

  const handleVerificationSuccess = (result) => {
    console.log('Verification successful:', result);
    setShowVerification(false);
    toast.success('Face verification successful!');
  };

  const clearFaceData = async () => {
    if (!user?.id) return;
    
    try {
      const response = await faceRecognitionAPI.clearFaceData(user.id);
      if (response.success) {
        toast.success('Face data cleared successfully');
        loadFaceStatus();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error clearing face data:', error);
      toast.error('Failed to clear face data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading face recognition system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Face Recognition Test
          </h1>
          <p className="text-xl text-gray-300">
            Test the local face recognition system using face_recognition library
          </p>
        </motion.div>

        {/* Server Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className={`p-6 rounded-lg border ${
            serverStatus 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              {serverStatus ? (
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              )}
              <div>
                <h3 className={`text-lg font-semibold ${
                  serverStatus ? 'text-green-700' : 'text-red-700'
                }`}>
                  Face Recognition Server
                </h3>
                <p className={`text-sm ${
                  serverStatus ? 'text-green-600' : 'text-red-600'
                }`}>
                  {serverStatus 
                    ? `Connected - ${serverStatus.users_count} users, ${serverStatus.encodings_count} encodings`
                    : 'Not connected - Please start the face recognition server'
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Face Status */}
        {faceStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Your Face Recognition Status
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Samples:</strong> {faceStatus.samples || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Trained:</strong> {faceStatus.trained ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Has Data:</strong> {faceStatus.has_data ? 'Yes' : 'No'}
                  </p>
                  {faceStatus.last_training && (
                    <p className="text-sm text-gray-600">
                      <strong>Last Training:</strong> {new Date(faceStatus.last_training).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Training Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Camera className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Face Training</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Train the system to recognize your face by providing multiple samples.
            </p>
            <button
              onClick={() => setShowTraining(true)}
              disabled={!serverStatus}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Start Training
            </button>
          </div>

          {/* Verification Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <User className="w-8 h-8 text-green-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Face Verification</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Test face recognition by verifying your identity against trained data.
            </p>
            <button
              onClick={() => setShowVerification(true)}
              disabled={!serverStatus || !faceStatus?.trained}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Start Verification
            </button>
          </div>
        </motion.div>

        {/* Management Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Management
            </h3>
            
            <div className="flex space-x-4">
              <button
                onClick={checkServerStatus}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Refresh Status
              </button>
              
              {faceStatus?.has_data && (
                <button
                  onClick={clearFaceData}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Clear Face Data
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              How to Use
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>1. Start the Face Recognition Server:</strong></p>
              <p className="ml-4">• Run <code className="bg-blue-100 px-2 py-1 rounded">start_face_recognition_server.bat</code></p>
              <p className="ml-4">• Or manually: <code className="bg-blue-100 px-2 py-1 rounded">python face_recognition_server.py</code></p>
              
              <p><strong>2. Train Your Face:</strong></p>
              <p className="ml-4">• Click "Start Training" and follow the instructions</p>
              <p className="ml-4">• Provide 10 good quality face samples</p>
              
              <p><strong>3. Test Verification:</strong></p>
              <p className="ml-4">• Click "Start Verification" to test recognition</p>
              <p className="ml-4">• Your face will be compared against training data</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <FaceTraining
        isOpen={showTraining}
        onComplete={handleTrainingComplete}
        onClose={() => setShowTraining(false)}
      />

      <FaceVerification
        isOpen={showVerification}
        onSuccess={handleVerificationSuccess}
        onClose={() => setShowVerification(false)}
      />
    </div>
  );
};

export default FaceTest;