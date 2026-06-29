import React from 'react';
import { Activity } from 'lucide-react';
import type { Run, Member } from '../types';

interface RecentActivityProps {
  runs: Run[];
  members: Member[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ runs, members }) => {
  const getMemberDisplayName = (memberId: string) => {
    const m = members.find((m) => m.id === memberId);
    if (!m) return '알 수 없는 회원';
    return m.nickname ? `${m.nickname} (${m.name})` : m.name;
  };

  const getWorkoutTypeLabel = (type: string) => {
    switch (type) {
      case 'treadmill': return '트레드밀';
      case 'stairmaster': return '천국의계단';
      case 'cycling': return '싸이클';
      default: return '야외러닝';
    }
  };

  const formatPace = (distance: number, duration: number) => {
    if (!distance) return `00'00"`;
    const totalSecondsPerKm = Math.round(duration / distance);
    const mins = Math.floor(totalSecondsPerKm / 60);
    const secs = totalSecondsPerKm % 60;
    return `${mins}'${secs.toString().padStart(2, '0')}"`;
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}시간 ${mins}분`;
    }
    return `${mins}분 ${secs}초`;
  };

  return (
    <div className="bg-brand-darkSurface border border-gray-800 p-6 rounded-2xl h-full flex flex-col">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-brand-orange" />
        실시간 러닝 피드
      </h3>

      <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 flex-1">
        {runs.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-8 font-semibold">
            아직 등록된 러닝 활동이 없습니다.
          </p>
        ) : (
          runs.map((run) => (
            <div
              key={run.id}
              className="bg-brand-darkBg/60 border border-gray-900 rounded-xl p-4 transition-all duration-300 hover:border-brand-orange/20"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-black text-white block">
                    {getMemberDisplayName(run.member_id)}
                  </span>
                  <span className="text-[10px] text-gray-500 font-semibold">
                    [{getWorkoutTypeLabel(run.type)}] {run.run_date}
                  </span>
                </div>
                <span className="text-xs font-black text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-lg">
                  {run.distance.toFixed(1)} km
                </span>
              </div>

              {run.notes && (
                <p className="text-xs text-gray-300 font-medium mb-3 italic">
                  "{run.notes}"
                </p>
              )}

              <div className="flex justify-between items-center border-t border-gray-900 pt-3 mt-1">
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 font-mono">
                  <div>
                    <span className="block text-gray-400 text-xs font-black">{formatTime(run.duration)}</span>
                    시간
                  </div>
                  <div className="h-4 w-px bg-gray-800"></div>
                  <div>
                    <span className="block text-gray-400 text-xs font-black">{formatPace(run.distance, run.duration)}</span>
                    페이스
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
