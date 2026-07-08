import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ isOpen, title, message, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
              </div>
              <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-neutral-600 dark:text-neutral-300 mb-6">{message}</p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors"
            >
              확인
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
