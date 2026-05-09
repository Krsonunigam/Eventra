import React from 'react';
import { CheckCircle, AlertCircle, Database } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const FaceStatus = () => {
  const { user } = useAuth();

  if (!user) return null;

  const hasData = user.faceDataCollected === true;
  const isTrained = user.faceSampleCount >= 25;
  const lastUpdated = user.faceTrainingDate;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white flex items-center mb-4">
        <Database className="h-5 w-5 mr-2" />
        Face Recognition Status
      </h3>

      <div className="space-y-3">

        {/* FACE DATA */}
        <div className="flex justify-between">
          <span className="text-gray-300">Face Data:</span>
          <div className="flex items-center">
            {hasData ? (
              <CheckCircle className="text-green-400 mr-1" />
            ) : (
              <AlertCircle className="text-red-400 mr-1" />
            )}
            <span>{hasData ? 'Available' : 'Not Available'}</span>
          </div>
        </div>

        {/* TRAINING */}
        <div className="flex justify-between">
          <span className="text-gray-300">Training:</span>
          <div className="flex items-center">
            {isTrained ? (
              <CheckCircle className="text-green-400 mr-1" />
            ) : (
              <AlertCircle className="text-yellow-400 mr-1" />
            )}
            <span>{isTrained ? 'Completed' : 'Not Completed'}</span>
          </div>
        </div>

        {/* SAMPLES */}
        <div className="flex justify-between">
          <span className="text-gray-300">Samples:</span>
          <span>{user.faceSampleCount || 0}</span>
        </div>

        {/* DATE */}
        <div className="flex justify-between">
          <span className="text-gray-300">Last Training:</span>
          <span>
            {lastUpdated
              ? new Date(lastUpdated).toLocaleString()
              : 'Never'}
          </span>
        </div>

      </div>
    </div>
  );
};

export default FaceStatus;