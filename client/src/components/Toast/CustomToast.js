import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const CustomToast = ({ t, message, type, title, style }) => {
  const getColors = () => {
    const brandColor = '#F17A31'; // Brand color from logo
    switch (type) {
      case 'success': return { border: 'border-orange-600', customBg: brandColor };
      case 'error': return { border: 'border-red-600', customBg: '#ef4444' };
      case 'warning': return { border: 'border-amber-600', customBg: '#f59e0b' };
      case 'info': return { border: 'border-blue-600', customBg: '#3b82f6' };
      case 'loading': return { border: 'border-gray-700', customBg: '#1f2937' };
      default: return { border: 'border-gray-800', customBg: '#111827' };
    }
  };

  const getIcon = () => {
    const iconClass = "h-6 w-6 text-white";
    switch (type) {
      case 'success': return <CheckCircle className={iconClass} />;
      case 'error': return <AlertCircle className={iconClass} />;
      case 'warning': return <AlertTriangle className={iconClass} />;
      case 'info': return <Info className={iconClass} />;
      case 'loading': return <Loader2 className={`${iconClass} animate-spin`} />;
      default: return <Info className={iconClass} />;
    }
  };

  const { bg, border, customBg } = getColors();

  return (
    <AnimatePresence>
      {t.visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: 'easeOut' } }}
          transition={{ 
            type: 'spring', 
            damping: 22, 
            stiffness: 260,
            mass: 1
          }}
          className={`${border} border-l-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl pointer-events-auto flex ring-1 ring-white/10 max-w-md w-full backdrop-blur-2xl transition-shadow duration-300`}
          style={{ 
            backgroundColor: customBg ? `${customBg}ee` : undefined,
            boxShadow: customBg ? `0 20px 40px -15px ${customBg}44` : undefined,
            ...style 
          }}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2.5 bg-black/10 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                {getIcon()}
              </div>
              <div className="ml-4 flex-1">
                {title && (
                  <p className="text-sm font-bold text-white mb-0.5 tracking-wide uppercase opacity-90">
                    {title}
                  </p>
                )}
                <p className="text-sm font-medium text-white/95 leading-relaxed">
                  {message}
                </p>
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
          {/* Progress Bar */}
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 3, ease: 'linear' }}
            className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-b-2xl"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomToast;