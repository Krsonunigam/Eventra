import React, { createContext, useContext } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import CustomToast from '../components/Toast/CustomToast';

const ToastContext = createContext();

export const useCustomToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useCustomToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const showToast = (message, type = 'info', options = {}) => {
    toast.custom((t) => (
      <CustomToast t={t} message={message} type={type} title={options.title} style={options.style} />
    ), {
      duration: options.duration || 4000,
      position: options.position || 'top-center',
      ...options,
    });
  };

  const value = {
    success: (message, options) => showToast(message, 'success', options),
    error: (message, options) => showToast(message, 'error', options),
    warning: (message, options) => showToast(message, 'warning', options),
    info: (message, options) => showToast(message, 'info', options),
    loading: (message, options) => toast.custom((t) => (
      <CustomToast t={t} message={message} type="loading" title={options?.title} style={options?.style} />
    ), {
      duration: Infinity,
      position: 'top-center',
      ...options,
    }),
    dismiss: (toastId) => toast.dismiss(toastId),
    promise: (promise, messages, options) => toast.promise(promise, {
      loading: messages.loading,
      success: (data) => {
        showToast(messages.success(data), 'success', options);
        return messages.success(data);
      },
      error: (err) => {
        showToast(messages.error(err), 'error', options);
        throw err;
      },
    }, {
      position: 'top-center',
      ...options,
    }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-center"
        containerStyle={{
          top: 20,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'transparent',
            color: 'transparent',
            boxShadow: 'none',
            padding: 0,
          },
        }}
      />
    </ToastContext.Provider>
  );
};