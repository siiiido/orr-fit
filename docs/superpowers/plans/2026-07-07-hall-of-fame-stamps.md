# 명예의 전당 도장 기능 구현 계획서 (Hall of Fame Stamp Board Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 오르핏 서비스에 명예의 전당 도장판 모달을 추가하고, 관리자가 월별 1~6등 랭킹 기록(도장)을 직접 수정 및 자동 계산하여 등록할 수 있는 기능을 추가합니다.

**Architecture:** 
1. Supabase 데이터베이스에 `monthly_rankings` 테이블을 신설하여 월별 1~6위의 순위와 최종 거리를 관리합니다.
2. `useDashboardData` 커스텀 훅을 개선하여 실시간 데이터 구독 및 동기화를 처리합니다.
3. 리액트 컴포넌트(`StampsModal`, `AdminPanel`, `Leaderboard`, `App`)를 추가 및 개선하여 모바일에 최적화된 도장 모달 및 어드민 관리 편의 기능을 구축합니다.

**Tech Stack:** React, TypeScript, Tailwind CSS, Supabase (PostgreSQL), Lucide React (Icons)

## Global Constraints

- 모든 컴포넌트 및 CSS 스타일링은 Tailwind CSS를 따르며, 모바일 뷰에 완벽 대응되어야 함.
- hover 툴팁 등에 의존하지 않고 터치 및 기본 텍스트 렌더링으로 정보를 노출함.
- 수동 등록 양식 및 자동 계산 시 중복 데이터가 삽입되지 않도록 DB 제약 조건 및 프론트엔드 검증을 보장함.

---

### Task 1: 데이터베이스 마이그레이션

**Files:**
- Modify: `supabase_schema.sql` (새로운 스키마 테이블 하단 추가)

**Interfaces:**
- Produces: `monthly_rankings` 테이블 생성 및 실시간 복제(Realtime) 설정

- [ ] **Step 1: supabase_schema.sql 파일에 테이블 생성 쿼리 추가**

`supabase_schema.sql`의 가장 마지막 줄 뒤에 아래 쿼리들을 추가합니다.

```sql
-- 4. Monthly Rankings (Hall of Fame Stamps) Table
CREATE TABLE monthly_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  year_month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM' (e.g. '2026-07')
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 6),
  distance NUMERIC(6,2) NOT NULL CHECK (distance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT unique_year_month_rank UNIQUE (year_month, rank),
  CONSTRAINT unique_member_year_month UNIQUE (member_id, year_month)
);

-- Enable Realtime for monthly_rankings
alter publication supabase_realtime add table monthly_rankings;
```

- [ ] **Step 2: Supabase 대시보드에 SQL을 실행하여 테이블 생성**

Supabase 대시보드의 SQL Editor에 접속하여 위의 SQL 스크립트를 붙여넣고 실행합니다.
실행이 완료되면 다음 명령어로 Supabase CLI 상태 혹은 수동으로 테이블 생성을 검증할 수 있습니다. 

- [ ] **Step 3: Commit**

```bash
git add supabase_schema.sql
git commit -m "db: create monthly_rankings table for hall of fame stamps"
```

---

### Task 2: TypeScript 타입 선언 업데이트

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `MonthlyRanking` 타입 및 관련 타입 추가 정의

- [ ] **Step 1: src/types/index.ts 수정**

`src/types/index.ts` 파일 하단에 `MonthlyRanking` 타입을 정의합니다.

```typescript
export interface MonthlyRanking {
  id: string;
  member_id: string;
  year_month: string; // 'YYYY-MM'
  rank: number; // 1-6
  distance: number;
  created_at: string;
}
```

- [ ] **Step 2: 빌드 확인**

컴파일 에러가 없는지 터미널에서 다음을 실행하여 확인합니다.
Run: `npm run build` (또는 tsc 컴파일 테스트)
Expected: 에러 없이 정상 완료 혹은 코드 빌드 성공

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "types: add MonthlyRanking interface definition"
```

---

### Task 3: useDashboardData 훅 수정 (데이터 페칭 및 실시간 구독)

**Files:**
- Modify: `src/hooks/useDashboardData.ts`

**Interfaces:**
- Consumes: `MonthlyRanking` 타입
- Produces: `monthlyRankings` 상태 및 `refetch` 시에 데이터 포함 반환

- [ ] **Step 1: useDashboardData.ts 수정**

`monthly_rankings`를 불러오고 실시간 동기화 채널에 추가하도록 변경합니다. 

```typescript
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, Run, MonthlyChallenge, MonthlyRanking } from '../types';

export const useDashboardData = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(2000);
  const [monthlyChallenge, setMonthlyChallenge] = useState<MonthlyChallenge | null>(null);
  const [monthlyRankings, setMonthlyRankings] = useState<MonthlyRanking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isInitialLoadRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      if (isInitialLoadRef.current) {
        setIsLoading(true);
      }
      
      const [settingsResult, challengeResult, membersResult, runsResult, rankingsResult] = await Promise.all([
        supabase
          .from('settings')
          .select('*')
          .eq('key', 'monthly_target')
          .maybeSingle(),
        supabase
          .from('settings')
          .select('*')
          .eq('key', 'monthly_challenge')
          .maybeSingle(),
        supabase
          .from('members')
          .select('id, name, gender, nickname, created_at')
          .order('name', { ascending: true })
          .throwOnError(),
        supabase
          .from('runs')
          .select('id, member_id, distance, duration, notes, run_date, type, created_at')
          .order('run_date', { ascending: false })
          .throwOnError(),
        supabase
          .from('monthly_rankings')
          .select('id, member_id, year_month, rank, distance, created_at')
          .order('year_month', { ascending: false })
          .order('rank', { ascending: true })
          .throwOnError()
      ]);

      if (settingsResult.data && settingsResult.data.value) {
        setMonthlyTarget(settingsResult.data.value.distance || 2000);
      }
      if (challengeResult.data && challengeResult.data.value?.tiers) {
        setMonthlyChallenge({ tiers: challengeResult.data.value.tiers });
      }
      if (membersResult.data) {
        setMembers(membersResult.data as Member[]);
      }
      if (runsResult.data) {
        setRuns(runsResult.data.map(r => ({
          ...r,
          distance: Number(r.distance),
          duration: Number(r.duration),
          type: r.type || 'outdoor'
        })) as Run[]);
      }
      if (rankingsResult.data) {
        setMonthlyRankings(rankingsResult.data.map(rk => ({
          ...rk,
          distance: Number(rk.distance)
        })) as MonthlyRanking[]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
      isInitialLoadRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();

    const realtimeChannel = supabase
      .channel('orr-fit-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'runs' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_rankings' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [fetchData]);

  return {
    members,
    runs,
    monthlyTarget,
    monthlyChallenge,
    monthlyRankings,
    isLoading,
    refetch: fetchData
  };
};
```

- [ ] **Step 2: 빌드 확인 및 실행**

프로젝트가 성공적으로 빌드되는지 확인합니다.
Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDashboardData.ts
git commit -m "hooks: add monthly_rankings fetching and realtime subscription to useDashboardData"
```

---

### Task 4: App.tsx 상태 배분 및 데이터 변동 핸들러 구성

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `monthlyRankings` 상태
- Produces: `monthlyRankings` 연동 핸들러 (`handleSaveRankings`, `handleDeleteRankings`)

- [ ] **Step 1: src/App.tsx 수정**

`App.tsx` 파일 내에 `useDashboardData()`로부터 `monthlyRankings`를 가져오고, 어드민에서 호출할 데이터 저장 및 삭제 핸들러를 정의하여 `AdminPanel` 컴포넌트에 넘겨줍니다.

```typescript
// App.tsx 내에서 추가 및 수정할 주요 위치
// useDashboardData에서 monthlyRankings 꺼내기
const { members, runs, monthlyTarget, monthlyChallenge, monthlyRankings, isLoading } = useDashboardData();

// Mutator: 월별 순위 리스트 저장 (일괄 갱신)
const handleSaveMonthlyRankings = async (yearMonth: string, rankings: { memberId: string; rank: number; distance: number }[]) => {
  // 트랜잭션 대신, 기존 yearMonth에 해당하는 모든 기록 삭제 후 신규 upsert 처리
  const { error: deleteError } = await supabase
    .from('monthly_rankings')
    .delete()
    .eq('year_month', yearMonth);
    
  if (deleteError) throw deleteError;

  if (rankings.length === 0) return;

  const insertData = rankings.map(r => ({
    member_id: r.memberId,
    year_month: yearMonth,
    rank: r.rank,
    distance: r.distance
  }));

  const { error: insertError } = await supabase
    .from('monthly_rankings')
    .insert(insertData);

  if (insertError) throw insertError;
};
```

또한 `AdminPanel` 호출 영역과 `StampsModal` 렌더링 영역(레이아웃 하단에 삽입 예정)을 업데이트합니다.

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add handleSaveMonthlyRankings and pass state in App.tsx"
```

---

### Task 5: 관리자 페이지 명예의 전당 관리 탭 구현

**Files:**
- Modify: `src/components/AdminPanel.tsx`

**Interfaces:**
- Consumes: `members`, `runs`, `monthlyRankings`, `onSaveMonthlyRankings`
- Produces: 월별 랭킹 수동 편집 및 자동 계산 UI 탭 제공

- [ ] **Step 1: src/components/AdminPanel.tsx 수정**

`AdminPanel.tsx` 파일에 아래 내용을 구현합니다.
1. `AdminPanelProps` 인터페이스에 `monthlyRankings: MonthlyRanking[]` 및 `onSaveRankings: (yearMonth: string, rankings: { memberId: string; rank: number; distance: number }[]) => Promise<void>` 추가.
2. 탭 선택 제어 상태 추가: `activeTab === 'stamps'`
3. 월 선택 상태 및 1~6등 편집 데이터 폼 상태 선언.
4. **"이번 달 기록 불러오기"** 자동 계산 함수 구현. 지정한 월(예: `2026-07`)의 시작일부터 말일까지 달린 거리 순위를 `runs` 테이블 데이터 기준으로 내림차순 정렬하여 1~6등을 뽑아내 폼에 자동 입력해줍니다.
5. 수동 수정용 폼 및 저장 이벤트 처리.

```typescript
// AdminPanel.tsx 변경 사항 세부 (스펙 복사 가능하게 완전 기재)
// 1. Props 타입 추가
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
  onSaveMonthlyRankings: (yearMonth: string, rankings: { memberId: string; rank: number; distance: number }[]) => Promise<void>;
}

// 2. 컴포넌트 탭 선언부 수정
// 'run' | 'member' | 'settings' | 'history' | 'stamps'
const [activeTab, setActiveTab] = useState<'run' | 'member' | 'settings' | 'history' | 'stamps'>('run');

// 3. stamps 관리용 상태값
const [selectedYearMonth, setSelectedYearMonth] = useState(() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // default: current month
});

const [rankingsInput, setRankingsInput] = useState<{ memberId: string; distance: string }[]>(
  Array.from({ length: 6 }, () => ({ memberId: '', distance: '' }))
);

// 4. 년-월 선택 시 이미 저장된 데이터가 있으면 폼 로드
React.useEffect(() => {
  const currentSaved = monthlyRankings.filter(r => r.year_month === selectedYearMonth);
  const newInputs = Array.from({ length: 6 }, (_, idx) => {
    const saved = currentSaved.find(r => r.rank === idx + 1);
    return {
      memberId: saved ? saved.member_id : '',
      distance: saved ? saved.distance.toString() : ''
    };
  });
  setRankingsInput(newInputs);
}, [selectedYearMonth, monthlyRankings]);

// 5. 자동 계산 기능 함수 구현
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

  // 누적 거리가 0보다 큰 사람들 중 내림차순 정렬
  const sorted = Object.entries(memberDistances)
    .map(([memberId, dist]) => ({ memberId, dist }))
    .filter(item => item.dist > 0)
    .sort((a, b) => b.dist - a.dist);

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

// 6. 저장 핸들러
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
    alert('순위 내에 동일한 회원이 중복으로 등록되어 있습니다. 확인해 주세요.');
    return;
  }

  try {
    await onSaveMonthlyRankings(selectedYearMonth, validRankings);
    alert(`${selectedYearMonth} 명예의 전당 도장 정보가 저장되었습니다!`);
  } catch (error) {
    console.error('Failed to save rankings:', error);
    alert('도장 정보 저장에 실패했습니다.');
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AdminPanel.tsx
git commit -m "feat: implement stamps management tab and auto-calculation in AdminPanel"
```

---

### Task 6: 명예의 전당 도장 모달 컴포넌트 (`StampsModal.tsx`)

**Files:**
- Create: `src/components/StampsModal.tsx`

**Interfaces:**
- Consumes: `isOpen: boolean`, `onClose: () => void`, `members: Member[]`, `monthlyRankings: MonthlyRanking[]`
- Produces: 전체 멤버 도장 현황을 보여주는 반응형 모달 UI

- [ ] **Step 1: src/components/StampsModal.tsx 컴포넌트 생성**

모바일 가로폭을 고려하여 호버 없이 직관적인 텍스트 획득 내역을 보여주고, 6칸짜리 도장 슬롯과 올클리어 시 골드 이펙트를 적용합니다.

```typescript
import React, { useState } from 'react';
import { X, Search, Trophy, Check } from 'lucide-react';
import type { Member, MonthlyRanking } from '../types';

interface StampsModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  monthlyRankings: MonthlyRanking[];
}

export const StampsModal: React.FC<StampsModalProps> = ({
  isOpen,
  onClose,
  members,
  monthlyRankings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // 멤버별 도장 획득 이력 매핑
  const memberStampsMap = members.map(m => {
    // 해당 멤버의 모든 랭킹 데이터 필터링 (최신 날짜순)
    const records = monthlyRankings
      .filter(r => r.member_id === m.id)
      .sort((a, b) => b.year_month.localeCompare(a.year_month));

    const totalStamps = Math.min(records.length, 6); // 최대 6개 도장 표시

    return {
      member: m,
      records,
      totalStamps,
      isAllCleared: totalStamps >= 6,
    };
  });

  // 이름 및 닉네임 검색 필터
  const filteredMembers = memberStampsMap.filter(item => {
    const search = searchQuery.trim().toLowerCase();
    const matchName = item.member.name.toLowerCase().includes(search);
    const matchNick = item.member.nickname?.toLowerCase().includes(search) || false;
    return matchName || matchNick;
  });

  // 정렬: 도장 개수 내림차순 -> 이름 오름차순
  const sortedMembers = filteredMembers.sort((a, b) => {
    if (b.totalStamps !== a.totalStamps) {
      return b.totalStamps - a.totalStamps;
    }
    return a.member.name.localeCompare(b.member.name);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-brand-darkSurface border border-brand-orange/20 rounded-2xl flex flex-col max-h-[85vh] shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-brand-gold animate-bounce" />
            <div>
              <h2 className="text-lg font-black text-white">명예의 전당 도장 현황</h2>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                매월 1~6위 달성 시 도장이 찍힙니다! 6개를 다 모으면 선물을 드려요 🎁
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white bg-brand-darkBg hover:bg-gray-800 rounded-xl transition-all"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-900 bg-brand-darkBg/30">
          <div className="relative">
            <input
              type="text"
              placeholder="회원 검색 (이름 또는 닉네임)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-brand-orange"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* Member Stamps Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {sortedMembers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12 font-bold">검색 결과가 없습니다.</p>
          ) : (
            sortedMembers.map(({ member, records, totalStamps, isAllCleared }) => (
              <div
                key={member.id}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  isAllCleared
                    ? 'bg-brand-gold/5 border-brand-gold shadow-goldGlow'
                    : 'bg-brand-darkBg border-gray-800/80 hover:border-gray-700'
                }`}
              >
                {/* Member Info */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    {member.nickname ? (
                      <div>
                        <span className="text-sm font-black text-brand-orange">{member.nickname}</span>
                        <span className="text-[10px] text-gray-500 font-bold ml-1">({member.name})</span>
                      </div>
                    ) : (
                      <span className="text-sm font-black text-white">{member.name}</span>
                    )}
                    <span className={`text-[9px] px-1 rounded font-extrabold ${
                      member.gender === 'M' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'
                    }`}>
                      {member.gender}
                    </span>
                    {isAllCleared && (
                      <span className="text-[10px] bg-brand-gold text-brand-darkBg px-2 py-0.5 rounded-full font-black animate-pulse">
                        🎉 상품 완료!
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-black text-gray-400">
                    도장 {totalStamps} / 6
                  </span>
                </div>

                {/* Stamp Board (6 slots) */}
                <div className="grid grid-cols-6 gap-2 max-w-sm mb-3">
                  {Array.from({ length: 6 }).map((_, idx) => {
                    const record = records[idx]; // 최신 랭킹순
                    const isActive = !!record;

                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-full flex flex-col items-center justify-center border text-[9px] font-black relative ${
                          isActive
                            ? 'bg-brand-orange text-white border-brand-orange shadow-orangeGlow animate-in zoom-in-50 duration-350'
                            : 'border-dashed border-gray-800 text-gray-600 bg-brand-darkSurface/50'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5 mb-0.5 text-white stroke-[3px]" />
                            <span className="leading-none text-[8px] font-bold">
                              {record.year_month.substring(5, 7)}월
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-gray-700">{idx + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Stamp Records Detail (Always visible text for mobile readability) */}
                {records.length > 0 ? (
                  <div className="text-[10px] text-gray-500 font-bold leading-relaxed border-t border-gray-800/40 pt-2">
                    달성 이력:{' '}
                    {records.map((r, i) => (
                      <span key={r.id}>
                        {r.year_month.substring(5, 7)}월 {r.rank}등({r.distance.toFixed(1)}km)
                        {i < records.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-600 font-bold">도장 획득 내역이 아직 없습니다.</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StampsModal.tsx
git commit -m "feat: create StampsModal component to display stamp cards"
```

---

### Task 7: 메인 화면 버튼 추가 및 컴포넌트 통합

**Files:**
- Modify: `src/components/Leaderboard.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `LeaderboardProps`에 모달을 여는 핸들러 전달 및 버튼 렌더링

- [ ] **Step 1: src/components/Leaderboard.tsx 수정**

`Leaderboard.tsx` 상단 헤더에 `🏆 명예의 전당 도장판` 버튼을 추가합니다. 

```typescript
// LeaderboardProps 인터페이스 수정
interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onSelectMember: (memberId: string) => void;
  onOpenStamps: () => void; // 추가
}
```

Trophy 헤더 영역에 버튼 배치:

```typescript
<div className="bg-brand-darkSurface border border-brand-orange/5 p-6 rounded-2xl">
  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-gray-900 pb-4">
    <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
      <Trophy className="w-5 h-5 text-brand-gold" />
      Hall of Fame
    </h3>
    <button
      onClick={onOpenStamps}
      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-brand-orange to-yellow-600 hover:from-brand-orange/90 hover:to-yellow-700 text-white font-extrabold text-xs rounded-xl shadow-orangeGlow transition-all duration-300 animate-pulse flex items-center justify-center gap-1.5"
    >
      🏆 명예의 전당 도장판 보기
    </button>
  </div>
  
  {/* Podium for top 3... */}
```

- [ ] **Step 2: src/App.tsx 연동 완료**

`App.tsx` 내에서 `StampsModal` 상태를 관리하고 컴포넌트를 렌더링하도록 묶어줍니다.

```typescript
// App.tsx 내의 추가 부분 예시
const [showStamps, setShowStamps] = useState(false);

// Leaderboard 호출부분 수정
<Leaderboard
  entries={leaderboardEntries}
  onSelectMember={(memberId) => {
    const mem = members.find((m) => m.id === memberId);
    if (mem) setSelectedDetailMember(mem);
  }}
  onOpenStamps={() => setShowStamps(true)}
/>

// AdminPanel 호출부분 수정
<AdminPanel
  members={members}
  runs={runs}
  monthlyTarget={monthlyTarget}
  monthlyChallenge={monthlyChallenge}
  monthlyRankings={monthlyRankings}
  onAddMember={handleAddMember}
  onAddRun={handleAddRun}
  onDeleteRun={handleDeleteRun}
  onUpdateTarget={handleUpdateTarget}
  onUpdateChallenge={handleUpdateChallenge}
  onUpdateMemberNickname={handleUpdateMemberNickname}
  onSaveMonthlyRankings={handleSaveMonthlyRankings}
/>

// 모달 렌더링
<StampsModal
  isOpen={showStamps}
  onClose={() => setShowStamps(false)}
  members={members}
  monthlyRankings={monthlyRankings}
/>
```

- [ ] **Step 3: 전체 프로젝트 빌드 테스트**

프로젝트 컴파일이 완벽하게 끝나는지 확인합니다.
Run: `npm run build`
Expected: 컴파일 통과 및 `dist` 디렉토리에 정상 출력 파일 생성

- [ ] **Step 4: Commit**

```bash
git add src/components/Leaderboard.tsx src/App.tsx
git commit -m "feat: connect StampsModal button to Leaderboard and integrate modal in App"
```
