# Member Details & Activities Classification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement member nicknames, workout classification with auto-conversion for Stairmaster/Cycling (10 mins = 1 km), a member detail overlay modal with exercise stats breakdowns, and display challenge achiever medals directly in the leaderboard name tags.

**Architecture:** Update DB tables via SQL, update types, adjust hook loaders to include new fields, build a standalone `MemberDetailModal` component, update AdminPanel inputs with auto-conversion logic, and assemble the interactive popup flows in `App.tsx` and the leaderboard files.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Supabase JS client, Lucide React icons

## Global Constraints

- Primary Color: Vibrant Orange (`#FF6B00`) — use `brand-orange` Tailwind token
- Theme: Dark Mode (`#0B0C0E` background) — use `brand-darkBg` / `brand-darkSurface` tokens
- Font: Pretendard
- All type-only imports must use `import type` syntax
- Every async form handler must have a `try-catch` with a Korean `alert` on failure
- Every task ends with `npm run build` verification and a `git commit`
- Work from: `C:\Users\home\github\orr-fit`

---

### Task 1: Database Migration & Types

**Files:**
- Modify: `src/types/index.ts`
- Modify: `supabase_schema.sql`

**Interfaces:**
- Produces:
  - Updated `Member`, `Run`, and `LeaderboardEntry` interface signatures.
  - Alter Table SQL statements in `supabase_schema.sql`.

- [ ] **Step 1: Add new properties to types in `src/types/index.ts`**

  Replace `src/types/index.ts` with:
  ```ts
  export interface Member {
    id: string;
    name: string;
    gender: 'M' | 'F';
    nickname?: string; // NEW
    created_at: string;
  }

  export interface Run {
    id: string;
    member_id: string;
    distance: number; // in km
    duration: number; // in seconds
    notes?: string;
    run_date: string;
    type: 'treadmill' | 'outdoor' | 'stairmaster' | 'cycling'; // NEW
    created_at: string;
  }

  export interface GymSettings {
    monthly_target: number;
  }

  export interface LeaderboardEntry {
    memberId: string;
    name: string;
    nickname?: string; // NEW
    gender: 'M' | 'F';
    totalDistance: number;
    totalRuns: number;
    averagePace: string; // format: MM'SS"
    totalDuration: number; // in seconds
    lastRunDate: string;
    highestChallengeTier?: string; // NEW ('gold' | 'silver' | 'bronze' | null)
  }

  export interface ChallengeTier {
    km: number;
    reward_days: number;
  }

  export interface MonthlyChallenge {
    tiers: ChallengeTier[];
  }
  ```

- [ ] **Step 2: Append alter table SQL statements to `supabase_schema.sql`**

  At the very end of `supabase_schema.sql`, add:
  ```sql
  -- Migration: Add nickname and workout type columns
  ALTER TABLE members ADD COLUMN nickname VARCHAR(10);
  ALTER TABLE runs ADD COLUMN type VARCHAR(20) DEFAULT 'outdoor' NOT NULL;
  ```

- [ ] **Step 3: Run the alter queries in Supabase SQL Editor**
  - Go to your Supabase project dashboard → **SQL Editor**.
  - Paste and run:
    ```sql
    ALTER TABLE members ADD COLUMN nickname VARCHAR(10);
    ALTER TABLE runs ADD COLUMN type VARCHAR(20) DEFAULT 'outdoor' NOT NULL;
    ```

- [ ] **Step 4: Verify build**
  Run:
  ```powershell
  npm run build
  ```
  Expected: 0 errors.

- [ ] **Step 5: Commit**
  Run:
  ```powershell
  git add src/types/index.ts supabase_schema.sql
  git commit -m "feat(types): update Member, Run, and LeaderboardEntry interfaces with nickname and workout type"
  ```

---

### Task 2: Hook Updates (useDashboardData.ts)

**Files:**
- Modify: `src/hooks/useDashboardData.ts`

**Interfaces:**
- Consumes: Updated types.
- Produces: Exposes runs and members lists with `type` and `nickname` properties.

- [ ] **Step 1: Update hook fetches to query new columns**

  In `src/hooks/useDashboardData.ts`, update the query selectors for members and runs:

  Replace lines 25-34:
  ```ts
  supabase
    .from('members')
    .select('id, name, gender, nickname, created_at')
    .order('name', { ascending: true })
    .throwOnError(),
  supabase
    .from('runs')
    .select('id, member_id, distance, duration, notes, run_date, type, created_at')
    .order('run_date', { ascending: false })
    .throwOnError()
  ```

- [ ] **Step 2: Map new columns in state setter**

  Locate the mapping for runs inside `fetchData` (lines 53-59):
  ```ts
  // Handle runs
  if (runsResult.data) {
    setRuns(runsResult.data.map(r => ({
      ...r,
      distance: Number(r.distance),
      duration: Number(r.duration)
    })) as Run[]);
  }
  ```
  Replace with:
  ```ts
  // Handle runs
  if (runsResult.data) {
    setRuns(runsResult.data.map(r => ({
      ...r,
      distance: Number(r.distance),
      duration: Number(r.duration),
      type: r.type || 'outdoor'
    })) as Run[]);
  }
  ```

- [ ] **Step 3: Verify build**
  Run:
  ```powershell
  npm run build
  ```
  Expected: 0 errors.

- [ ] **Step 4: Commit**
  Run:
  ```powershell
  git add src/hooks/useDashboardData.ts
  git commit -m "feat(hook): load nickname and workout type columns from Supabase"
  ```

---

### Task 3: Create MemberDetailModal Component

**Files:**
- Create: `src/components/MemberDetailModal.tsx`

**Interfaces:**
- Consumes: `member: Member`, `runs: Run[]`, `onClose: () => void`, `monthlyChallenge: MonthlyChallenge | null`
- Produces: Modal overlay displaying exercise breakdowns and stats.

- [ ] **Step 1: Write `src/components/MemberDetailModal.tsx`**

  Create the new component file:
  ```tsx
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

    const formatPace = (distance: number, durationSeconds: number) => {
      if (distance <= 0) return `00'00"`;
      const totalSecondsPerKm = Math.round(durationSeconds / distance);
      const mins = Math.floor(totalSecondsPerKm / 60);
      const secs = totalSecondsPerKm % 60;
      return `${mins}'${secs.toString().padStart(2, '0')}"`;
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-brand-darkSurface border border-gray-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative">
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
                  <h3 className="text-xl font-black text-brand-orange leading-tight">
                    {member.nickname}
                  </h3>
                  <span className="text-xs text-gray-400 font-bold block mt-1">
                    본명: {member.name} ({member.gender})
                  </span>
                </>
              ) : (
                <h3 className="text-xl font-black text-white leading-tight">
                  {member.name} ({member.gender})
                </h3>
              )}

              <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400 font-semibold bg-brand-darkBg/60 border border-gray-900 px-3 py-2 rounded-xl w-fit">
                <Calendar className="w-4 h-4 text-brand-orange" />
                <span>최근 인증일: {lastRunDate}</span>
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
  ```

- [ ] **Step 2: Verify build**
  Run:
  ```powershell
  npm run build
  ```
  Expected: 0 errors.

- [ ] **Step 3: Commit**
  Run:
  ```powershell
  git add src/components/MemberDetailModal.tsx
  git commit -m "feat(ui): implement MemberDetailModal component for workout breakdown"
  ```

---

### Task 4: Admin Panel Enhancements

**Files:**
- Modify: `src/components/AdminPanel.tsx`

**Interfaces:**
- Consumes: Updated `Member` and `Run` type objects.
- Produces:
  - Form field for "닉네임" in member creation form.
  - Dropdown field for "운동 종류" in log creation form.
  - Auto-conversion of Stairmaster and Cycling duration to saved distance.

- [ ] **Step 1: Update Add Member Form with Nickname input**

  Add `nickname` local state:
  ```ts
  const [memberNickname, setMemberNickname] = useState('');
  ```

  Inside `handleMemberSubmit`, modify the `onAddMember` call signature:
  Make sure `onAddMember` receives nickname as the third parameter. Update prop interface of `AdminPanelProps`:
  ```ts
  onAddMember: (name: string, gender: 'M' | 'F', nickname?: string) => Promise<void>;
  ```

  Inside `handleMemberSubmit`:
  ```ts
  await onAddMember(memberName.trim(), memberGender, memberNickname.trim() || undefined);
  setMemberNickname('');
  ```

  Add nickname input JSX block after the Member Name block:
  ```tsx
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
        maxLength={10}
        placeholder="닉네임 (최대 10자)"
        value={memberNickname}
        onChange={(e) => setMemberNickname(e.target.value)}
        className="w-1/2 bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
      />
    </div>
  </div>
  ```

- [ ] **Step 2: Update Add Run Form with Workout Type dropdown**

  Add `workoutType` local state:
  ```ts
  const [workoutType, setWorkoutType] = useState<'outdoor' | 'treadmill' | 'stairmaster' | 'cycling'>('outdoor');
  ```

  Update `onAddRun` signature inside `AdminPanelProps` and callback:
  ```ts
  onAddRun: (memberId: string, distance: number, duration: number, notes: string, date: string, type: string) => Promise<void>;
  ```

  In `handleRunSubmit`, adjust validation and auto-conversion:
  ```ts
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
      await onAddRun(selectedMemberId, targetDistance, totalSeconds, runNotes, runDate, workoutType);
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
  ```

  Update the Add Run form JSX. Add a "운동 종류" dropdown block before the other input elements:
  ```tsx
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
  ```

  Conditional input rendering for distance / seconds:
  ```tsx
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-xs font-bold text-gray-400 mb-1.5">
        운동 량 {(workoutType === 'stairmaster' || workoutType === 'cycling') ? '(자동 산출)' : '(km)'}
      </label>
      <input
        type="number"
        step="0.01"
        placeholder={(workoutType === 'stairmaster' || workoutType === 'cycling') ? "시간 입력 시 자동 변환" : "예: 5.25"}
        value={(workoutType === 'stairmaster' || workoutType === 'cycling') ? (Number(durationMin || 0) / 10).toFixed(1) : distance}
        onChange={(e) => setDistance(e.target.value)}
        className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange disabled:opacity-50 disabled:cursor-not-allowed"
        required={(workoutType !== 'stairmaster' && workoutType !== 'cycling')}
        disabled={(workoutType === 'stairmaster' || workoutType === 'cycling')}
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
          className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
          required
        />
        {(workoutType !== 'stairmaster' && workoutType !== 'cycling') && (
          <input
            type="number"
            placeholder="초 (Sec)"
            value={durationSec}
            onChange={(e) => setDurationSec(e.target.value)}
            className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
          />
        )}
      </div>
    </div>
  </div>
  ```

- [ ] **Step 3: Update History list with Workout type labels**

  In the history tab list rendering, add the workout type display next to name/date:
  ```tsx
  const getWorkoutTypeLabel = (type: string) => {
    switch (type) {
      case 'treadmill': return '트레드밀';
      case 'stairmaster': return '천국의계단';
      case 'cycling': return '싸이클';
      default: return '야외러닝';
    }
  };
  ```

  Inside the history map rendering:
  ```tsx
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
  ```

- [ ] **Step 4: Verify build**
  Run:
  ```powershell
  npm run build
  ```
  Expected: 0 errors. (App.tsx prop signature errors are expected and will be fixed in Task 5).

- [ ] **Step 5: Commit**
  Run:
  ```powershell
  git add src/components/AdminPanel.tsx
  git commit -m "feat(admin): support nickname input, workout types, and auto distance conversion"
  ```

---

### Task 5: App & Leaderboard Integration

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Leaderboard.tsx`
- Modify: `src/components/RecentActivity.tsx`

**Interfaces:**
- Consumes: Exposes `nickname` and `type` from models.
- Produces: Integrated dashboard. Clicking a user opens `MemberDetailModal`. Nickname displays more prominently than real name. Medals display next to names.

- [ ] **Step 1: Update mutator callbacks in `src/App.tsx`**

  Expose `handleAddMember` with nickname parameter:
  ```ts
  const handleAddMember = async (name: string, gender: 'M' | 'F', nickname?: string) => {
    await supabase
      .from('members')
      .insert([{ name, gender, nickname }])
      .throwOnError();
  };
  ```

  Expose `handleAddRun` with type parameter:
  ```ts
  const handleAddRun = async (
    memberId: string,
    distance: number,
    duration: number,
    notes: string,
    date: string,
    type: string
  ) => {
    await supabase
      .from('runs')
      .insert([{ member_id: memberId, distance, duration, notes, run_date: date, type }])
      .throwOnError();
  };
  ```

- [ ] **Step 2: Add challenge tier medals calculation to `getLeaderboardEntries`**

  In `getLeaderboardEntries` in `src/App.tsx`, calculate if the member achieved a tier this month.
  Replace `getLeaderboardEntries` logic to sum distance for the *current calendar month* to check against tiers:
  ```ts
  const getLeaderboardEntries = (): LeaderboardEntry[] => {
    const memberMap: Record<string, {
      totalDistance: number;
      totalRuns: number;
      totalDuration: number;
      lastRunDate: string;
      currentMonthDistance: number;
    }> = {};

    members.forEach((m) => {
      memberMap[m.id] = {
        totalDistance: 0,
        totalRuns: 0,
        totalDuration: 0,
        lastRunDate: '',
        currentMonthDistance: 0,
      };
    });

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    runs.forEach((r) => {
      if (!memberMap[r.member_id]) return;
      const m = memberMap[r.member_id];
      m.totalDistance += r.distance;
      m.totalRuns += 1;
      m.totalDuration += r.duration;
      
      // Calculate current calendar month distance for challenge tiers
      if (r.run_date.startsWith(yearMonth)) {
        m.currentMonthDistance += r.distance;
      }

      if (!m.lastRunDate || new Date(r.run_date + 'T00:00:00') > new Date(m.lastRunDate + 'T00:00:00')) {
        m.lastRunDate = r.run_date;
      }
    });

    const sortedTiers = monthlyChallenge
      ? [...monthlyChallenge.tiers].sort((a, b) => a.km - b.km)
      : [];

    const entries: LeaderboardEntry[] = members.map((m) => {
      const data = memberMap[m.id];
      
      let averagePace = `00'00"`;
      if (data.totalDistance > 0) {
        const totalSecondsPerKm = Math.round(data.totalDuration / data.totalDistance);
        const mins = Math.floor(totalSecondsPerKm / 60);
        const secs = totalSecondsPerKm % 60;
        averagePace = `${mins}'${secs.toString().padStart(2, '0')}`;
      }

      // Check highest tier achieved this month
      let highestChallengeTier: string | undefined = undefined;
      const tierLevels = ['bronze', 'silver', 'gold'];
      sortedTiers.forEach((tier, index) => {
        if (data.currentMonthDistance >= tier.km) {
          highestChallengeTier = tierLevels[Math.min(index, tierLevels.length - 1)];
        }
      });

      return {
        memberId: m.id,
        name: m.name,
        nickname: m.nickname,
        gender: m.gender,
        totalDistance: data.totalDistance,
        totalRuns: data.totalRuns,
        averagePace,
        totalDuration: data.totalDuration,
        lastRunDate: data.lastRunDate,
        highestChallengeTier,
      };
    });

    return entries.sort((a, b) => b.totalDistance - a.totalDistance);
  };
  ```

- [ ] **Step 3: Setup active detail modal state in `src/App.tsx`**

  In `src/App.tsx`, import `MemberDetailModal`:
  ```ts
  import { MemberDetailModal } from './components/MemberDetailModal';
  import type { Member } from './types'; // update type import
  ```

  Add selected member state inside the `App` component:
  ```ts
  const [selectedDetailMember, setSelectedDetailMember] = useState<Member | null>(null);
  ```

  Expose detail modal callback in `Leaderboard` component:
  Add `onSelectMember` callback prop to `Leaderboard` in `src/App.tsx`:
  ```tsx
  <Leaderboard
    entries={leaderboardEntries}
    onSelectMember={(memberId) => {
      const mem = members.find((m) => m.id === memberId);
      if (mem) setSelectedDetailMember(mem);
    }}
  />
  ```

  Add the modal portal/overlay at the bottom of `src/App.tsx` (before the last closing `</div>`):
  ```tsx
  {selectedDetailMember && (
    <MemberDetailModal
      member={selectedDetailMember}
      runs={runs}
      monthlyChallenge={monthlyChallenge}
      onClose={() => setSelectedDetailMember(null)}
    />
  )}
  ```

- [ ] **Step 4: Update `src/components/Leaderboard.tsx`**

  Replace `src/components/Leaderboard.tsx` with:
  ```tsx
  import React, { useState } from 'react';
  import { Search, Trophy, Medal, Star } from 'lucide-react';
  import type { LeaderboardEntry } from '../types';

  interface LeaderboardProps {
    entries: LeaderboardEntry[];
    onSelectMember: (memberId: string) => void;
  }

  export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, onSelectMember }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEntries = entries.filter((entry) => {
      const search = searchQuery.trim().toLowerCase();
      const matchName = entry.name.toLowerCase().includes(search);
      const matchNick = entry.nickname?.toLowerCase().includes(search) || false;
      return matchName || matchNick;
    });

    const topThree = entries.slice(0, 3);
    const podiumArrangement = [
      topThree[1] || null, // 2nd
      topThree[0] || null, // 1st
      topThree[2] || null, // 3rd
    ];

    const getTierMedalEmoji = (tier?: string) => {
      if (tier === 'gold') return '🥇';
      if (tier === 'silver') return '🥈';
      if (tier === 'bronze') return '🥉';
      return null;
    };

    const renderNameTag = (entry: LeaderboardEntry) => {
      return (
        <span className="flex items-center gap-1">
          {entry.nickname ? (
            <>
              <span className="text-brand-orange font-black">{entry.nickname}</span>
              <span className="text-[10px] text-gray-500 font-normal">({entry.name})</span>
            </>
          ) : (
            <span className="font-bold text-white">{entry.name}</span>
          )}
          {getTierMedalEmoji(entry.highestChallengeTier)}
        </span>
      );
    };

    return (
      <div className="flex flex-col gap-6">
        {/* Podium for top 3 */}
        <div className="bg-brand-darkSurface border border-brand-orange/5 p-6 rounded-2xl">
          <h3 className="text-lg font-black text-white text-center mb-6 uppercase tracking-wider flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-brand-gold" />
            Hall of Fame
          </h3>

          <div className="flex items-end justify-center gap-2 md:gap-4 pt-12 pb-2">
            {podiumArrangement.map((entry, index) => {
              if (!entry) return <div key={index} className="flex-1"></div>;

              const isFirst = entry.memberId === topThree[0]?.memberId;
              const isThird = entry.memberId === topThree[2]?.memberId;

              let podiumHeight = 'h-24';
              let badgeColor = 'bg-brand-silver';
              let textColor = 'text-brand-silver';
              let rankName = '2nd';
              let crownIcon = null;

              if (isFirst) {
                podiumHeight = 'h-36';
                badgeColor = 'bg-brand-gold';
                textColor = 'text-brand-gold';
                rankName = '1st';
                crownIcon = <Star className="w-5 h-5 text-brand-gold fill-brand-gold absolute -top-11 animate-pulse" />;
              } else if (isThird) {
                podiumHeight = 'h-20';
                badgeColor = 'bg-brand-bronze';
                textColor = 'text-brand-bronze';
                rankName = '3rd';
              }

              return (
                <div key={entry.memberId} className="flex flex-col items-center flex-1 relative group">
                  {crownIcon}

                  {/* Nickname & Name block clickable */}
                  <button
                    onClick={() => onSelectMember(entry.memberId)}
                    className="text-sm font-black text-white text-center max-w-[120px] truncate mb-2 block hover:underline"
                  >
                    {entry.nickname ? (
                      <>
                        <span className="text-brand-orange font-black block">{entry.nickname}</span>
                        <span className="text-[10px] text-gray-500 font-normal">({entry.name})</span>
                      </>
                    ) : (
                      entry.name
                    )}
                  </button>

                  <span className={`text-xs font-black ${textColor} mb-2 block`}>
                    {entry.totalDistance.toFixed(1)} km
                  </span>

                  <div
                    className={`w-full rounded-t-xl flex flex-col justify-center items-center shadow-lg border-t transition-all duration-500 ${podiumHeight} ${
                      isFirst
                        ? 'bg-brand-orange/20 border-brand-orange/40 shadow-orangeGlow'
                        : 'bg-brand-darkBg border-gray-800'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${badgeColor} flex items-center justify-center text-brand-darkBg font-black text-sm`}>
                      {rankName.substring(0, 1)}
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold mt-1 font-mono">{entry.averagePace}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard list & search */}
        <div className="bg-brand-darkSurface border border-gray-800 p-6 rounded-2xl flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-base font-bold text-white">회원 순위 현황</h3>

            <div className="relative w-full md:w-48">
              <input
                type="text"
                placeholder="회원 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-2 pl-9 text-xs focus:outline-none focus:border-brand-orange text-white"
              />
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-gray-400">
              <thead>
                <tr className="border-b border-gray-800 pb-2">
                  <th className="pb-2 text-center w-12">순위</th>
                  <th className="pb-2">이름 (닉네임)</th>
                  <th className="pb-2 text-right">기록 수</th>
                  <th className="pb-2 text-right">평균 페이스</th>
                  <th className="pb-2 text-right text-white">누적 거리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {filteredEntries.map((entry) => {
                  const rank = entries.findIndex((e) => e.memberId === entry.memberId) + 1;
                  const isTop3 = rank <= 3;

                  let medalColor = '';
                  if (rank === 1) medalColor = 'text-brand-gold';
                  if (rank === 2) medalColor = 'text-brand-silver';
                  if (rank === 3) medalColor = 'text-brand-bronze';

                  return (
                    <tr key={entry.memberId} className="hover:bg-brand-darkBg/30 transition-colors">
                      <td className="py-3 text-center">
                        {isTop3 ? (
                          <Medal className={`w-5 h-5 mx-auto ${medalColor}`} />
                        ) : (
                          <span className="font-bold text-gray-500">{rank}</span>
                        )}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => onSelectMember(entry.memberId)}
                          className="flex items-center gap-1.5 hover:underline text-left"
                        >
                          {renderNameTag(entry)}
                          <span className={`text-[9px] px-1 rounded-md font-extrabold ${entry.gender === 'M' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
                            {entry.gender}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 text-right">{entry.totalRuns}회</td>
                      <td className="py-3 text-right text-gray-500 font-mono">{entry.averagePace}</td>
                      <td className="py-3 text-right text-brand-orange font-black text-sm">{entry.totalDistance.toFixed(1)} km</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  ```

- [ ] **Step 5: Update `src/components/RecentActivity.tsx`**

  Modify RecentActivity to render nicknames and workout types in the activity stream.
  Replace lines 81-91 inside `RecentActivity.tsx`:
  ```tsx
  <div className="flex justify-between items-start mb-2">
    <div>
      <span className="text-xs font-black text-white block">
        {getMemberName(run.member_id)}
      </span>
      <span className="text-[10px] text-gray-500 font-semibold">{run.run_date}</span>
    </div>
    <span className="text-xs font-black text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-lg">
      {run.distance.toFixed(1)} km
    </span>
  </div>
  ```
  Replace with:
  ```tsx
  const getWorkoutTypeLabel = (type: string) => {
    switch (type) {
      case 'treadmill': return '트레드밀';
      case 'stairmaster': return '천국의계단';
      case 'cycling': return '싸이클';
      default: return '야외러닝';
    }
  };

  const getMemberDisplayName = (memberId: string) => {
    const m = members.find((m) => m.id === memberId);
    if (!m) return '알 수 없는 회원';
    return m.nickname ? `${m.nickname} (${m.name})` : m.name;
  };
  ```
  Then in runs map rendering:
  ```tsx
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
  ```

- [ ] **Step 6: Verify build**
  Run:
  ```powershell
  npm run build
  ```
  Expected: `✓ built in` with 0 errors.

- [ ] **Step 7: Commit**
  Run:
  ```powershell
  git add src/App.tsx src/components/Leaderboard.tsx src/components/RecentActivity.tsx
  git commit -m "feat(ui): integrate nickname prominent display, medals tags, and interactive detail modals"
  ```

---

### Task 6: End-to-End Verification & Validation

**Files:** None

- [ ] **Step 1: Check build success**
  Run:
  ```powershell
  npm run build
  ```
  Expected: Production build finishes in `./dist` directory without warnings or TS compilation errors.

- [ ] **Step 2: Start dev server**
  Run:
  ```powershell
  npm run dev
  ```

- [ ] **Step 3: Perform verification checklist**
  - Verify that existing mock users load without errors.
  - Open Admin Panel and add a new member with a nickname (e.g. `킹왕짱`).
  - Verify that the nickname appears in bright orange on the leaderboard list and the real name is in small brackets.
  - Log a `천국의계단` exercise for `40분`. Verify that the dashboard shows `4.0 km` and the timeline shows `[천국의계단]`.
  - Click on the member's name. Check that the `MemberDetailModal` overlay opens and displays the breakdowns correctly, including the last certified date.
  - Confirm that challenge achievers display the Bronze, Silver, or Gold medal emoji next to their names in the leaderboard list.
