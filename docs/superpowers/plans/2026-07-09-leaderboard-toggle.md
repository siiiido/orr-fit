# Leaderboard Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a segmented control toggle to switch between "이번 달" (This Month) and "전체 기간" (All Time) on the leaderboard.

**Architecture:** We will extend the `LeaderboardEntry` type to include `currentMonthDistance`, populate it in `App.tsx`, and add a local state in `Leaderboard.tsx` to control sorting and header display.

**Tech Stack:** React, TypeScript, Tailwind CSS

## Global Constraints
- Do not remove existing logic; only extend it.
- Use existing Tailwind colors (`text-brand-orange`, `bg-brand-orange`).
- Ensure no type errors after changes.

---

### Task 1: Update Types

**Files:**
- Modify: `src/types.ts`

**Interfaces:**
- Consumes: Existing `LeaderboardEntry` interface
- Produces: `LeaderboardEntry` with `currentMonthDistance`

- [ ] **Step 1: Write the failing test**
*Skipped because this is just a type definition update.*

- [ ] **Step 2: Write minimal implementation**
```typescript
// Add to LeaderboardEntry interface in src/types.ts:
  currentMonthDistance: number;
```

- [ ] **Step 3: Commit**
```bash
git add src/types.ts
git commit -m "types: add currentMonthDistance to LeaderboardEntry"
```

---

### Task 2: Populate currentMonthDistance in App

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `memberMap` which already calculates `currentMonthDistance`.
- Produces: Properly populated `currentMonthDistance` in the return value of `getLeaderboardEntries`.

- [ ] **Step 1: Write minimal implementation**
```typescript
// In src/App.tsx, inside getLeaderboardEntries -> entries.map -> return statement:
      return {
        memberId: m.id,
        name: m.name,
        nickname: m.nickname,
        gender: m.gender,
        totalDistance: data.totalDistance,
        currentMonthDistance: data.currentMonthDistance, // Add this line
        totalRuns: data.totalRuns,
        averagePace,
        totalDuration: data.totalDuration,
        lastRunDate: data.lastRunDate,
        highestChallengeTier,
      };
```

- [ ] **Step 2: Run type check to verify**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**
```bash
git add src/App.tsx
git commit -m "feat: populate currentMonthDistance in leaderboard entries"
```

---

### Task 3: Add Segmented Control to Leaderboard

**Files:**
- Modify: `src/components/Leaderboard.tsx`

**Interfaces:**
- Consumes: `LeaderboardEntry[]` with `currentMonthDistance`

- [ ] **Step 1: Write minimal implementation**
```tsx
// 1. Add timeFilter state at the top of Leaderboard component
  const [timeFilter, setTimeFilter] = useState<'month' | 'all'>('month');

// 2. Add sorting logic before filteredEntries:
  const sortedEntries = [...entries].sort((a, b) => {
    if (timeFilter === 'month') return b.currentMonthDistance - a.currentMonthDistance;
    return b.totalDistance - a.totalDistance;
  });

// 3. Update filteredEntries and topThree to use sortedEntries:
  const filteredEntries = sortedEntries.filter((entry) => {
    const search = searchQuery.trim().toLowerCase();
    const matchName = entry.name.toLowerCase().includes(search);
    const matchNick = entry.nickname?.toLowerCase().includes(search) || false;
    return matchName || matchNick;
  });
  const topThree = sortedEntries.slice(0, 3); // Changed from entries.slice(0, 3)

// 4. Update the header title and add the toggle:
// Replace the <h3> inside the Header section with:
            <h3 className="text-lg font-black text-white leading-none">
              {timeFilter === 'month' ? '이달의 ' : '명예의 전당 '}
              <span className="text-brand-orange">Top 3</span>
            </h3>
            
// 5. Add the segmented control right below the <p> 누적 거리 기준 월간 상위 랭커 </p> (which should also be updated or placed beside it):
            <div className="flex bg-gray-900 rounded-full p-1 mt-3 w-fit border border-gray-800">
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                  timeFilter === 'month' 
                    ? 'bg-gradient-to-r from-brand-orange to-yellow-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                이번 달
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                  timeFilter === 'all' 
                    ? 'bg-gradient-to-r from-brand-orange to-yellow-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                전체 기간
              </button>
            </div>

// 6. Update the table "누적 거리" display to show the appropriate distance:
// Inside the table rendering:
                    <td className="py-3 text-right text-brand-orange font-black text-sm">
                      {(timeFilter === 'month' ? entry.currentMonthDistance : entry.totalDistance).toFixed(1)} km
                    </td>
```

- [ ] **Step 2: Run type check to verify**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**
```bash
git add src/components/Leaderboard.tsx
git commit -m "feat: add segmented control for leaderboard time filter"
```
