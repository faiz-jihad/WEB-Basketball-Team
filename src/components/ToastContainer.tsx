import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import useAppStore from '../lib/store';

export const ToastContainer: React.FC = () => {
  // Only subscribe to the toasts part of the store!
  const toasts = useAppStore(state => state.toasts);
  const removeToast = useAppStore(state => state.removeToast);
  const language = useAppStore(state => state.language);
  const isRtl = language === 'ar';

  return (
    <div className={`fixed top-24 z-[3000] left-4 right-4 md:w-full md:max-w-sm space-y-3 pointer-events-none ${isRtl ? 'md:right-auto md:left-6' : 'md:left-auto md:right-6'}`}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: isRtl ? -50 : 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: isRtl ? -50 : 50, scale: 0.9 }}
            className={`p-4 rounded-2xl shadow-xl flex items-start gap-3 border pointer-events-auto backdrop-blur-md ${isRtl ? 'flex-row-reverse text-right' : 'text-left'} ${
              toast.type === 'success'
                ? 'bg-green-950/80 border-green-700/30 text-green-100 shadow-green-950/20'
                : toast.type === 'xp'
                ? 'bg-brand-orange/90 border-brand-burnt/35 text-brand-black shadow-brand-orange/15 font-black'
                : toast.type === 'warning'
                ? 'bg-red-950/80 border-red-700/30 text-red-100'
                : 'bg-bg-card/90 border-brand-orange/20 text-white glow-orange'
            }`}
          >
            <div className="flex-1">
              <h5 className="text-xs font-bold font-title uppercase tracking-wide">{toast.title}</h5>
              <p className="text-[10px] opacity-80 mt-1 font-display font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
