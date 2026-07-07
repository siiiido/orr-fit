import React, { useState } from 'react';
import { Plus, Trash2, ShieldAlert, Award, Trophy } from 'lucide-react';
import type { Member, Run, ChallengeTier, MonthlyChallenge, MonthlyRanking } from '../types';

interface AdminPanelProps {
  members: Member[];
  runs: Run[];
  monthlyTarget: number;
  monthlyChallenge: MonthlyChallenge | null;
  monthlyRankings: MonthlyRanking[];
  onAddMember: (name: string, gender: 'M' | 'F', nickname?: string) => Promise<void>;
  onAddRun: (
    memberId: string,
    distance: number,
    duration: number,
    notes: string,
    date: string,
    type: 'outdoor' | 'treadmill' | 'stairmaster' | 'cycling'
  ) => Promise<void>;
  onDeleteRun: (runId: string) => Promise<void>;
  onUpdateTarget: (target: number) => Promise<void>;
  onUpdateChallenge: (tiers: ChallengeTier[]) => Promise<void>;
  onUpdateMemberNickname: (memberId: string, nickname?: string) => Promise<void>;
  onSaveMonthlyRankings: (
    yearMonth: string,
    rankings: { memberId: string; rank: number; distance: number }[]
  ) => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  members,
  runs,
  monthlyTarget,
  monthlyChallenge,
  monthlyRankings,
  onAddMember,
  onAddRun,
  onDeleteRun,
  onUpdateTarget,
  onUpdateChallenge,
  onUpdateMemberNickname,
  onSaveMonthlyRankings,
}) => {
  // Tab State: 'run' | 'member' | 'settings' | 'history'
  const [activeTab, setActiveTab] = useState<'run' | 'member' | 'settings' | 'history'>('run');

  // Stub usage to prevent unused variable compile errors (will be fully implemented in Task 5)
  React.useEffect(() => {
    if (monthlyRankings.length === -1) {
      onSaveMonthlyRankings('', []);
    }
  }, [monthlyRankings, onSaveMonthlyRankings]);

  // New Run Form States
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [distance, setDistance] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [durationSec, setDurationSec] = useState('');
  const [runNotes, setRunNotes] = useState('');
  const [runDate, setRunDate] = useState(new Date().toISOString().substring(0, 10));
  const [workoutType, setWorkoutType] = useState<'outdoor' | 'treadmill' | 'stairmaster' | 'cycling'>('outdoor');

  // New Member Form States
  const [memberName, setMemberName] = useState('');
  const [memberGender, setMemberGender] = useState<'M' | 'F'>('M');
  const [memberNickname, setMemberNickname] = useState('');

  // Editing Nicknames State
  const [editingNicknames, setEditingNicknames] = useState<Record<string, string>>({});

  const getNicknameVal = (memberId: string, currentNickname?: string) => {
    if (editingNicknames[memberId] !== undefined) {
      return editingNicknames[memberId];
    }
    return currentNickname || '';
  };

  const handleNicknameChange = (memberId: string, value: string) => {
    setEditingNicknames({
      ...editingNicknames,
      [memberId]: value,
    });
  };

  // Target Setting State
  const [targetDistanceInput, setTargetDistanceInput] = useState(monthlyTarget.toString());

  // Challenge Tiers State
  const [challengeTiers, setChallengeTiers] = useState<ChallengeTier[]>(
    monthlyChallenge?.tiers ?? [{ km: 30, reward_days: 3 }, { km: 50, reward_days: 7 }, { km: 80, reward_days: 14 }]
  );

  React.useEffect(() => {
    setTargetDistanceInput(monthlyTarget.toString());
  }, [monthlyTarget]);

  React.useEffect(() => {
    if (monthlyChallenge?.tiers) {
      setChallengeTiers(monthlyChallenge.tiers);
    }
  }, [monthlyChallenge]);

  const getWorkoutTypeLabel = (type: string) => {
    switch (type) {
      case 'treadmill': return '트레드밀';
      case 'stairmaster': return '천국의계단';
      case 'cycling': return '싸이클';
      default: return '야외러닝';
    }
  };

  // Submit Log
  const handleRunSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !durationMin) return;

    let targetDistance = Number(distance || 0);
    let totalSeconds = (Number(durationMin) * 60) + (Number(durationSec || 0));

    // Auto convert Stairmaster & Cycling (10 mins = 1 km)
    if (workoutType === 'stairmaster' || workoutType === 'cycling') {
      targetDistance = Number(durationMin) / 10;
      totalSeconds = Number(durationMin) * 60;
    } else {
      if (!distance) return;
    }

    try {
      await onAddRun(
        selectedMemberId,
        targetDistance,
        totalSeconds,
        runNotes,
        runDate,
        workoutType
      );
      // Reset Form
      setDistance('');
      setDurationMin('');
      setDurationSec('');
      setRunNotes('');
    } catch (error) {
      console.error('Failed to add run:', error);
      alert('러닝 기록 등록에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  // Submit Member
  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;
    try {
      await onAddMember(memberName.trim(), memberGender, memberNickname.trim() || undefined);
      setMemberName('');
      setMemberNickname('');
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('회원 등록에 실패했습니다. 이미 존재하는 이름이거나 입력값을 확인해 주세요.');
    }
  };

  // Submit Target
  const handleTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateTarget(Number(targetDistanceInput));
      alert('목표 거리가 갱신되었습니다!');
    } catch (error) {
      console.error('Failed to update target:', error);
      alert('목표 거리 수정에 실패했습니다.');
    }
  };

  // Submit Challenge Tiers
  const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = challengeTiers.every((t) => t.km > 0 && t.reward_days > 0);
    if (!valid) {
      alert('모든 단계의 km와 보상 일수는 0보다 커야 합니다.');
      return;
    }
    const sorted = [...challengeTiers].sort((a, b) => a.km - b.km);
    try {
      await onUpdateChallenge(sorted);
      alert('월간 챌린지 단계가 업데이트되었습니다!');
    } catch (err) {
      console.error('Challenge update error:', err);
      alert('챌린지 단계 업데이트에 실패했습니다. 다시 시도해 주세요.');
    }
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
              <label className="block text-xs font-bold text-gray-400 mb-1.5">운동 날짜</label>
              <input
                type="date"
                value={runDate}
                onChange={(e) => setRunDate(e.target.value)}
                className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">운동 종류</label>
            <select
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value as any)}
              className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
              required
            >
              <option value="outdoor">야외러닝</option>
              <option value="treadmill">트레드밀</option>
              <option value="stairmaster">천국의계단</option>
              <option value="cycling">싸이클</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">
                운동 거리 {(workoutType === 'stairmaster' || workoutType === 'cycling') ? '(자동 산출)' : '(km)'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder={(workoutType === 'stairmaster' || workoutType === 'cycling') ? "시간 입력 시 자동 변환" : "예: 5.25"}
                value={(workoutType === 'stairmaster' || workoutType === 'cycling') ? (Number(durationMin || 0) / 10).toFixed(1) : distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange disabled:opacity-50 disabled:cursor-not-allowed"
                required={workoutType !== 'stairmaster' && workoutType !== 'cycling'}
                disabled={workoutType === 'stairmaster' || workoutType === 'cycling'}
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
                  className="flex-1 bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                  required
                />
                {(workoutType !== 'stairmaster' && workoutType !== 'cycling') && (
                  <input
                    type="number"
                    placeholder="초 (Sec)"
                    value={durationSec}
                    onChange={(e) => setDurationSec(e.target.value)}
                    className="flex-1 bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                )}
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
        <div className="space-y-8">
          <form onSubmit={handleMemberSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">회원 이름 / 닉네임</label>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="본명 (예: 홍길동)"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-1/2 bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                required
              />
              <input
                type="text"
                maxLength={6}
                placeholder="닉네임 (최대 6자)"
                value={memberNickname}
                onChange={(e) => setMemberNickname(e.target.value)}
                className="w-1/2 bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
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

        {/* Divider */}
        <div className="border-t border-gray-800 my-8" />

        {/* Member list & Nickname Editor */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            회원 닉네임 수정
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {members.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">등록된 회원이 없습니다.</p>
            ) : (
              members.map((m) => (
                <div
                  key={m.id}
                  className="flex justify-between items-center bg-brand-darkBg p-3 rounded-xl border border-gray-800 gap-4"
                >
                  <div className="text-xs font-bold text-white whitespace-nowrap">
                    {m.name} ({m.gender})
                  </div>
                  <div className="flex items-center gap-2 flex-1 max-w-[240px]">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="닉네임 입력 (최대 6자)"
                      value={getNicknameVal(m.id, m.nickname)}
                      onChange={(e) => handleNicknameChange(m.id, e.target.value)}
                      className="w-full bg-brand-darkSurface border border-gray-855 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-orange text-center"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const val = getNicknameVal(m.id, m.nickname).trim();
                        try {
                          await onUpdateMemberNickname(m.id, val || undefined);
                          alert(`${m.name}님의 닉네임이 수정되었습니다!`);
                        } catch (err) {
                          console.error('Failed to update nickname:', err);
                          alert('닉네임 수정에 실패했습니다. 다시 시도해 주세요.');
                        }
                      }}
                      className="px-3 py-1.5 bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      수정
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          {/* Monthly Target */}
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

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* Monthly Challenge Tiers */}
          <form onSubmit={handleChallengeSubmit} className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">월간 챌린지 단계 설정</h3>
            <div className="space-y-2">
              {challengeTiers.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={tier.km}
                    onChange={(e) => {
                      const updated = [...challengeTiers];
                      updated[idx] = { ...updated[idx], km: Number(e.target.value) };
                      setChallengeTiers(updated);
                    }}
                    className="w-24 bg-brand-darkBg border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange text-center"
                    placeholder="km"
                  />
                  <span className="text-xs text-gray-500 font-bold">km → 헬스권</span>
                  <input
                    type="number"
                    min="1"
                    value={tier.reward_days}
                    onChange={(e) => {
                      const updated = [...challengeTiers];
                      updated[idx] = { ...updated[idx], reward_days: Number(e.target.value) };
                      setChallengeTiers(updated);
                    }}
                    className="w-20 bg-brand-darkBg border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange text-center"
                    placeholder="일"
                  />
                  <span className="text-xs text-gray-500 font-bold">일</span>
                  <button
                    type="button"
                    onClick={() => setChallengeTiers(challengeTiers.filter((_, i) => i !== idx))}
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
                    aria-label="단계 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setChallengeTiers([...challengeTiers, { km: 0, reward_days: 0 }])}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              단계 추가
            </button>
            <button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-sm py-3 rounded-xl transition-all duration-300 shadow-orangeGlow flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-4 h-4" />
              챌린지 업데이트
            </button>
          </form>
        </div>
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
                    {(() => {
                      const m = members.find((member) => member.id === run.member_id);
                      return m ? (m.nickname ? `${m.nickname} (${m.name})` : m.name) : '알 수 없음';
                    })()}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold">
                    [{getWorkoutTypeLabel(run.type)}] {run.distance.toFixed(2)}km ({run.run_date})
                  </span>
                </div>

                <button
                  onClick={async () => {
                    if (window.confirm('이 러닝 활동을 영구히 삭제하시겠습니까?')) {
                      try {
                        await onDeleteRun(run.id);
                      } catch (err) {
                        console.error('Delete run error:', err);
                        alert('러닝 기록 삭제에 실패했습니다. 다시 시도해 주세요.');
                      }
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
