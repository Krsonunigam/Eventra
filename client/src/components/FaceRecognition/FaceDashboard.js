import React, { useState } from 'react';
import { Camera, CheckCircle, AlertCircle, User } from 'lucide-react';
import FaceTraining from './FaceTraining';
import FaceVerification from './FaceVerification';
import FaceStatus from './FaceStatus';
import faceLocalStorage from '../../utils/faceLocalStorage';

const FaceDashboard = () => {
  const [showTraining, setShowTraining] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleTrainingComplete = (result) => {
    console.log('Training completed:', result);
    setShowTraining(false);
    handleRefresh();
  };

  const handleVerificationSuccess = (result) => {
    console.log('Verification successful:', result);
    setShowVerification(false);
  };

  const status = faceLocalStorage.getStorageInfo();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Face Recognition System</h1>
        <p className="text-gray-400">
          Manage your face recognition data and test the system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="lg:col-span-2">
          <FaceStatus key={refreshKey} onRefresh={handleRefresh} />
        </div>

        {/* Training Card */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Camera className="h-6 w-6 text-blue-400 mr-3" />
            <h3 className="text-xl font-semibold text-white">Face Training</h3>
          </div>
          
          <p className="text-gray-300 mb-4">
            Train your face model for accurate recognition. Collect at least 20 samples for best results.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Status:</span>
              <div className="flex items-center">
                {status.isTrained ? (
                  <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-400 mr-1" />
                )}
                <span className="text-sm text-gray-300">
                  {status.isTrained ? 'Trained' : 'Not Trained'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Samples:</span>
              <span className="text-sm text-gray-300">{status.sampleCount}</span>
            </div>
          </div>

          <button
            onClick={() => setShowTraining(true)}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {status.isTrained ? 'Retrain Model' : 'Start Training'}
          </button>
        </div>

        {/* Verification Card */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <User className="h-6 w-6 text-green-400 mr-3" />
            <h3 className="text-xl font-semibold text-white">Face Verification</h3>
          </div>
          
          <p className="text-gray-300 mb-4">
            Test face recognition with your trained model. Make sure you have completed training first.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Ready:</span>
              <div className="flex items-center">
                {status.isTrained ? (
                  <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400 mr-1" />
                )}
                <span className="text-sm text-gray-300">
                  {status.isTrained ? 'Ready' : 'Not Ready'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Method:</span>
              <span className="text-sm text-gray-300">Local Storage</span>
            </div>
          </div>

          <button
            onClick={() => setShowVerification(true)}
            disabled={!status.isTrained}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Test Verification
          </button>
        </div>
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

export default FaceDashboard;
