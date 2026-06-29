import React, { useState } from 'react';
import { Plus, Trash2, ShieldAlert, Award } from 'lucide-react';
import type { Member, Run } from '../types';

interface AdminPanelProps {
  members: Member[];
  runs: Run[];
  monthlyTarget: number;
  onAddMember: (name: string, gender: 'M' | 'F') => Promise<void>;
  onAddRun: (memberId: string, distance: number, duration: number, notes: string, date: string) => Promise<void>;
  onDeleteRun: (runId: string) => Promise<void>;
  onUpdateTarget: (target: number) => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  members,
  runs,
  monthlyTarget,
  onAddMember,
  onAddRun,
  onDeleteRun,
  onUpdateTarget,
}) => {
  // Tab State: 'run' | 'member' | 'settings' | 'history'
  const [activeTab, setActiveTab] = useState<'run' | 'member' | 'settings' | 'history'>('run');

  // New Run Form States
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [distance, setDistance] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [durationSec, setDurationSec] = useState('');
  const [runNotes, setRunNotes] = useState('');
  const [runDate, setRunDate] = useState(new Date().toISOString().substring(0, 10));

  // New Member Form States
  const [memberName, setMemberName] = useState('');
  const [memberGender, setMemberGender] = useState<'M' | 'F'>('M');

  // Target Setting State
  const [targetDistanceInput, setTargetDistanceInput] = useState(monthlyTarget.toString());

  // Submit Log
  const handleRunSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !distance || !durationMin) return;
    const totalSeconds = (Number(durationMin) * 60) + (Number(durationSec || 0));
    await onAddRun(selectedMemberId, Number(distance), totalSeconds, runNotes, runDate);
    
    // Reset Form
    setDistance('');
    setDurationMin('');
    setDurationSec('');
    setRunNotes('');
  };

  // Submit Member
  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;
    await onAddMember(memberName.trim(), memberGender);
    setMemberName('');
  };

  // Submit Target
  const handleTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateTarget(Number(targetDistanceInput));
    alert('목표 거리가 갱신되었습니다!');
  };

  return (
    <div className="bg-brand-darkSurface border border-red-500/20 p-6 rounded-2xl">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
        <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
        <h2 className="text-lg font-black text-white">직원 관리용 어드민 패널</h2>
      </div>

      {/* Tab Controls */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {([
          { id: 'run', label: '활동 기록 등록' },
          { id: 'member', label: '신규 회원 가입' },
          { id: 'settings', label: '목표 설정' },
          { id: 'history', label: '전체 기록 관리' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-300 border ${
              activeTab === tab.id
                ? 'bg-brand-orange text-white border-brand-orange'
                : 'bg-brand-darkBg text-gray-400 border-gray-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Run Registration */}
      {activeTab === 'run' && (
        <form onSubmit={handleRunSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">회원 선택</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                required
              >
                <option value="">-- 회원명 선택 --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.gender})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">러닝 날짜</label>
              <input
                type="date"
                value={runDate}
                onChange={(e) => setRunDate(e.target.value)}
                className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">러닝 거리 (km)</label>
              <input
                type="number"
                step="0.01"
                placeholder="예: 5.25"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">운동 시간 (분 / 초)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="분 (Min)"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  className="w-1/2 bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                  required
                />
                <input
                  type="number"
                  placeholder="초 (Sec)"
                  value={durationSec}
                  onChange={(e) => setDurationSec(e.target.value)}
                  className="w-1/2 bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">메모 / 인증 증빙</label>
            <input
              type="text"
              placeholder="예: 나이키 런클럽 스크린샷 확인 완료"
              value={runNotes}
              onChange={(e) => setRunNotes(e.target.value)}
              className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-sm py-3 rounded-xl transition-all duration-300 shadow-orangeGlow flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            활동 기록 추가 완료
          </button>
        </form>
      )}

      {/* Tab: Member Registration */}
      {activeTab === 'member' && (
        <form onSubmit={handleMemberSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">회원 이름 / 닉네임</label>
            <input
              type="text"
              placeholder="예: 홍길동"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">성별</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setMemberGender('M')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl border transition-all ${
                  memberGender === 'M'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                    : 'bg-brand-darkBg border-gray-800 text-gray-500'
                }`}
              >
                남성 (M)
              </button>
              <button
                type="button"
                onClick={() => setMemberGender('F')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl border transition-all ${
                  memberGender === 'F'
                    ? 'bg-pink-500/10 border-pink-500 text-pink-400'
                    : 'bg-brand-darkBg border-gray-800 text-gray-500'
                }`}
              >
                여성 (F)
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-sm py-3 rounded-xl transition-all duration-300 shadow-orangeGlow flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            신규 회원 등록 완료
          </button>
        </form>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleTargetSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">센터 월간 총 목표 거리 (km)</label>
            <input
              type="number"
              value={targetDistanceInput}
              onChange={(e) => setTargetDistanceInput(e.target.value)}
              className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-sm py-3 rounded-xl transition-all duration-300 shadow-orangeGlow flex items-center justify-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            목표 거리 업데이트
          </button>
        </form>
      )}

      {/* Tab: History List & Delete */}
      {activeTab === 'history' && (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
          {runs.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">러닝 기록이 없습니다.</p>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className="flex justify-between items-center bg-brand-darkBg p-3 rounded-xl border border-gray-800"
              >
                <div className="text-xs">
                  <span className="font-black text-white block">
                    {members.find((m) => m.id === run.member_id)?.name || '알 수 없음'}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold">
                    {run.distance.toFixed(2)}km ({run.run_date})
                  </span>
                </div>

                <button
                  onClick={async () => {
                    if (window.confirm('이 러닝 활동을 영구히 삭제하시겠습니까?')) {
                      await onDeleteRun(run.id);
                    }
                  }}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
