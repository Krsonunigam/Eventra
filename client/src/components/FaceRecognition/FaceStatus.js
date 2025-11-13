import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Database, RefreshCw, Trash2 } from 'lucide-react';
import useCustomToast from '../../utils/customToast';
import faceLocalStorage from '../../utils/faceLocalStorage';

const FaceStatus = ({ onRefresh }) => {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = () => {
  const toast = useCustomToast();
    const info = faceLocalStorage.getStorageInfo();
    setStatus(info);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    loadStatus();
    setTimeout(() => {
      setIsLoading(false);
      if (onRefresh) onRefresh();
    }, 500);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all face data? This action cannot be undone.')) {
      faceLocalStorage.clearFaceData();
      loadStatus();
      toast.success('Face data cleared successfully');
    }
  };

  const handleExport = () => {
    const data = faceLocalStorage.exportFaceData();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `face-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Face data exported successfully');
    } else {
      toast.error('No face data to export');
    }
  };

  if (!status) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Face Recognition Status
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="text-gray-400 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Face Data:</span>
          <div className="flex items-center">
            {status.hasData ? (
              <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400 mr-1" />
            )}
            <span className="text-sm text-gray-300">
              {status.hasData ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">Training Status:</span>
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

        <div className="flex items-center justify-between">
          <span className="text-gray-300">Last Updated:</span>
          <span className="text-sm text-gray-300">
            {status.lastUpdated ? new Date(status.lastUpdated).toLocaleString() : 'Never'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">User ID:</span>
          <span className="text-sm text-gray-300 font-mono">{status.userId}</span>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <button
          onClick={handleExport}
          disabled={!status.hasData}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm transition-colors"
        >
          Export Data
        </button>
        
        <button
          onClick={handleClearData}
          disabled={!status.hasData}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear Data
        </button>
      </div>
    </div>
  );
};

export default FaceStatus;
