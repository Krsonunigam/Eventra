import { useCustomToast as useToast } from '../contexts/ToastContext';

// Custom toast utilities for CRUD operations
export const useCustomToast = () => {
  const toast = useToast();

  return {
    // Generic methods
    success: (message, options = {}) => toast.success(message, options),
    error: (message, options = {}) => toast.error(message, options),
    warning: (message, options = {}) => toast.warning(message, options),
    info: (message, options = {}) => toast.info(message, options),
    loading: (message, options = {}) => toast.loading(message, options),
    dismiss: (toastId) => toast.dismiss(toastId),
    promise: (promise, messages, options) => toast.promise(promise, messages, options),

    // CRUD Operations
    createSuccess: (item = 'Item', options = {}) => toast.success(`${item} created successfully!`, options),
    createError: (item = 'Item', options = {}) => toast.error(`Failed to create ${item}.`, options),
    fetchSuccess: (item = 'Data', options = {}) => toast.success(`${item} loaded successfully!`, options),
    fetchError: (item = 'Data', options = {}) => toast.error(`Failed to load ${item}.`, options),
    updateSuccess: (item = 'Item', options = {}) => toast.success(`${item} updated successfully!`, options),
    updateError: (item = 'Item', options = {}) => toast.error(`Failed to update ${item}.`, options),
    deleteSuccess: (item = 'Item', options = {}) => toast.success(`${item} deleted successfully!`, options),
    deleteError: (item = 'Item', options = {}) => toast.error(`Failed to delete ${item}.`, options),

    // Auth Operations
    loginSuccess: (options = {}) => toast.success('Login successful!', options),
    loginError: (options = {}) => toast.error('Login failed. Please check your credentials.', options),
    registerSuccess: (options = {}) => toast.success('Registration successful! Please verify your email.', options),
    registerError: (options = {}) => toast.error('Registration failed. Please try again.', options),
    logoutSuccess: (options = {}) => toast.success('Logged out successfully.', options),

    // Event Specific
    eventCreateSuccess: (options = {}) => toast.success('Event created successfully!', options),
    eventCreateError: (options = {}) => toast.error('Failed to create event.', options),
    eventUpdateSuccess: (options = {}) => toast.success('Event updated successfully!', options),
    eventUpdateError: (options = {}) => toast.error('Failed to update event.', options),
    eventDeleteSuccess: (options = {}) => toast.success('Event deleted successfully!', options),
    eventDeleteError: (options = {}) => toast.error('Failed to delete event.', options),
    eventPublishSuccess: (options = {}) => toast.success('Event published successfully!', options),
    eventPublishError: (options = {}) => toast.error('Failed to publish event.', options),
    eventCancelSuccess: (options = {}) => toast.success('Event cancelled successfully!', options),
    eventCancelError: (options = {}) => toast.error('Failed to cancel event.', options),

    // Booking Specific
    bookingCreateSuccess: (options = {}) => toast.success('Booking created successfully!', options),
    bookingCreateError: (options = {}) => toast.error('Failed to create booking.', options),
    bookingUpdateSuccess: (options = {}) => toast.success('Booking updated successfully!', options),
    bookingUpdateError: (options = {}) => toast.error('Failed to update booking.', options),
    bookingCancelSuccess: (options = {}) => toast.success('Booking cancelled successfully!', options),
    bookingCancelError: (options = {}) => toast.error('Failed to cancel booking.', options),
    paymentSuccess: (options = {}) => toast.success('Payment successful!', options),
    paymentError: (options = {}) => toast.error('Payment failed. Please try again.', options),
    paymentProcessing: (options = {}) => toast.loading('Processing payment...', options),

    // User Specific
    userUpdateSuccess: (options = {}) => toast.success('User profile updated successfully!', options),
    userUpdateError: (options = {}) => toast.error('Failed to update user profile.', options),
    userDeleteSuccess: (options = {}) => toast.success('User deleted successfully!', options),
    userDeleteError: (options = {}) => toast.error('Failed to delete user.', options),
    userVerifySuccess: (options = {}) => toast.success('User verified successfully!', options),
    userVerifyError: (options = {}) => toast.error('Failed to verify user.', options),

    // Attendance Specific
    attendanceMarkedSuccess: (options = {}) => toast.success('Attendance marked successfully!', options),
    attendanceMarkedError: (options = {}) => toast.error('Failed to mark attendance.', options),

    // Face Recognition Specific
    faceRecognitionSuccess: (options = {}) => toast.success('Face recognition successful!', options),
    faceRecognitionError: (options = {}) => toast.error('Face recognition failed.', options),
    faceRegistrationSuccess: (options = {}) => toast.success('Face registration successful!', options),
    faceRegistrationError: (options = {}) => toast.error('Face registration failed.', options),
  };
};

export default useCustomToast;