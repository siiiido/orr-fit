import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm overflow-hidden bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-full dark:bg-red-900/30 dark:text-red-400">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-neutral-500 hover:text-neutral-900 transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-neutral-600 dark:text-neutral-300 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 font-semibold rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
};
