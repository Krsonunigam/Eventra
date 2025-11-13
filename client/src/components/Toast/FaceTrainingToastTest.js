import React from 'react';
import useCustomToast from '../../utils/customToast';

const FaceTrainingToastTest = () => {
  const toast = useCustomToast();
  
  // Face training specific toast configuration
  const faceTrainingToast = {
    success: (message) => toast.success(message, { 
      duration: 2000, 
      position: 'top-right',
      style: { 
        fontSize: '14px',
        padding: '8px 12px',
        maxWidth: '300px'
      }
    }),
    error: (message) => toast.error(message, { 
      duration: 2500, 
      position: 'top-right',
      style: { 
        fontSize: '14px',
        padding: '8px 12px',
        maxWidth: '300px'
      }
    }),
    info: (message) => toast.info(message, { 
      duration: 2000, 
      position: 'top-right',
      style: { 
        fontSize: '14px',
        padding: '8px 12px',
        maxWidth: '300px'
      }
    }),
    warning: (message) => toast.warning(message, { 
      duration: 2000, 
      position: 'top-right',
      style: { 
        fontSize: '14px',
        padding: '8px 12px',
        maxWidth: '300px'
      }
    })
  };

  const testFaceTrainingToasts = () => {
    // Simulate face training process
    faceTrainingToast.info('Starting face training...');
    
    setTimeout(() => {
      faceTrainingToast.success('✅ Face detected! Sample 1/25 captured');
    }, 1000);
    
    setTimeout(() => {
      faceTrainingToast.success('✅ Face detected! Sample 5/25 captured');
    }, 2000);
    
    setTimeout(() => {
      faceTrainingToast.warning('Please position your face in the camera');
    }, 3000);
    
    setTimeout(() => {
      faceTrainingToast.error('No face detected in sample 6. Please position your face in the camera.');
    }, 4000);
    
    setTimeout(() => {
      faceTrainingToast.success('✅ Face detected! Sample 10/25 captured');
    }, 5000);
    
    setTimeout(() => {
      faceTrainingToast.success('✅ Training complete! 25 samples collected.');
    }, 6000);
    
    setTimeout(() => {
      faceTrainingToast.success('Face model trained successfully!');
    }, 7000);
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-6">Face Training Toast Test</h2>
      <p className="text-gray-300 mb-6">
        This demonstrates the face training toast notifications that appear on the right side 
        with smaller size and shorter duration.
      </p>
      
      <div className="space-y-4">
        <button
          onClick={testFaceTrainingToasts}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Test Face Training Toasts
        </button>
        
        <div className="space-y-2">
          <button
            onClick={() => faceTrainingToast.success('✅ Face detected! Sample 1/25 captured')}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Success Toast
          </button>
          
          <button
            onClick={() => faceTrainingToast.error('No face detected. Please position your face in the camera.')}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Error Toast
          </button>
          
          <button
            onClick={() => faceTrainingToast.warning('Please position your face in the camera')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Warning Toast
          </button>
          
          <button
            onClick={() => faceTrainingToast.info('Starting face training...')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Info Toast
          </button>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Face Training Toast Features:</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Position: Top-right corner</li>
          <li>• Duration: 2-2.5 seconds (shorter than default)</li>
          <li>• Size: Smaller font (14px) and padding (8px 12px)</li>
          <li>• Max width: 300px (compact)</li>
          <li>• Perfect for face training feedback</li>
        </ul>
      </div>
    </div>
  );
};

export default FaceTrainingToastTest;
