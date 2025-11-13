import React from 'react';
import useCustomToast from '../../utils/customToast';

const ToastExample = () => {
  const toast = useCustomToast();

  const handleCRUDOperations = () => {
    // Create operation
    toast.createSuccess('New item created successfully!');
    
    // Read operation
    setTimeout(() => {
      toast.fetchSuccess('Data loaded successfully');
    }, 1000);
    
    // Update operation
    setTimeout(() => {
      toast.updateSuccess('Item updated successfully!');
    }, 2000);
    
    // Delete operation
    setTimeout(() => {
      toast.deleteSuccess('Item deleted successfully!');
    }, 3000);
  };

  const handleAuthOperations = () => {
    toast.loginSuccess('Welcome back!');
    
    setTimeout(() => {
      toast.logoutSuccess('Logged out successfully');
    }, 2000);
  };

  const handleEventOperations = () => {
    toast.eventCreateSuccess('Event created successfully!');
    
    setTimeout(() => {
      toast.eventUpdateSuccess('Event updated successfully!');
    }, 1500);
    
    setTimeout(() => {
      toast.eventDeleteSuccess('Event deleted successfully!');
    }, 3000);
  };

  const handlePaymentOperations = () => {
    const loadingId = toast.paymentProcessing('Processing payment...');
    
    setTimeout(() => {
      toast.dismiss(loadingId);
      toast.paymentSuccess('Payment completed successfully!');
    }, 3000);
  };

  const handleGenericToasts = () => {
    toast.success('This is a success message!');
    
    setTimeout(() => {
      toast.error('This is an error message!');
    }, 1000);
    
    setTimeout(() => {
      toast.warning('This is a warning message!');
    }, 2000);
    
    setTimeout(() => {
      toast.info('This is an info message!');
    }, 3000);
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Custom Toast Examples</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={handleCRUDOperations}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          CRUD Operations
        </button>
        
        <button
          onClick={handleAuthOperations}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Auth Operations
        </button>
        
        <button
          onClick={handleEventOperations}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Event Operations
        </button>
        
        <button
          onClick={handlePaymentOperations}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          Payment Operations
        </button>
        
        <button
          onClick={handleGenericToasts}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Generic Toasts
        </button>
      </div>
    </div>
  );
};

export default ToastExample;
