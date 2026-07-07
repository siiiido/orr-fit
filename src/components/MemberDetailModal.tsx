import React from 'react';
import { X, Calendar } from 'lucide-react';
import type { Member, Run, MonthlyChallenge } from '../types';

interface MemberDetailModalProps {
  member: Member;
  runs: Run[];
  onClose: () => void;
  monthlyChallenge: MonthlyChallenge | null;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  runs,
  onClose,
  monthlyChallenge,
}) => {
  const memberRuns = runs.filter((r) => r.member_id === member.id);

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const currentMonthRuns = memberRuns.filter(r => r.run_date.startsWith(currentMonthStr));
  const currentMonthDistance = currentMonthRuns.reduce((sum, r) => sum + r.distance, 0);
  const totalDistance = memberRuns.reduce((sum, r) => sum + r.distance, 0);

  // Find next target
  let nextTargetKm = 0;
  let isMaxTierReached = false;
  
  if (monthlyChallenge && monthlyChallenge.tiers.length > 0) {
    const sortedTiers = [...monthlyChallenge.tiers].sort((a, b) => a.km - b.km);
    const nextTier = sortedTiers.find(t => t.km > currentMonthDistance);
    if (nextTier) {
      nextTargetKm = nextTier.km;
    } else {
      isMaxTierReached = true;
      nextTargetKm = sortedTiers[sortedTiers.length - 1].km;
    }
  }

  const distanceRemaining = isMaxTierReached ? 0 : Math.max(0, nextTargetKm - currentMonthDistance);
  const progressPercent = nextTargetKm > 0 ? Math.min(100, (currentMonthDistance / nextTargetKm) * 100) : 0;
  
  // Animation state
  const [animatedProgress, setAnimatedProgress] = React.useState(0);
  React.useEffect(() => {
    // Small delay to ensure the DOM is ready and the transition triggers
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercent);
    }, 100);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  // Get last certification date
  const lastRunDate = memberRuns.length > 0
    ? memberRuns.reduce((latest, r) => r.run_date > latest ? r.run_date : latest, memberRuns[0].run_date)
    : '기록 없음';

  // Group runs by type
  const stats = {
    outdoor: { distance: 0, duration: 0, count: 0 },
    treadmill: { distance: 0, duration: 0, count: 0 },
    stairmaster: { duration: 0, count: 0 },
    cycling: { duration: 0, count: 0 },
    orr_run: { distance: 0, duration: 0, count: 0 },
  };

  memberRuns.forEach((r) => {
    if (r.type === 'outdoor') {
      stats.outdoor.distance += r.distance;
      stats.outdoor.duration += r.duration;
      stats.outdoor.count += 1;
    } else if (r.type === 'treadmill') {
      stats.treadmill.distance += r.distance;
      stats.treadmill.duration += r.duration;
      stats.treadmill.count += 1;
    } else if (r.type === 'stairmaster') {
      stats.stairmaster.duration += r.duration;
      stats.stairmaster.count += 1;
    } else if (r.type === 'cycling') {
      stats.cycling.duration += r.duration;
      stats.cycling.count += 1;
    } else if (r.type === 'orr_run') {
      stats.orr_run.distance += r.distance;
      stats.orr_run.duration += r.duration;
      stats.orr_run.count += 1;
    }
  });

  // Calculate highest challenge tier achieved this month
  const getChallengeTierMedal = () => {
    if (!monthlyChallenge) return '';
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthDistance = memberRuns
      .filter((r) => r.run_date.startsWith(yearMonth))
      .reduce((sum, r) => sum + r.distance, 0);

    const sortedTiers = [...monthlyChallenge.tiers].sort((a, b) => a.km - b.km);
    const tierMedals = ['🥉', '🥈', '🥇'];
    let highestMedal = '';
    sortedTiers.forEach((tier, index) => {
      if (thisMonthDistance >= tier.km) {
        highestMedal = tierMedals[Math.min(index, tierMedals.length - 1)];
      }
    });
    return highestMedal;
  };

  const highestMedal = getChallengeTierMedal();

  // Calculate next challenge tier status
  const getNextTierStatus = () => {
    if (!monthlyChallenge || monthlyChallenge.tiers.length === 0) return null;
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthDistance = memberRuns
      .filter((r) => r.run_date.startsWith(yearMonth))
      .reduce((sum, r) => sum + r.distance, 0);

    const sortedTiers = [...monthlyChallenge.tiers].sort((a, b) => a.km - b.km);
    const nextTier = sortedTiers.find((t) => t.km > thisMonthDistance);

    const tierMedals = ['🥉', '🥈', '🥇'];
    const getTierMedal = (tierKm: number) => {
      const idx = sortedTiers.findIndex((t) => t.km === tierKm);
      return tierMedals[Math.min(idx, tierMedals.length - 1)] ?? '🏅';
    };

    if (!nextTier) {
      return {
        completed: true,
        text: '🎉 이번 달 모든 챌린지 달성 완료!',
      };
    }

    const remaining = nextTier.km - thisMonthDistance;
    const medal = getTierMedal(nextTier.km);
    return {
      completed: false,
      text: `${medal} ${nextTier.km}km 달성까지 ${remaining.toFixed(1)}km 남음`,
    };
  };

  const nextTierInfo = getNextTierStatus();


  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto flex items-start md:items-center justify-center p-4 py-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-brand-darkSurface border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl relative my-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="mb-6">
            {member.nickname ? (
              <>
                <h3 className="text-xl font-black text-brand-orange leading-tight flex items-center gap-1.5">
                  {member.nickname} {highestMedal}
                </h3>
                <span className="text-xs text-gray-400 font-bold block mt-1">
                  본명: {member.name} ({member.gender})
                </span>
              </>
            ) : (
              <h3 className="text-xl font-black text-white leading-tight flex items-center gap-1.5">
                {member.name} ({member.gender}) {highestMedal}
              </h3>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold bg-brand-darkBg/60 border border-gray-900 px-3 py-2 rounded-xl">
                <Calendar className="w-4 h-4 text-brand-orange" />
                <span>최근 인증일: {lastRunDate}</span>
              </div>
              
              {nextTierInfo && (
                <div className={`text-xs font-bold px-3 py-2 rounded-xl border ${
                  nextTierInfo.completed 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange'
                }`}>
                  {nextTierInfo.text}
                </div>
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-brand-darkBg/50 p-4 rounded-xl border border-gray-800">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-gray-400 text-xs">이번 달 누적</p>
                <p className="text-xl font-bold text-white">{currentMonthDistance.toFixed(1)} km</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">총 누적</p>
                <p className="text-md font-bold text-gray-300">{totalDistance.toFixed(1)} km</p>
              </div>
            </div>

            {nextTargetKm > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-brand-orange font-semibold">
                    {isMaxTierReached ? '최고 목표 달성!' : `다음 챌린지까지 ${distanceRemaining.toFixed(1)}km 남음`}
                  </span>
                  <span className="text-gray-500">{nextTargetKm}km</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-brand-orange to-orange-400 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${animatedProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 mb-6">
            <div className="bg-brand-darkBg p-3 rounded-xl border border-gray-800 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1">야외 러닝</span>
              <span className="text-lg font-bold text-white">{stats.outdoor.distance.toFixed(1)} km</span>
              <span className="text-[10px] text-gray-500">{stats.outdoor.count}회</span>
            </div>
            
            <div className="bg-gradient-to-br from-brand-orange/20 to-orange-600/10 p-3 rounded-xl border border-brand-orange/30 flex flex-col items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="text-xs text-brand-orange font-bold mb-1">ORR RUN 🔥</span>
              <span className="text-lg font-bold text-white">{stats.orr_run.distance.toFixed(1)} km</span>
              <span className="text-[10px] text-gray-400">{stats.orr_run.count}회</span>
            </div>

            <div className="bg-brand-darkBg p-3 rounded-xl border border-gray-800 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1">트레드밀</span>
              <span className="text-lg font-bold text-white">{stats.treadmill.distance.toFixed(1)} km</span>
              <span className="text-[10px] text-gray-500">{stats.treadmill.count}회</span>
            </div>

            <div className="bg-brand-darkBg p-3 rounded-xl border border-gray-800 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1">기타 (머신/사이클)</span>
              <span className="text-lg font-bold text-white">
                {Math.floor((stats.stairmaster.duration + stats.cycling.duration) / 60)} 분
              </span>
              <span className="text-[10px] text-gray-500">
                {stats.stairmaster.count + stats.cycling.count}회
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
