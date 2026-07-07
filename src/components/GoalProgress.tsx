import React, { useEffect, useState } from 'react';
import { Trophy, Target } from 'lucide-react';
import type { Member, Run, MonthlyChallenge, ChallengeTier } from '../types';

interface GoalProgressProps {
  currentDistance: number;
  targetDistance: number;
  monthlyChallenge: MonthlyChallenge | null;
  members: Member[];
  runs: Run[];
}

interface Achiever {
  name: string;
  totalKm: number;
  tier: ChallengeTier;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({
  currentDistance,
  targetDistance,
  monthlyChallenge,
  members,
  runs,
}) => {
  const percentage = targetDistance > 0 ? Math.min(100, Math.round((currentDistance / targetDistance) * 100)) : 0;

  // Circular SVG configurations
  const radius = 60;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  // Animated progress state
  const [animatedPct, setAnimatedPct] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const start = setTimeout(() => {
      setAnimatedPct(percentage);
    }, 300);

    let frame: number;
    let startTime: number;
    const duration = 1400;
    const countUp = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPct(Math.round(eased * percentage));
      if (progress < 1) frame = requestAnimationFrame(countUp);
    };
    const countStart = setTimeout(() => {
      frame = requestAnimationFrame(countUp);
    }, 300);

    return () => {
      clearTimeout(start);
      clearTimeout(countStart);
      cancelAnimationFrame(frame);
    };
  }, [percentage]);

  const strokeDashoffset = circumference - (animatedPct / 100) * circumference;

  // Month label: "2026.06"
  const now = new Date();
  const monthLabel = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Days remaining in current month
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = lastDay - now.getDate();

  // Compute this month's achievers
  const getAchievers = (): Achiever[] => {
    if (!monthlyChallenge || monthlyChallenge.tiers.length === 0) return [];

    const sortedTiers = [...monthlyChallenge.tiers].sort((a, b) => a.km - b.km);
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Sum distance per member for current month
    const memberKm: Record<string, number> = {};
    runs.forEach((r) => {
      if (r.run_date.startsWith(yearMonth)) {
        memberKm[r.member_id] = (memberKm[r.member_id] || 0) + r.distance;
      }
    });

    const achievers: Achiever[] = [];
    Object.entries(memberKm).forEach(([memberId, totalKm]) => {
      // Find highest tier achieved
      let highestTier: ChallengeTier | null = null;
      for (const tier of sortedTiers) {
        if (totalKm >= tier.km) highestTier = tier;
      }
      if (highestTier) {
        const member = members.find((m) => m.id === memberId);
        if (member) {
          achievers.push({ name: member.name, totalKm, tier: highestTier });
        }
      }
    });

    return achievers.sort((a, b) => b.totalKm - a.totalKm);
  };

  const achievers = getAchievers();
  const sortedTiers = monthlyChallenge
    ? [...monthlyChallenge.tiers].sort((a, b) => a.km - b.km)
    : [];

  const tierMedals = ['🥉', '🥈', '🥇'];
  const getMedal = (tier: ChallengeTier): string => {
    const idx = sortedTiers.findIndex((t) => t.km === tier.km);
    return tierMedals[Math.min(idx, tierMedals.length - 1)] ?? '🏅';
  };

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
                className="stroke-brand-orange"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 4s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
            </svg>
            <div className="absolute text-center">
              <span className="block text-2xl font-black text-white">{displayPct}%</span>
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

      {/* Monthly Challenge Card */}
      <div className="bg-brand-darkSurface border border-gray-800 p-6 rounded-2xl">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-orange" />
            {monthLabel} 월간 챌린지
          </h3>
          <span className="text-xs font-black text-brand-orange bg-brand-orange/10 border border-brand-orange/20 px-2.5 py-1 rounded-lg">
            D-{daysRemaining}
          </span>
        </div>

        {/* Tier Rewards */}
        {monthlyChallenge === null ? (
          <p className="text-xs text-gray-500 text-center py-4">챌린지 설정을 불러오는 중...</p>
        ) : sortedTiers.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">설정된 챌린지 단계가 없습니다.</p>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {sortedTiers.map((tier, i) => (
                <div
                  key={tier.km}
                  className="flex justify-between items-center bg-brand-darkBg/60 border border-gray-900 rounded-xl px-3 py-2"
                >
                  <span className="text-xs font-bold text-gray-300">
                    {tierMedals[Math.min(i, tierMedals.length - 1)]} {tier.km} km 달성
                  </span>
                  <span className="text-xs font-black text-brand-orange">
                    헬스권 {tier.reward_days}일
                  </span>
                </div>
              ))}
            </div>

            {/* Achievers List */}
            {achievers.length > 0 && (
              <div className="border-t border-gray-800 pt-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  이번 달 달성 회원
                </p>
                <div className="space-y-2">
                  {achievers.map((a) => (
                    <div
                      key={a.name}
                      className="flex justify-between items-center text-xs"
                    >
                      <span className="font-black text-white">
                        {getMedal(a.tier)} {a.name}
                      </span>
                      <span className="text-gray-400 font-semibold">
                        {a.totalKm.toFixed(1)}km —{' '}
                        <span className="text-brand-orange font-black">{a.tier.reward_days}일 획득</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
