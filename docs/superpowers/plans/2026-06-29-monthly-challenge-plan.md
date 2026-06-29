# Monthly Challenge Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "주간 미니 챌린지" card with a tiered monthly individual challenge card showing the current month, days remaining (D-N countdown), configurable km→reward tiers, and a list of members who have achieved each tier this month.

**Architecture:** Add a `monthly_challenge` settings key to Supabase, extend the existing data hook to load it, replace the GoalProgress weekly card with a monthly challenge card, and add tier-configuration UI to the AdminPanel settings tab.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Supabase JS client, Lucide React icons

## Global Constraints

- Primary Color: Vibrant Orange (`#FF6B00`) — use `brand-orange` Tailwind token
- Theme: Dark Mode (`#0B0C0E` background) — use `brand-darkBg` / `brand-darkSurface` tokens
- Font: Pretendard (already loaded in `index.html`)
- All type-only imports must use `import type` syntax (`verbatimModuleSyntax: true`)
- Every async form handler must have a `try-catch` with a Korean `alert` on failure
- Every task ends with `npm run build` verification and a `git commit`
- Work from: `C:\Users\home\github\orr-fit`

---

### Task 1: Types & DB Schema

**Files:**
- Modify: `src/types/index.ts`
- Modify: `supabase_schema.sql`

**Interfaces:**
- Produces:
  - `ChallengeTier { km: number; reward_days: number; }`
  - `MonthlyChallenge { tiers: ChallengeTier[]; }`
  - SQL INSERT for `monthly_challenge` settings key

- [ ] **Step 1: Add types to `src/types/index.ts`**

  Append after the last interface:
  ```ts
  export interface ChallengeTier {
    km: number;
    reward_days: number;
  }

  export interface MonthlyChallenge {
    tiers: ChallengeTier[];
  }
  ```

- [ ] **Step 2: Add initial settings INSERT to `supabase_schema.sql`**

  Locate the existing INSERT block near the bottom of the file:
  ```sql
  INSERT INTO settings (key, value) VALUES ('monthly_target', '{"distance": 2000}') ON CONFLICT (key) DO NOTHING;
  ```
  Add immediately after it:
  ```sql
  INSERT INTO settings (key, value) VALUES
    ('monthly_challenge', '{"tiers":[{"km":30,"reward_days":3},{"km":50,"reward_days":7},{"km":80,"reward_days":14}]}')
  ON CONFLICT (key) DO NOTHING;
  ```

  > **Note for existing deployments:** Run this INSERT manually in the Supabase SQL Editor if the `settings` table already exists.

- [ ] **Step 3: Verify build**
  Run:
  ```powershell
  npm run build
  ```
  Expected: `✓ built in` with 0 errors.

- [ ] **Step 4: Commit**
  Run:
  ```powershell
  git add src/types/index.ts supabase_schema.sql
  git commit -m "feat(types): add ChallengeTier and MonthlyChallenge types, add monthly_challenge schema"
  ```

---

### Task 2: Hook — Load Monthly Challenge from Supabase

**Files:**
- Modify: `src/hooks/useDashboardData.ts`

**Interfaces:**
- Consumes: `MonthlyChallenge` from `src/types/index.ts`
- Produces: `monthlyChallenge: MonthlyChallenge | null` exposed in hook return value

- [ ] **Step 1: Import MonthlyChallenge type**

  In `src/hooks/useDashboardData.ts`, update the types import line:
  ```ts
  import type { Member, Run, MonthlyChallenge } from '../types';
  ```

- [ ] **Step 2: Add monthlyChallenge state**

  After the existing state declarations (after `const [isLoading, setIsLoading] = useState<boolean>(true);`), add:
  ```ts
  const [monthlyChallenge, setMonthlyChallenge] = useState<MonthlyChallenge | null>(null);
  ```

- [ ] **Step 3: Fetch monthly_challenge in fetchData**

  Inside `fetchData`, find the existing `Promise.all` call. It currently fetches `settings` for `monthly_target` with `.maybeSingle()`. Add a second settings fetch alongside it:

  Replace the current `Promise.all` with:
  ```ts
  const [settingsResult, challengeResult, membersResult, runsResult] = await Promise.all([
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
      .select('*')
      .order('name', { ascending: true })
      .throwOnError(),
    supabase
      .from('runs')
      .select('*')
      .order('run_date', { ascending: false })
      .throwOnError()
  ]);
  ```

- [ ] **Step 4: Parse and set monthly challenge**

  After the existing `// Handle settings` block (the block that sets `monthlyTarget`), add:
  ```ts
  // Handle monthly challenge
  if (challengeResult.error) {
    console.warn('Error fetching monthly_challenge:', challengeResult.error);
  }
  if (challengeResult.data && challengeResult.data.value?.tiers) {
    setMonthlyChallenge({ tiers: challengeResult.data.value.tiers });
  } else {
    setMonthlyChallenge(null);
  }
  ```

- [ ] **Step 5: Expose monthlyChallenge in return**

  Update the return object at the bottom of the hook:
  ```ts
  return {
    members,
    runs,
    monthlyTarget,
    monthlyChallenge,
    isLoading,
    refetch: fetchData
  };
  ```

- [ ] **Step 6: Verify build**
  Run:
  ```powershell
  npm run build
  ```
  Expected: 0 errors.

- [ ] **Step 7: Commit**
  Run:
  ```powershell
  git add src/hooks/useDashboardData.ts
  git commit -m "feat(hook): load monthly_challenge from Supabase settings"
  ```

---

### Task 3: GoalProgress — Monthly Challenge Card

**Files:**
- Modify: `src/components/GoalProgress.tsx`

**Interfaces:**
- Consumes:
  - `currentDistance: number`
  - `targetDistance: number`
  - `monthlyChallenge: MonthlyChallenge | null` (NEW — replaces `weeklyChallengeCompleteCount`)
  - `members: Member[]` (NEW)
  - `runs: Run[]` (NEW)
- Produces: Updated JSX — monthly challenge card replacing weekly card. `weeklyChallengeCompleteCount` prop is removed.

- [ ] **Step 1: Rewrite `src/components/GoalProgress.tsx`**

  Replace the entire file content with:
  ```tsx
  import React from 'react';
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
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

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
                  className="stroke-brand-orange transition-all duration-1000 ease-out"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="block text-2xl font-black text-white">{percentage}%</span>
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
  ```

- [ ] **Step 2: Verify build**
  Run:
  ```powershell
  npm run build
  ```
  Expected: 0 errors. (App.tsx will have a prop error — that is expected and will be fixed in Task 4.)

- [ ] **Step 3: Commit**
  Run:
  ```powershell
  git add src/components/GoalProgress.tsx
  git commit -m "feat(ui): replace weekly challenge card with monthly challenge card"
  ```

---

### Task 4: AdminPanel — Challenge Tier Settings UI

**Files:**
- Modify: `src/components/AdminPanel.tsx`

**Interfaces:**
- Consumes:
  - `monthlyChallenge: MonthlyChallenge | null` (NEW prop)
  - `onUpdateChallenge: (tiers: ChallengeTier[]) => Promise<void>` (NEW prop)
- Produces: "월간 챌린지 단계 설정" section appended inside the existing `settings` tab form

- [ ] **Step 1: Update imports and props interface**

  In `src/components/AdminPanel.tsx`, update the import line:
  ```ts
  import type { Member, Run, ChallengeTier, MonthlyChallenge } from '../types';
  ```

  Update `AdminPanelProps` interface — add two new props:
  ```ts
  interface AdminPanelProps {
    members: Member[];
    runs: Run[];
    monthlyTarget: number;
    monthlyChallenge: MonthlyChallenge | null;          // NEW
    onAddMember: (name: string, gender: 'M' | 'F') => Promise<void>;
    onAddRun: (memberId: string, distance: number, duration: number, notes: string, date: string) => Promise<void>;
    onDeleteRun: (runId: string) => Promise<void>;
    onUpdateTarget: (target: number) => Promise<void>;
    onUpdateChallenge: (tiers: ChallengeTier[]) => Promise<void>;  // NEW
  }
  ```

  Update the destructuring in `export const AdminPanel: React.FC<AdminPanelProps> = ({` to include:
  ```ts
  export const AdminPanel: React.FC<AdminPanelProps> = ({
    members,
    runs,
    monthlyTarget,
    monthlyChallenge,
    onAddMember,
    onAddRun,
    onDeleteRun,
    onUpdateTarget,
    onUpdateChallenge,
  }) => {
  ```

- [ ] **Step 2: Add challenge tier local state**

  After the existing `const [targetDistanceInput, setTargetDistanceInput] = useState(monthlyTarget.toString());` line, add:
  ```ts
  // Challenge Tiers State
  const [challengeTiers, setChallengeTiers] = useState<ChallengeTier[]>(
    monthlyChallenge?.tiers ?? [{ km: 30, reward_days: 3 }, { km: 50, reward_days: 7 }, { km: 80, reward_days: 14 }]
  );
  ```

  After the existing `React.useEffect(() => { setTargetDistanceInput(...) }, [monthlyTarget]);` block, add:
  ```ts
  React.useEffect(() => {
    if (monthlyChallenge?.tiers) {
      setChallengeTiers(monthlyChallenge.tiers);
    }
  }, [monthlyChallenge]);
  ```

- [ ] **Step 3: Add handleChallengeSubmit**

  After the existing `handleTargetSubmit` function, add:
  ```ts
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
  ```

- [ ] **Step 4: Add challenge tier UI inside the settings tab**

  Locate the settings tab section (`{activeTab === 'settings' && (`). Inside the form, after the existing submit button for monthly target, add the challenge tiers section:

  The full settings tab should look like:
  ```tsx
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
  ```

  Also add `Trophy` to the lucide-react import line:
  ```ts
  import { Plus, Trash2, ShieldAlert, Award, Trophy } from 'lucide-react';
  ```

- [ ] **Step 5: Verify build**
  Run:
  ```powershell
  npm run build
  ```
  Expected: 0 errors. (App.tsx still missing new props — that's expected, fixed in Task 5.)

- [ ] **Step 6: Commit**
  Run:
  ```powershell
  git add src/components/AdminPanel.tsx
  git commit -m "feat(admin): add monthly challenge tier configuration UI"
  ```

---

### Task 5: App.tsx — Wire New Props & Mutator

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes:
  - `monthlyChallenge` from `useDashboardData` hook
  - `ChallengeTier` type from `src/types/index.ts`
- Produces:
  - `handleUpdateChallenge` mutator
  - Updated `<GoalProgress>` and `<AdminPanel>` JSX with new props
  - `getWeeklyChallengeCount` removed

- [ ] **Step 1: Update type import**

  In `src/App.tsx`, update the import line:
  ```ts
  import type { LeaderboardEntry, ChallengeTier } from './types';
  ```

- [ ] **Step 2: Destructure monthlyChallenge from hook**

  Update the hook destructuring:
  ```ts
  const { members, runs, monthlyTarget, monthlyChallenge, isLoading } = useDashboardData();
  ```

- [ ] **Step 3: Remove getWeeklyChallengeCount**

  Delete the entire `getWeeklyChallengeCount` function (the one starting with `// Compute Weekly Challenge Completers`).

- [ ] **Step 4: Add handleUpdateChallenge mutator**

  After the existing `handleUpdateTarget` function, add:
  ```ts
  // Mutator: Update Monthly Challenge Tiers
  const handleUpdateChallenge = async (tiers: ChallengeTier[]) => {
    await supabase
      .from('settings')
      .upsert([{ key: 'monthly_challenge', value: { tiers } }])
      .throwOnError();
  };
  ```

- [ ] **Step 5: Update GoalProgress JSX**

  Replace the existing `<GoalProgress ... />` usage:
  ```tsx
  <GoalProgress
    currentDistance={totalDistance}
    targetDistance={monthlyTarget}
    monthlyChallenge={monthlyChallenge}
    members={members}
    runs={runs}
  />
  ```

- [ ] **Step 6: Update AdminPanel JSX**

  Replace the existing `<AdminPanel ... />` usage:
  ```tsx
  <AdminPanel
    members={members}
    runs={runs}
    monthlyTarget={monthlyTarget}
    monthlyChallenge={monthlyChallenge}
    onAddMember={handleAddMember}
    onAddRun={handleAddRun}
    onDeleteRun={handleDeleteRun}
    onUpdateTarget={handleUpdateTarget}
    onUpdateChallenge={handleUpdateChallenge}
  />
  ```

- [ ] **Step 7: Verify build**
  Run:
  ```powershell
  npm run build
  ```
  Expected: `✓ built in` with 0 errors, 0 TypeScript errors.

- [ ] **Step 8: Commit**
  Run:
  ```powershell
  git add src/App.tsx
  git commit -m "feat(app): wire monthly challenge hook data and mutator to components"
  ```

---

### Task 6: Manual Supabase Setup & Smoke Test

**Files:** None (manual steps only)

- [ ] **Step 1: Run INSERT in Supabase SQL Editor**

  If the `settings` table already exists (existing deployment), run in Supabase SQL Editor:
  ```sql
  INSERT INTO settings (key, value) VALUES
    ('monthly_challenge', '{"tiers":[{"km":30,"reward_days":3},{"km":50,"reward_days":7},{"km":80,"reward_days":14}]}')
  ON CONFLICT (key) DO NOTHING;
  ```

- [ ] **Step 2: Start dev server and verify**
  Run:
  ```powershell
  npm run dev
  ```
  Open `http://localhost:5173` and confirm:
  - Left column shows `2026.06 월간 챌린지` header with `D-N` badge
  - Tier rewards list shows 3 tiers (30km/3일, 50km/7일, 80km/14일)
  - Any member with this month's runs totalling ≥ 30km appears in achievers list

- [ ] **Step 3: Verify admin panel challenge settings**
  - Click the admin button, enter passcode `0000`
  - Open **목표 설정** tab
  - Confirm challenge tier inputs are visible with correct defaults
  - Change a tier value and click **챌린지 업데이트** — verify success alert and realtime update in the left card
  - Add a new tier via **단계 추가** and confirm it saves correctly
  - Delete a tier and confirm it removes from the card

- [ ] **Step 4: Final production build**
  Run:
  ```powershell
  npm run build
  ```
  Expected: 0 errors, 0 warnings.
