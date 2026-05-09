import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Shield, Info, AlertCircle } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "warning" // warning, danger, info
}) => {
  if (!isOpen) return null;

  const getTheme = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertCircle className="h-6 w-6 text-red-400" />,
          accent: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          btnConfirm: 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
        };
      case 'info':
        return {
          icon: <Info className="h-6 w-6 text-blue-400" />,
          accent: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          btnConfirm: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
        };
      default: // warning
        return {
          icon: <AlertTriangle className="h-6 w-6 text-amber-400" />,
          accent: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          btnConfirm: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
        };
    }
  };

  const theme = getTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-[#111111] rounded-3xl shadow-2xl max-w-md w-full border border-white/10 overflow-hidden"
          >
            {/* Header / Accent Bar */}
            <div className={`h-1.5 w-full ${theme.bg.replace('10', '40')}`} />
            
            <div className="p-8">
              {/* Icon & Title */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className={`p-4 rounded-2xl ${theme.bg} mb-4 border ${theme.border}`}>
                  {theme.icon}
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">{title}</h3>
              </div>
              
              {/* Message */}
              <div className="mb-8 text-center">
                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                  {message}
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border border-white/5"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-6 py-3.5 ${theme.btnConfirm} text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95`}
                >
                  {confirmText}
                </button>
              </div>
            </div>

            {/* Close Button Top Right */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
