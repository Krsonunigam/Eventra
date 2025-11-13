import toast from 'react-hot-toast';

// Custom toast configurations
const toastConfig = {
  success: {
    duration: 4000,
    style: {
      background: '#10B981',
      color: '#ffffff',
      border: '1px solid #059669',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#10B981',
    },
  },
  error: {
    duration: 5000,
    style: {
      background: '#EF4444',
      color: '#ffffff',
      border: '1px solid #DC2626',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#EF4444',
    },
  },
  warning: {
    duration: 4000,
    style: {
      background: '#F59E0B',
      color: '#ffffff',
      border: '1px solid #D97706',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#F59E0B',
    },
  },
  info: {
    duration: 4000,
    style: {
      background: '#3B82F6',
      color: '#ffffff',
      border: '1px solid #2563EB',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#3B82F6',
    },
  },
};

// CRUD operation toast notifications
export const toastUtils = {
  // Create operations
  createSuccess: (message = 'Created successfully!') => {
    toast.success(message, toastConfig.success);
  },

  createError: (message = 'Failed to create') => {
    toast.error(message, toastConfig.error);
  },

  // Read operations
  fetchSuccess: (message = 'Data loaded successfully') => {
    toast.success(message, toastConfig.success);
  },

  fetchError: (message = 'Failed to load data') => {
    toast.error(message, toastConfig.error);
  },

  // Update operations
  updateSuccess: (message = 'Updated successfully!') => {
    toast.success(message, toastConfig.success);
  },

  updateError: (message = 'Failed to update') => {
    toast.error(message, toastConfig.error);
  },

  // Delete operations
  deleteSuccess: (message = 'Deleted successfully!') => {
    toast.success(message, toastConfig.success);
  },

  deleteError: (message = 'Failed to delete') => {
    toast.error(message, toastConfig.error);
  },

  // Authentication operations
  loginSuccess: (message = 'Login successful!') => {
    toast.success(message, toastConfig.success);
  },

  loginError: (message = 'Login failed') => {
    toast.error(message, toastConfig.error);
  },

  registerSuccess: (message = 'Registration successful!') => {
    toast.success(message, toastConfig.success);
  },

  registerError: (message = 'Registration failed') => {
    toast.error(message, toastConfig.error);
  },

  logoutSuccess: (message = 'Logged out successfully') => {
    toast.success(message, toastConfig.success);
  },

  // Event operations
  eventCreateSuccess: (message = 'Event created successfully!') => {
    toast.success(message, toastConfig.success);
  },

  eventCreateError: (message = 'Failed to create event') => {
    toast.error(message, toastConfig.error);
  },

  eventUpdateSuccess: (message = 'Event updated successfully!') => {
    toast.success(message, toastConfig.success);
  },

  eventUpdateError: (message = 'Failed to update event') => {
    toast.error(message, toastConfig.error);
  },

  eventDeleteSuccess: (message = 'Event deleted successfully!') => {
    toast.success(message, toastConfig.success);
  },

  eventDeleteError: (message = 'Failed to delete event') => {
    toast.error(message, toastConfig.error);
  },

  // Booking operations
  bookingSuccess: (message = 'Booking successful!') => {
    toast.success(message, toastConfig.success);
  },

  bookingError: (message = 'Booking failed') => {
    toast.error(message, toastConfig.error);
  },

  bookingCancelSuccess: (message = 'Booking cancelled successfully!') => {
    toast.success(message, toastConfig.success);
  },

  bookingCancelError: (message = 'Failed to cancel booking') => {
    toast.error(message, toastConfig.error);
  },

  // Attendance operations
  attendanceSuccess: (message = 'Attendance marked successfully!') => {
    toast.success(message, toastConfig.success);
  },

  attendanceError: (message = 'Failed to mark attendance') => {
    toast.error(message, toastConfig.error);
  },

  // Payment operations
  paymentSuccess: (message = 'Payment successful!') => {
    toast.success(message, toastConfig.success);
  },

  paymentError: (message = 'Payment failed') => {
    toast.error(message, toastConfig.error);
  },

  // Certificate operations
  certificateSuccess: (message = 'Certificate generated successfully!') => {
    toast.success(message, toastConfig.success);
  },

  certificateError: (message = 'Failed to generate certificate') => {
    toast.error(message, toastConfig.error);
  },

  certificateDownloadSuccess: (message = 'Certificate downloaded successfully!') => {
    toast.success(message, toastConfig.success);
  },

  certificateDownloadError: (message = 'Failed to download certificate') => {
    toast.error(message, toastConfig.error);
  },

  // Face recognition operations
  faceRecognitionSuccess: (message = 'Face recognized successfully!') => {
    toast.success(message, toastConfig.success);
  },

  faceRecognitionError: (message = 'Face recognition failed') => {
    toast.error(message, toastConfig.error);
  },

  faceSetupSuccess: (message = 'Face setup completed successfully!') => {
    toast.success(message, toastConfig.success);
  },

  faceSetupError: (message = 'Face setup failed') => {
    toast.error(message, toastConfig.error);
  },

  // QR Code operations
  qrScanSuccess: (message = 'QR code scanned successfully!') => {
    toast.success(message, toastConfig.success);
  },

  qrScanError: (message = 'QR code scan failed') => {
    toast.error(message, toastConfig.error);
  },

  // RFID operations
  rfidSuccess: (message = 'RFID card verified successfully!') => {
    toast.success(message, toastConfig.success);
  },

  rfidError: (message = 'RFID verification failed') => {
    toast.error(message, toastConfig.error);
  },

  // Admin operations
  adminActionSuccess: (message = 'Admin action completed successfully!') => {
    toast.success(message, toastConfig.success);
  },

  adminActionError: (message = 'Admin action failed') => {
    toast.error(message, toastConfig.error);
  },

  // User management operations
  userUpdateSuccess: (message = 'User updated successfully!') => {
    toast.success(message, toastConfig.success);
  },

  userUpdateError: (message = 'Failed to update user') => {
    toast.error(message, toastConfig.error);
  },

  userDeleteSuccess: (message = 'User deleted successfully!') => {
    toast.success(message, toastConfig.success);
  },

  userDeleteError: (message = 'Failed to delete user') => {
    toast.error(message, toastConfig.error);
  },

  // Generic notifications
  success: (message) => {
    toast.success(message, toastConfig.success);
  },

  error: (message) => {
    toast.error(message, toastConfig.error);
  },

  warning: (message) => {
    toast(message, {
      ...toastConfig.warning,
      icon: '⚠️',
    });
  },

  info: (message) => {
    toast(message, {
      ...toastConfig.info,
      icon: 'ℹ️',
    });
  },

  // Loading states
  loading: (message = 'Loading...') => {
    return toast.loading(message, {
      style: {
        background: '#6B7280',
        color: '#ffffff',
        border: '1px solid #4B5563',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  },

  // Dismiss loading
  dismissLoading: (toastId) => {
    toast.dismiss(toastId);
  },

  // Promise-based toast
  promise: (promise, messages) => {
    return toast.promise(promise, messages, {
      style: {
        background: '#1F2937',
        color: '#ffffff',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  },
};

export default toastUtils;
