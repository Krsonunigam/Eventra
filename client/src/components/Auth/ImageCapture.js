import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, CheckCircle, AlertCircle, X, Upload, Eye, Zap, Shield } from 'lucide-react';
import useCustomToast from '../../utils/customToast';
import api from '../../utils/axiosConfig';

const ImageCapture = ({ isOpen, onComplete, onClose, user }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [captureComplete, setCaptureComplete] = useState(false);
  const [imageQuality, setImageQuality] = useState('good');

  const totalSteps = 3;
  const requiredImages = 3;

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      
      toast.error('Camera access denied. Please allow camera access to continue.');
    }
  };

  const stopCamera = () => {
  const toast = useCustomToast();
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setIsStreaming(false);
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    setIsProcessing(true);

    try {
      // Analyze image quality
      const quality = analyzeImageQuality(imageData);
      setImageQuality(quality);

      const newImages = [...capturedImages, imageData];
      setCapturedImages(newImages);
      
      if (newImages.length >= requiredImages) {
        setCurrentStep(3);
        setCaptureComplete(true);
        toast.success('Image capture completed successfully!');
        
        // Call onComplete with the result
        if (onComplete) {
          onComplete({
            success: true,
            images: newImages,
            quality: quality,
            message: 'Image capture completed'
          });
        }
      } else {
        setCurrentStep(2);
        toast.success(`Image ${newImages.length}/${requiredImages} captured successfully!`);
      }
    } catch (error) {
      
      toast.error('Image capture failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeImageQuality = (imageData) => {
    // Simple image quality analysis
    // In a real implementation, you would use more sophisticated analysis
    const size = imageData.length;
    if (size > 100000) return 'excellent';
    if (size > 50000) return 'good';
    if (size > 20000) return 'fair';
    return 'poor';
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        const quality = analyzeImageQuality(imageData);
        setImageQuality(quality);
        
        const newImages = [...capturedImages, imageData];
        setCapturedImages(newImages);
        
        if (newImages.length >= requiredImages) {
          setCurrentStep(3);
          setCaptureComplete(true);
          toast.success('Image upload completed successfully!');
          
          if (onComplete) {
            onComplete({
              success: true,
              images: newImages,
              quality: quality,
              message: 'Image upload completed'
            });
          }
        } else {
          setCurrentStep(2);
          toast.success(`Image ${newImages.length}/${requiredImages} uploaded successfully!`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Position Your Face';
      case 2:
        return 'Capture Images';
      case 3:
        return 'Capture Complete';
      default:
        return 'Image Capture';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return 'Position your face in the center of the frame and ensure good lighting';
      case 2:
        return `Capture ${requiredImages} clear images from different angles (${capturedImages.length}/${requiredImages} completed)`;
      case 3:
        return 'Your image capture is complete and ready for verification';
      default:
        return 'Follow the steps to capture your images';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Image Capture</h2>
              <p className="text-gray-400 text-sm">Secure photo verification</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{getStepTitle()}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Step {currentStep} of {totalSteps}</span>
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-gray-300 text-sm">{getStepDescription()}</p>
        </div>

        {/* Camera Feed */}
        {currentStep < 3 && (
          <div className="mb-6">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Camera Status */}
              <div className="absolute top-4 left-4">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                  isStreaming ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isStreaming ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm font-medium">
                    {isStreaming ? 'Camera Active' : 'Camera Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Position Face */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Eye className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-blue-300 font-medium mb-2">Positioning Tips:</h4>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Look directly at the camera</li>
                    <li>• Ensure good lighting on your face</li>
                    <li>• Keep your face centered in the frame</li>
                    <li>• Remove glasses or hats if possible</li>
                    <li>• Maintain a neutral expression</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 font-medium"
            >
              Ready to Start
            </button>
          </div>
        )}

        {/* Step 2: Capture Images */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Camera className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-yellow-300 font-medium mb-2">Capture Instructions:</h4>
                  <ul className="text-yellow-200 text-sm space-y-1">
                    <li>• Capture images from different angles</li>
                    <li>• Slight head movements are okay</li>
                    <li>• Ensure face is clearly visible</li>
                    <li>• Good lighting is important</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Progress:</span>
                <div className="flex space-x-1">
                  {Array.from({ length: requiredImages }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full ${
                        index < capturedImages.length ? 'bg-green-400' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-300">
                  {capturedImages.length}/{requiredImages}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={captureImage}
                disabled={isProcessing || !isStreaming}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Image
                  </>
                )}
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Step 3: Capture Complete */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-300 mb-2">Capture Complete!</h3>
              <p className="text-green-200 mb-4">
                Your images have been captured and are ready for verification.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">Secure Storage</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <Zap className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">Fast Verification</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">Accurate Recognition</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg transition-all duration-200 font-medium"
            >
              Complete Capture
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Your images are encrypted and secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Quality: {imageQuality}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ImageCapture;
