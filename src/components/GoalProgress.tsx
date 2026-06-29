import React from 'react';
import { Trophy, Target, Sparkles } from 'lucide-react';

interface GoalProgressProps {
  currentDistance: number;
  targetDistance: number;
  weeklyChallengeCompleteCount: number;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({
  currentDistance,
  targetDistance,
  weeklyChallengeCompleteCount,
}) => {
  const percentage = Math.min(100, Math.round((currentDistance / targetDistance) * 100));
  
  // Circular SVG configurations
  const radius = 60;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col gap-6">
      {/* Monthly Goal Card */}
      <div className="bg-brand-darkSurface border border-brand-orange/10 p-6 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
        
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-brand-orange" />
          월간 센터 공동 목표
        </h3>

        <div className="flex items-center justify-around my-4">
          {/* Circular Progress SVG */}
          <div className="relative flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-gray-800"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-brand-orange transition-all duration-1000 ease-out"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="block text-2xl font-black text-white">{percentage}%</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase">달성도</span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-gray-400">
            <span>현재 누적</span>
            <span>목표 거리</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xl font-black text-brand-orange">{currentDistance.toFixed(1)} km</span>
            <span className="text-sm font-bold text-white">{targetDistance} km</span>
          </div>
        </div>
      </div>

      {/* Weekly Challenge Card */}
      <div className="bg-brand-darkSurface border border-gray-800 p-6 rounded-2xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-gold" />
          주간 미니 챌린지
        </h3>
        <div className="border border-brand-gold/10 bg-brand-gold/5 p-4 rounded-xl mb-4">
          <span className="text-xs font-bold text-brand-gold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            이번 주 미션: 주간 10km 이상 완주하기!
          </span>
        </div>

        <div className="flex justify-between items-center bg-brand-darkBg/60 p-4 rounded-xl border border-gray-900">
          <div className="text-xs text-gray-400 font-semibold">
            <span className="block text-white text-base font-black">{weeklyChallengeCompleteCount} 명</span>
            챌린지 달성 완료
          </div>
          <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20">
            <Trophy className="w-6 h-6 text-brand-gold animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
};
