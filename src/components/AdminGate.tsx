import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

interface AdminGateProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminGate: React.FC<AdminGateProps> = ({ onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Super simple passcode for staff convenience
    if (pin === '0000') {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-darkSurface border border-gray-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-orange/15 border border-brand-orange/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-brand-orange" />
          </div>
          
          <h3 className="text-lg font-black text-white mb-1">직원 전용 모드</h3>
          <p className="text-xs text-gray-400 font-semibold mb-6">패스코드를 입력하세요.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={4}
                placeholder="PIN 번호 (4자리)"
                value={pin}
                onChange={(e) => {
                  setError(false);
                  setPin(e.target.value.replace(/\D/g, ''));
                }}
                className={`w-full bg-brand-darkBg text-center text-xl tracking-widest font-black border rounded-xl py-3 text-white focus:outline-none ${
                  error ? 'border-red-500' : 'border-gray-800 focus:border-brand-orange'
                }`}
                autoFocus
              />
              {error && (
                <span className="text-[10px] text-red-500 font-bold block mt-2">
                  올바르지 않은 패스코드입니다. (기본: 0000)
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-sm py-3 rounded-xl transition-all duration-300 shadow-orangeGlow"
            >
              인증 완료
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
