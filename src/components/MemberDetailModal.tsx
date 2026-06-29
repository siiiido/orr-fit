import React from 'react';
import { X, Calendar, Activity, Zap, Layers, Trophy } from 'lucide-react';
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

  const formatPace = (distance: number, durationSeconds: number) => {
    if (distance <= 0) return `00'00"`;
    const totalSecondsPerKm = Math.round(durationSeconds / distance);
    const mins = Math.floor(totalSecondsPerKm / 60);
    const secs = totalSecondsPerKm % 60;
    return `${mins}'${secs.toString().padStart(2, '0')}"`;
  };

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

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              운동 종류별 통계
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 1. 야외러닝 */}
              <div className="bg-brand-darkBg border border-gray-950 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-brand-orange" />
                    야외러닝
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold">
                    {stats.outdoor.count}회 인증
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-400 font-bold">
                    <span>거리</span>
                    <span className="text-white">{stats.outdoor.distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-bold">
                    <span>시간</span>
                    <span className="text-white">
                      {Math.floor(stats.outdoor.duration / 60)}분
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-bold">
                    <span>페이스</span>
                    <span className="text-brand-orange font-black font-mono">
                      {formatPace(stats.outdoor.distance, stats.outdoor.duration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. 트레드밀 */}
              <div className="bg-brand-darkBg border border-gray-950 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-brand-orange" />
                    트레드밀
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold">
                    {stats.treadmill.count}회 인증
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-400 font-bold">
                    <span>거리</span>
                    <span className="text-white">{stats.treadmill.distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-bold">
                    <span>시간</span>
                    <span className="text-white">
                      {Math.floor(stats.treadmill.duration / 60)}분
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-bold">
                    <span>페이스</span>
                    <span className="text-brand-orange font-black font-mono">
                      {formatPace(stats.treadmill.distance, stats.treadmill.duration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. 천국의계단 */}
              <div className="bg-brand-darkBg border border-gray-950 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-brand-orange" />
                    천국의계단
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold">
                    {stats.stairmaster.count}회 인증
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-400 font-bold">
                    <span>시간</span>
                    <span className="text-white">
                      {Math.floor(stats.stairmaster.duration / 60)}분
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-bold">
                    <span>환산 거리</span>
                    <span className="text-brand-orange font-black">
                      {(stats.stairmaster.duration / 60 / 10).toFixed(1)} km
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. 싸이클 */}
              <div className="bg-brand-darkBg border border-gray-950 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-brand-orange" />
                    싸이클
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold">
                    {stats.cycling.count}회 인증
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-400 font-bold">
                    <span>시간</span>
                    <span className="text-white">
                      {Math.floor(stats.cycling.duration / 60)}분
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-bold">
                    <span>환산 거리</span>
                    <span className="text-brand-orange font-black">
                      {(stats.cycling.duration / 60 / 10).toFixed(1)} km
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
