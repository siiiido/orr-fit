import React from 'react';
import { Flame, Lock, Unlock } from 'lucide-react';

interface HeaderProps {
  totalDistance: number;
  activeCount: number;
  isAdmin: boolean;
  onAdminToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalDistance,
  activeCount,
  isAdmin,
  onAdminToggle,
}) => {
  return (
    <header className="border-b border-brand-orange/10 bg-brand-darkSurface/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 md:px-8 flex justify-between items-center transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className="bg-brand-orange/20 p-2 rounded-xl border border-brand-orange/30 animate-pulse">
          <Flame className="w-6 h-6 text-brand-orange" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            ORR FIT <span className="text-brand-orange">RUNNING</span>
          </h1>
          <p className="text-xs text-gray-400 font-semibold hidden md:block">
            젬스톤피트니스 서면점 유산소 챌린지
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-gray-400 bg-brand-darkBg/60 px-4 py-2 rounded-xl border border-gray-800">
          <div className="text-center">
            <span className="block text-white font-black text-sm">{totalDistance.toFixed(1)} km</span>
            <span>총 누적 거리</span>
          </div>
          <div className="h-6 w-px bg-gray-800"></div>
          <div className="text-center">
            <span className="block text-white font-black text-sm">{activeCount} 명</span>
            <span>참여 회원</span>
          </div>
        </div>

        <button
          onClick={onAdminToggle}
          className={`flex items-center gap-2 px-3 py-2 md:px-4 rounded-xl text-xs md:text-sm font-bold border transition-all duration-300 ${
            isAdmin
              ? 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'
              : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20 hover:bg-brand-orange/20 shadow-orangeGlow/20 shadow-sm'
          }`}
        >
          {isAdmin ? (
            <>
              <Unlock className="w-4 h-4" />
              <span className="hidden sm:inline">관리자 로그아웃</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">관리자 모드</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
