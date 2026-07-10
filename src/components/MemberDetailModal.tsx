import React from 'react';
import { X, Calendar, Footprints, Flame, Activity, Dumbbell, Bike } from 'lucide-react';
import type { Member, Run, MonthlyChallenge } from '../types';

interface MemberDetailModalProps {
  member: Member;
  runs: Run[];
  onClose: () => void;
  monthlyChallenge: MonthlyChallenge | null;
  rank: number;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  runs,
  onClose,
  monthlyChallenge,
  rank,
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
  
  // Tab state
  const [activeTab, setActiveTab] = React.useState<'summary' | 'history'>('summary');

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

  // Calculate workout preferences outside of useMemo
  let preferredWorkout = '';
  let maxCount = 0;
  Object.entries(stats).forEach(([key, stat]) => {
    // NOTE: stats['stairmaster'] doesn't have 'distance', but has 'duration' and 'count'. We use count.
    if (stat.count > maxCount) {
      maxCount = stat.count;
      preferredWorkout = key;
    }
  });

  // Generate personalized motivational message
  const motivationalMessage = React.useMemo(() => {
    const candidates: string[] = [];

    // A. Milestones
    if (totalDistance >= 500) candidates.push("총 누적 500km 돌파! 부산에서 서울까지 완주한 당신, 멋짐 그 자체입니다 🚀");
    else if (totalDistance >= 100) candidates.push("와! 총 누적 거리 100km 돌파! 부산에서 경주까지 달려가신 셈이네요 🗺️ 멋짐 최고!");

    // B. Workout Preferences
    if (maxCount > 0) {
      if (preferredWorkout === 'outdoor') candidates.push("야외 러닝을 가장 좋아하시네요! 오늘도 부산의 시원한 바람맞으며 달려볼까요? 🍃");
      else if (preferredWorkout === 'stairmaster') candidates.push("천국의 계단 마스터! 멋짐에서 독보적인 하체 근력을 뽐내고 계시네요 💪");
      else if (preferredWorkout === 'cycling') candidates.push("실내 사이클 매니아! 묵묵히 페달을 밟는 당신의 열정, 정말 멋짐! 🚴♂️");
      else if (preferredWorkout === 'treadmill') candidates.push("트레드밀의 제왕! 멋짐 안에서 비가 오나 눈이 오나 꾸준히 달리는 모습 최고예요 🏃♂️");
      else if (preferredWorkout === 'orr_run') candidates.push("ORR RUN 단골손님! 함께 달리는 즐거움을 아는 당신이 진짜 일류입니다 🎉");
    }

    // C. Ranking
    if (rank === 1) candidates.push("현재 부동의 1위! 멋짐의 레이스킹 자리를 굳건히 지켜주세요 👑");
    else if (rank === 2 || rank === 3) candidates.push(`현재 ${rank}위! 1위 탈환이 코앞입니다. 멋짐에서 조금만 더 속도를 내볼까요? ⚡`);
    else if (rank === 4 || rank === 5) candidates.push(`현재 ${rank}위! 순위권(TOP 3) 진입을 위해 멋짐에서 조금만 더 파이팅! 🚀`);
    else if (rank > 5 && rank <= 10) candidates.push("Top 5 진입을 향해! 이번 주말에 멋짐에서 땀 한 번 쫙 빼보는 건 어떨까요? 🔥");

    // D. Monthly Activity
    if (currentMonthRuns.length === 0) candidates.push("아직 이번 달 첫 인증을 하지 않으셨네요! 오늘부터 멋짐에서 가볍게 시작해볼까요? 🌱");
    else if (currentMonthRuns.length === 1) candidates.push("첫 인증!! 시작이 반입니다, 멋짐과 함께 조금 더 화이팅이에요! 🔥");
    else if (currentMonthRuns.length >= 5) candidates.push(`이번 달 벌써 ${currentMonthRuns.length}회나 달렸네요! 멋짐이 인정하는 꾸준함의 대명사 👍`);
    
    if (isMaxTierReached) candidates.push("이번 달 최고 목표 달성 완료! 당신의 멈추지 않는 열정에 멋짐이 박수를 보냅니다 🎉");
    else if (distanceRemaining > 0 && distanceRemaining <= 5) candidates.push(`다음 챌린지 목표까지 단 ${distanceRemaining.toFixed(1)}km! 멋짐과 함께 가보자고! 💪`);

    // E. Default Fallback
    if (candidates.length === 0) {
      candidates.push("오늘도 멋짐과 함께 신나게 달려볼까요? 🏃");
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }, [member.id, currentMonthRuns.length, totalDistance, rank, isMaxTierReached, distanceRemaining, preferredWorkout, maxCount]);

  const getWorkoutTypeLabel = (type: string) => {
    switch (type) {
      case 'treadmill': return '트레드밀';
      case 'stairmaster': return '천국의계단';
      case 'cycling': return '싸이클';
      case 'orr_run': return 'ORR RUN';
      default: return '야외 러닝';
    }
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
                <h3 className="text-xl font-black text-brand-orange leading-tight flex flex-wrap items-center gap-1.5 break-keep">
                  {member.nickname} {highestMedal}
                </h3>
                <span className="text-xs text-gray-400 font-bold block mt-1">
                  본명: {member.name} ({member.gender})
                </span>
              </>
            ) : (
              <h3 className="text-xl font-black text-white leading-tight flex flex-wrap items-center gap-1.5 break-keep">
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

          <div className="flex border-b border-gray-800 mb-6">
            <button
              className={`flex-1 py-2 text-sm font-bold transition-colors border-b-2 ${
                activeTab === 'summary' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('summary')}
            >
              요약
            </button>
            <button
              className={`flex-1 py-2 text-sm font-bold transition-colors border-b-2 ${
                activeTab === 'history' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('history')}
            >
              상세 기록
            </button>
          </div>

          {activeTab === 'summary' && (
            <>
              {/* Motivational Message Speech Bubble */}
              <div className="mb-6 relative bg-gradient-to-r from-brand-orange/20 to-orange-500/10 border border-brand-orange/30 p-3 rounded-2xl rounded-tl-sm text-sm text-gray-200 font-semibold shadow-lg">
            {motivationalMessage}
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
              <span className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Footprints className="w-3.5 h-3.5 text-brand-orange" /> 야외 러닝</span>
              <span className="text-lg font-bold text-white">{stats.outdoor.distance.toFixed(1)} km</span>
              <span className="text-[10px] text-gray-500">{stats.outdoor.count}회</span>
            </div>
            
            <div className="bg-brand-darkBg p-3 rounded-xl border border-gray-800 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-brand-orange" /> ORR RUN</span>
              <span className="text-lg font-bold text-white">{stats.orr_run.count}회</span>
              <span className="text-[10px] text-gray-500">총 참여</span>
            </div>

            <div className="bg-brand-darkBg p-3 rounded-xl border border-gray-800 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-brand-orange" /> 트레드밀</span>
              <span className="text-lg font-bold text-white">{stats.treadmill.distance.toFixed(1)} km</span>
              <span className="text-[10px] text-gray-500">{stats.treadmill.count}회</span>
            </div>

            <div className="bg-brand-darkBg p-3 rounded-xl border border-gray-800 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5 text-brand-orange" /> 천국의 계단</span>
              <span className="text-lg font-bold text-white">
                {Math.floor(stats.stairmaster.duration / 60)} 분
              </span>
              <span className="text-[10px] text-gray-500">
                {stats.stairmaster.count}회
              </span>
            </div>

            <div className="bg-brand-darkBg p-3 rounded-xl border border-gray-800 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Bike className="w-3.5 h-3.5 text-brand-orange" /> 실내 사이클</span>
              <span className="text-lg font-bold text-white">
                {Math.floor(stats.cycling.duration / 60)} 분
              </span>
              <span className="text-[10px] text-gray-500">
                {stats.cycling.count}회
              </span>
            </div>
          </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {memberRuns.sort((a, b) => new Date(b.run_date).getTime() - new Date(a.run_date).getTime()).map(run => (
                <div key={run.id} className="bg-brand-darkBg/50 p-4 rounded-xl border border-gray-800 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-300">{run.run_date}</span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-orange/10 text-brand-orange">
                      {getWorkoutTypeLabel(run.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-white font-bold text-lg">
                    {(run.type === 'outdoor' || run.type === 'treadmill' || run.type === 'orr_run') && (
                      <span>{run.distance.toFixed(1)} km</span>
                    )}
                    <span className="text-gray-400 text-sm font-semibold">{Math.floor(run.duration / 60)}분 {run.duration % 60}초</span>
                  </div>
                  {run.notes && <div className="text-xs text-gray-500 bg-brand-darkSurface p-2 rounded-lg mt-1">{run.notes}</div>}
                </div>
              ))}
              {memberRuns.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-8 font-semibold">아직 등록된 기록이 없습니다.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
