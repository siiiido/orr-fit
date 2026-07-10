import React from 'react';
import { X, PartyPopper } from 'lucide-react';
import type { Member, Run, MonthlyChallenge } from '../types';

interface HallOfFameModalProps {
  members: Member[];
  runs: Run[];
  monthlyChallenge: MonthlyChallenge | null;
  onClose: () => void;
}

export const HallOfFameModal: React.FC<HallOfFameModalProps> = ({
  members,
  runs,
  monthlyChallenge,
  onClose,
}) => {
  // Calculate previous month's string
  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthLabel = `${prevMonthDate.getFullYear()}년 ${prevMonthDate.getMonth() + 1}월`;

  // Filter runs for the previous month
  const prevMonthRuns = runs.filter((r) => r.run_date.startsWith(prevMonthStr));
  
  // Calculate distances per member
  const memberDistances: Record<string, number> = {};
  prevMonthRuns.forEach((r) => {
    memberDistances[r.member_id] = (memberDistances[r.member_id] || 0) + r.distance;
  });

  // Determine minimum tier for reward
  const sortedTiers = monthlyChallenge && monthlyChallenge.tiers.length > 0 
    ? [...monthlyChallenge.tiers].sort((a, b) => a.km - b.km) 
    : [];
  const minTierKm = sortedTiers.length > 0 ? sortedTiers[0].km : Infinity;

  // Filter and sort winners
  const winners = members
    .map((m) => ({
      member: m,
      distance: memberDistances[m.id] || 0,
    }))
    .filter((w) => w.distance >= minTierKm)
    .sort((a, b) => b.distance - a.distance);

  const getMedalIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '🏅';
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-brand-darkSurface border border-brand-orange/30 w-full max-w-md rounded-2xl shadow-[0_0_40px_rgba(255,107,0,0.15)] relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-32 bg-gradient-to-b from-brand-orange/20 to-transparent blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 relative z-10">
          <div className="text-center mb-8 mt-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-orange/10 mb-4 border border-brand-orange/20 shadow-[0_0_15px_rgba(255,107,0,0.2)]">
              <PartyPopper className="w-8 h-8 text-brand-orange" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">축하합니다!</h2>
            <p className="text-brand-orange font-bold">
              {prevMonthLabel} 헬스권 달성자
            </p>
            {sortedTiers.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                목표 거리: {minTierKm}km 이상 달성
              </p>
            )}
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {winners.length > 0 ? (
              winners.map((winner, index) => (
                <div 
                  key={winner.member.id} 
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    index < 3 
                      ? 'bg-gradient-to-r from-brand-orange/10 to-brand-darkBg border-brand-orange/30' 
                      : 'bg-brand-darkBg/50 border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl w-8 text-center drop-shadow-md">
                      {getMedalIcon(index)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg flex items-center gap-2">
                        {winner.member.nickname || winner.member.name}
                        {index === 0 && <span className="text-[10px] bg-brand-orange text-white px-2 py-0.5 rounded-full font-black tracking-wider uppercase">Top</span>}
                      </div>
                      <div className="text-xs text-gray-400 font-semibold mt-0.5">
                        {winner.member.name} ({winner.member.gender})
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-brand-orange">
                      {winner.distance.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">km</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-brand-darkBg/30 rounded-xl border border-gray-800 border-dashed">
                <PartyPopper className="w-10 h-10 text-gray-600 mx-auto mb-3 opacity-50" />
                <p className="text-gray-400 font-bold mb-1">저번달에는 달성자가 없었어요.</p>
                <p className="text-gray-500 text-sm">이번 달엔 꼭 목표를 달성해 보세요!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
