import React, { useState } from 'react';
import { Plus, Trash2, ShieldAlert, Award, Trophy, Calendar } from 'lucide-react';
import type { Member, Run, ChallengeTier, MonthlyChallenge, MonthlyRanking } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { AlertModal } from './AlertModal';

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
  onAddBulkRuns?: (
    runs: { member_id: string; distance: number; duration: number; run_date: string; type: string }[]
  ) => Promise<void>;
  onDeleteRun: (runId: string) => Promise<void>;
  onUpdateTarget: (target: number) => Promise<void>;
  onUpdateChallenge: (tiers: ChallengeTier[]) => Promise<void>;
  onUpdateMemberNickname: (memberId: string, nickname?: string) => Promise<void>;
  onSaveMonthlyRankings: (
    yearMonth: string,
    rankings: { memberId: string; rank: number; distance: number }[]
  ) => Promise<void>;
  onSaveHealthPassRewards: (
    yearMonth: string,
    rewards: { memberId: string; rewardDays: number; distance: number }[]
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
  onAddBulkRuns,
  onDeleteRun,
  onUpdateTarget,
  onUpdateChallenge,
  onUpdateMemberNickname,
  onSaveMonthlyRankings,
  onSaveHealthPassRewards,
}) => {
  // Tab State: 'run' | 'member' | 'settings' | 'history' | 'stamps' | 'event'
  const [activeTab, setActiveTab] = useState<'run' | 'member' | 'settings' | 'history' | 'stamps' | 'event'>('run');

  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ isOpen: true, title, message });
  };

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // stamps 관리용 상태값
  const [selectedYearMonth, setSelectedYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // default: current month
  });

  const [rankingsInput, setRankingsInput] = useState<{ memberId: string; distance: string }[]>(
    Array.from({ length: 6 }, () => ({ memberId: '', distance: '' }))
  );

  // useRef to track the last loaded year-month
  const lastLoadedYearMonthRef = React.useRef<string | null>(null);

  // 년-월 선택 시 이미 저장된 데이터가 있으면 폼 로드
  React.useEffect(() => {
    if (selectedYearMonth !== lastLoadedYearMonthRef.current) {
      const currentSaved = monthlyRankings.filter(r => r.year_month === selectedYearMonth);
      const newInputs = Array.from({ length: 6 }, (_, idx) => {
        const saved = currentSaved.find(r => r.rank === idx + 1);
        return {
          memberId: saved ? saved.member_id : '',
          distance: saved ? saved.distance.toString() : ''
        };
      });
      setRankingsInput(newInputs);
      lastLoadedYearMonthRef.current = selectedYearMonth;
    }
  }, [selectedYearMonth, monthlyRankings]);

  // 자동 계산 기능 함수 구현
  const handleAutoCalculate = () => {
    // runs 데이터 중 selectedYearMonth에 해당하는 데이터 필터링
    const monthlyRuns = runs.filter(run => run.run_date.startsWith(selectedYearMonth));
    
    // 멤버별 총 거리 합산
    const memberDistances: Record<string, number> = {};
    // 모든 멤버 0으로 초기화
    members.forEach(m => {
      memberDistances[m.id] = 0;
    });
    // 기록 누적
    monthlyRuns.forEach(run => {
      if (memberDistances[run.member_id] !== undefined) {
        memberDistances[run.member_id] += run.distance;
      }
    });

    const sorted = Object.entries(memberDistances)
      .map(([memberId, dist]) => ({ memberId, dist }))
      .filter(item => item.dist > 0)
      .sort((a, b) => b.dist - a.dist || a.memberId.localeCompare(b.memberId));

    // 1~6등 바인딩
    const calculatedInputs = Array.from({ length: 6 }, (_, idx) => {
      const item = sorted[idx];
      return {
        memberId: item ? item.memberId : '',
        distance: item ? item.dist.toFixed(2) : ''
      };
    });
    
    setRankingsInput(calculatedInputs);
  };

  // 저장 핸들러
  const handleRankingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효한 항목 필터링 (멤버ID가 있는 항목)
    const validRankings = rankingsInput
      .map((item, idx) => ({
        memberId: item.memberId,
        rank: idx + 1,
        distance: Number(item.distance || 0)
      }))
      .filter(r => r.memberId !== '');

    // 중복된 멤버가 있는지 확인
    const memberIds = validRankings.map(r => r.memberId);
    const hasDuplicates = new Set(memberIds).size !== memberIds.length;
    if (hasDuplicates) {
      showAlert('알림', '순위 내에 동일한 회원이 중복으로 등록되어 있습니다. 확인해 주세요.');
      return;
    }

    try {
      await onSaveMonthlyRankings(selectedYearMonth, validRankings);
      // Reset the ref so that the newly saved records are loaded into the form
      lastLoadedYearMonthRef.current = null;
      showAlert('알림', `${selectedYearMonth} 명예의 전당 도장 정보가 저장되었습니다!`);
    } catch (error) {
      console.error('Failed to save rankings:', error);
      showAlert('알림', '도장 정보 저장에 실패했습니다.');
    }
  };

  // 헬스권 보상 자동 계산 및 저장
  const handleAutoCalculateAndSaveRewards = async () => {
    const monthlyRuns = runs.filter(run => run.run_date.startsWith(selectedYearMonth));
    const memberDistances: Record<string, number> = {};
    monthlyRuns.forEach(run => {
      memberDistances[run.member_id] = (memberDistances[run.member_id] || 0) + run.distance;
    });

    const sortedTiers = monthlyChallenge && monthlyChallenge.tiers.length > 0 
      ? [...monthlyChallenge.tiers].sort((a, b) => a.km - b.km) 
      : [];

    const getRewardForDistance = (distance: number) => {
      let rewardDays = 0;
      for (const tier of sortedTiers) {
        if (distance >= tier.km) {
          rewardDays = tier.reward_days;
        }
      }
      return rewardDays;
    };

    const winners = members
      .map(m => {
        const dist = memberDistances[m.id] || 0;
        return {
          memberId: m.id,
          distance: dist,
          rewardDays: getRewardForDistance(dist)
        };
      })
      .filter(w => w.rewardDays > 0);

    try {
      await onSaveHealthPassRewards(selectedYearMonth, winners);
      showAlert('알림', `${selectedYearMonth} 헬스권 보상 스냅샷이 성공적으로 저장되었습니다!`);
    } catch (error) {
      console.error('Failed to save health pass rewards:', error);
      showAlert('알림', '헬스권 보상 저장에 실패했습니다.');
    }
  };

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

  // Orr Run Event States
  const [orrRunSettings, setOrrRunSettings] = useState({
    date: '',
    d_day: 7,
    route_modal_id: '1',
    enabled: false,
    distance: '',
    description: '',
    meeting_point: '',
    time: ''
  });

  // Fetch orr run settings
  React.useEffect(() => {
    const fetchOrrRunSettings = async () => {
      import('../lib/supabase').then(async ({ supabase }) => {
        const { data } = await supabase.from('settings').select('value').eq('key', 'next_orr_run').single();
        if (data && data.value) {
          setOrrRunSettings(data.value as any);
        }
      });
    };
    fetchOrrRunSettings();
  }, []);

  const handleOrrRunSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    import('../lib/supabase').then(async ({ supabase }) => {
      const { error } = await supabase.from('settings').upsert({
        key: 'next_orr_run',
        value: orrRunSettings
      });
      if (error) {
        console.error('Failed to update orr run settings:', error);
        showAlert('알림', '이벤트 설정 업데이트에 실패했습니다.');
      } else {
        showAlert('알림', '이벤트 설정이 성공적으로 저장되었습니다!');
      }
    });
  };

  React.useEffect(() => {
    setTargetDistanceInput(monthlyTarget.toString());
  }, [monthlyTarget]);

  // Bulk ORR Run States
  const [bulkOrrRunDate, setBulkOrrRunDate] = useState(new Date().toISOString().substring(0, 10));
  const [bulkOrrRunDistance, setBulkOrrRunDistance] = useState('');
  const [bulkOrrRunDurationMin, setBulkOrrRunDurationMin] = useState('');
  const [bulkOrrRunDurationSec, setBulkOrrRunDurationSec] = useState('');
  const [bulkSelectedMembers, setBulkSelectedMembers] = useState<string[]>([]);

  const handleBulkOrrRunSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkSelectedMembers.length === 0) {
      showAlert('알림', '참여자를 한 명 이상 선택해 주세요.');
      return;
    }
    if (!bulkOrrRunDistance || !bulkOrrRunDurationMin) {
      showAlert('알림', '거리와 시간을 모두 입력해 주세요.');
      return;
    }

    const distanceNum = Number(bulkOrrRunDistance);
    const totalSeconds = (Number(bulkOrrRunDurationMin) * 60) + Number(bulkOrrRunDurationSec || 0);

    const runsToAdd = bulkSelectedMembers.map(memberId => ({
      member_id: memberId,
      distance: distanceNum,
      duration: totalSeconds,
      run_date: bulkOrrRunDate,
      type: 'orr_run',
      notes: '오르런 단체 기록 일괄 등록'
    }));

    if (onAddBulkRuns) {
      try {
        await onAddBulkRuns(runsToAdd);
        setBulkSelectedMembers([]);
        setBulkOrrRunDistance('');
        setBulkOrrRunDurationMin('');
        setBulkOrrRunDurationSec('');
        showAlert('알림', `${runsToAdd.length}명의 오르런 기록이 일괄 등록되었습니다!`);
      } catch (err) {
        console.error('Bulk run error:', err);
        showAlert('알림', '기록 일괄 등록에 실패했습니다.');
      }
    } else {
      showAlert('알림', '일괄 등록 기능이 아직 준비되지 않았습니다.');
    }
  };

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
      showAlert('알림', '러닝 기록이 성공적으로 등록되었습니다!');
    } catch (error) {
      console.error('Failed to add run:', error);
      showAlert('알림', '러닝 기록 등록에 실패했습니다. 다시 시도해 주세요.');
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
      showAlert('알림', '신규 회원이 성공적으로 등록되었습니다!');
    } catch (error) {
      console.error('Failed to add member:', error);
      showAlert('알림', '회원 등록에 실패했습니다. 이미 존재하는 이름이거나 입력값을 확인해 주세요.');
    }
  };

  // Submit Target
  const handleTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateTarget(Number(targetDistanceInput));
      showAlert('알림', '목표 거리가 갱신되었습니다!');
    } catch (error) {
      console.error('Failed to update target:', error);
      showAlert('알림', '목표 거리 수정에 실패했습니다.');
    }
  };

  // Submit Challenge Tiers
  const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = challengeTiers.every((t) => t.km > 0 && t.reward_days > 0);
    if (!valid) {
      showAlert('알림', '모든 단계의 km와 보상 일수는 0보다 커야 합니다.');
      return;
    }
    const sorted = [...challengeTiers].sort((a, b) => a.km - b.km);
    try {
      await onUpdateChallenge(sorted);
      showAlert('알림', '월간 챌린지 단계가 업데이트되었습니다!');
    } catch (err) {
      console.error('Challenge update error:', err);
      showAlert('알림', '챌린지 단계 업데이트에 실패했습니다. 다시 시도해 주세요.');
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
          { id: 'stamps', label: '명예의 전당 관리' },
          { id: 'event', label: '이벤트 관리 (orr run)' },
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
                className="w-full max-w-full min-w-0 block appearance-none bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
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
              <div className="flex flex-col sm:flex-row gap-2">
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
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-brand-darkBg p-3 rounded-xl border border-gray-800 gap-3 sm:gap-4"
                >
                  <div className="text-xs font-bold text-white whitespace-nowrap">
                    {m.name} ({m.gender})
                  </div>
                  <div className="flex items-center gap-2 w-full sm:flex-1 sm:max-w-[240px]">
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
                          showAlert('알림', `${m.name}님의 닉네임이 수정되었습니다!`);
                        } catch (err) {
                          console.error('Failed to update nickname:', err);
                          showAlert('알림', '닉네임 수정에 실패했습니다. 다시 시도해 주세요.');
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
                    setConfirmConfig({
                      isOpen: true,
                      title: '삭제 확인',
                      message: '이 러닝 활동을 영구히 삭제하시겠습니까?',
                      onConfirm: async () => {
                        try {
                          await onDeleteRun(run.id);
                          showAlert('알림', '러닝 기록이 삭제되었습니다.');
                        } catch (err) {
                          console.error('Delete run error:', err);
                          showAlert('알림', '러닝 기록 삭제에 실패했습니다. 다시 시도해 주세요.');
                        }
                        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                      }
                    });
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

      {/* Tab: Stamps Management */}
      {activeTab === 'stamps' && (
        <form onSubmit={handleRankingsSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-darkBg p-4 rounded-xl border border-gray-800">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-400 mb-1.5">대상 년/월 선택</label>
              <input
                type="month"
                value={selectedYearMonth}
                onChange={(e) => setSelectedYearMonth(e.target.value)}
                className="w-full max-w-full min-w-0 block appearance-none bg-brand-darkSurface border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
            <div className="flex flex-col gap-2 h-full justify-end">
              <button
                type="button"
                onClick={handleAutoCalculateAndSaveRewards}
                className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-orangeGlow"
              >
                <Award className="w-3.5 h-3.5" />
                선택월 헬스권 보상 스냅샷 저장
              </button>
              <button
                type="button"
                onClick={handleAutoCalculate}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-blueGlow"
              >
                <Trophy className="w-3.5 h-3.5" />
                명예의 전당 (1~6등) 자동 계산
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">순위별 회원 등록 (1등 ~ 6등)</h3>
            <p className="text-[11px] text-gray-500">
              ※ 자동 계산을 누르면 해당 월에 활동한 거리가 많은 순서대로 1~6등이 자동 기입됩니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rankingsInput.map((input, idx) => {
                const rank = idx + 1;
                let badgeBg = 'bg-gray-800 text-gray-400';
                if (rank === 1) badgeBg = 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
                else if (rank === 2) badgeBg = 'bg-slate-300/10 text-slate-300 border border-slate-300/20';
                else if (rank === 3) badgeBg = 'bg-amber-600/10 text-amber-500 border border-amber-600/20';

                return (
                  <div
                    key={idx}
                    className="bg-brand-darkBg p-4 rounded-xl border border-gray-800 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase ${badgeBg}`}>
                        {rank}등 (Stamp {rank})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">회원 선택</label>
                        <select
                          value={input.memberId}
                          onChange={(e) => {
                            const next = [...rankingsInput];
                            next[idx].memberId = e.target.value;
                            setRankingsInput(next);
                          }}
                          className="w-full bg-brand-darkSurface border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                        >
                          <option value="">-- 없음 --</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.gender})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">누적 거리 (km)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={input.distance}
                          onChange={(e) => {
                            const next = [...rankingsInput];
                            next[idx].distance = e.target.value;
                            setRankingsInput(next);
                          }}
                          className="w-full bg-brand-darkSurface border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-sm py-3 rounded-xl transition-all duration-300 shadow-orangeGlow flex items-center justify-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            명예의 전당 도장 정보 저장하기
          </button>
        </form>
      )}

      {/* Tab: Event Management (orr run) */}
      {activeTab === 'event' && (
        <>
        <form onSubmit={handleOrrRunSubmit} className="space-y-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">이벤트 활성화 및 노출 설정</h3>
          
          <div className="bg-brand-darkBg p-4 rounded-xl border border-gray-800 space-y-4">
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div>
                <label className="block text-sm font-bold text-white mb-1">이벤트 활성화</label>
                <p className="text-[10px] text-gray-500 break-keep">이벤트를 켜면 홈 화면에 플로팅 버튼이 노출될 수 있습니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setOrrRunSettings({ ...orrRunSettings, enabled: !orrRunSettings.enabled })}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  orrRunSettings.enabled ? 'bg-brand-orange' : 'bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  orrRunSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">이벤트 날짜</label>
              <input
                type="date"
                value={orrRunSettings.date}
                onChange={(e) => setOrrRunSettings({ ...orrRunSettings, date: e.target.value })}
                className="w-full max-w-full min-w-0 block appearance-none bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                required={orrRunSettings.enabled}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">D-Day 설정 (며칠 전부터 노출할지)</label>
              <input
                type="number"
                min="0"
                value={orrRunSettings.d_day}
                onChange={(e) => setOrrRunSettings({ ...orrRunSettings, d_day: Number(e.target.value) })}
                className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                required={orrRunSettings.enabled}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">사용할 모달 코스 선택</label>
            <select
              value={orrRunSettings.route_modal_id}
              onChange={(e) => setOrrRunSettings({ ...orrRunSettings, route_modal_id: e.target.value })}
              className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
            >
              <option value="1">1번 코스 (시민공원 러닝 코스)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-800 space-y-4">
            <h4 className="text-xs font-bold text-gray-400">코스 정보 오버라이드 (선택)</h4>
            <p className="text-[10px] text-gray-500">입력하지 않으면 선택한 코스의 기본 정보가 표시됩니다.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">목표 거리 (예: 5km)</label>
                <input
                  type="text"
                  value={orrRunSettings.distance || ''}
                  onChange={(e) => setOrrRunSettings({ ...orrRunSettings, distance: e.target.value })}
                  placeholder="기본값 사용"
                  className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">출발 시간 (예: 오전 10시)</label>
                <input
                  type="text"
                  value={orrRunSettings.time || ''}
                  onChange={(e) => setOrrRunSettings({ ...orrRunSettings, time: e.target.value })}
                  placeholder="기본값 사용"
                  className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">집결지 안내</label>
              <input
                type="text"
                value={orrRunSettings.meeting_point || ''}
                onChange={(e) => setOrrRunSettings({ ...orrRunSettings, meeting_point: e.target.value })}
                placeholder="기본값 사용 (예: 시민공원 남1문 앞)"
                className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">코스 설명 문구</label>
              <textarea
                value={orrRunSettings.description || ''}
                onChange={(e) => setOrrRunSettings({ ...orrRunSettings, description: e.target.value })}
                placeholder="기본값 사용 (예: 시원한 바람맞으며...)"
                rows={2}
                className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-sm py-3 rounded-xl transition-all duration-300 shadow-orangeGlow flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            이벤트 설정 저장
          </button>
        </form>

        <div className="border-t border-gray-800 my-8" />

        <form onSubmit={handleBulkOrrRunSubmit} className="space-y-6">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">오르런 참여자 기록 일괄 등록</h3>
          </div>

          <div className="bg-brand-darkBg p-4 rounded-xl border border-gray-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">운동 날짜</label>
                <input
                  type="date"
                  value={bulkOrrRunDate}
                  onChange={(e) => setBulkOrrRunDate(e.target.value)}
                  className="w-full max-w-full min-w-0 block appearance-none bg-brand-darkSurface border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  오르런 뛴 거리 (km)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="예: 5.0"
                  value={bulkOrrRunDistance}
                  onChange={(e) => setBulkOrrRunDistance(e.target.value)}
                  className="w-full bg-brand-darkSurface border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">운동 시간 (분 / 초)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  placeholder="분 (Min)"
                  value={bulkOrrRunDurationMin}
                  onChange={(e) => setBulkOrrRunDurationMin(e.target.value)}
                  className="flex-1 bg-brand-darkSurface border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                  required
                />
                <input
                  type="number"
                  placeholder="초 (Sec)"
                  value={bulkOrrRunDurationSec}
                  onChange={(e) => setBulkOrrRunDurationSec(e.target.value)}
                  className="flex-1 bg-brand-darkSurface border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-400">참여자 선택</label>
                <button
                  type="button"
                  onClick={() => {
                    if (bulkSelectedMembers.length === members.length) {
                      setBulkSelectedMembers([]);
                    } else {
                      setBulkSelectedMembers(members.map(m => m.id));
                    }
                  }}
                  className="text-[10px] font-bold text-brand-orange hover:underline"
                >
                  {bulkSelectedMembers.length === members.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto bg-brand-darkSurface border border-gray-800 rounded-xl p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {members.map(m => (
                  <label key={m.id} className="flex items-center gap-2 p-2 hover:bg-brand-darkBg rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={bulkSelectedMembers.includes(m.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkSelectedMembers([...bulkSelectedMembers, m.id]);
                        } else {
                          setBulkSelectedMembers(bulkSelectedMembers.filter(id => id !== m.id));
                        }
                      }}
                      className="accent-brand-orange w-4 h-4"
                    />
                    <span className="text-xs text-white">
                      {m.nickname ? `${m.nickname} (${m.name})` : m.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-sm py-3 rounded-xl transition-all duration-300 shadow-orangeGlow flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {bulkSelectedMembers.length}명 기록 일괄 등록하기
          </button>
        </form>
      </>
      )}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
      <AlertModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
      />
    </div>
  );
};