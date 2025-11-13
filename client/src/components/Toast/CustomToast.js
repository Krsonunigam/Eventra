import React from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const CustomToast = ({ t, message, type, title, style }) => {
  const getColors = () => {
    switch (type) {
      case 'success': return { bg: 'bg-green-500', border: 'border-green-600', iconBg: 'bg-green-600' };
      case 'error': return { bg: 'bg-red-500', border: 'border-red-600', iconBg: 'bg-red-600' };
      case 'warning': return { bg: 'bg-yellow-500', border: 'border-yellow-600', iconBg: 'bg-yellow-600' };
      case 'info': return { bg: 'bg-blue-500', border: 'border-blue-600', iconBg: 'bg-blue-600' };
      case 'loading': return { bg: 'bg-gray-600', border: 'border-gray-700', iconBg: 'bg-gray-700' };
      default: return { bg: 'bg-gray-700', border: 'border-gray-800', iconBg: 'bg-gray-800' };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'loading': return '⏳';
      default: return '💬';
    }
  };

  const { bg, border } = getColors();

  return (
    <AnimatePresence>
      {t.visible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.5 }}
          className={`${bg} ${border} border-l-4 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 max-w-md w-full`}
          style={style}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <span className="text-2xl">{getIcon()}</span>
              </div>
              <div className="ml-3 flex-1">
                {title && <p className="text-sm font-medium text-white">{title}</p>}
                <p className={`mt-1 text-sm ${title ? 'text-gray-200' : 'text-white'}`}>{message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-600">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomToast;