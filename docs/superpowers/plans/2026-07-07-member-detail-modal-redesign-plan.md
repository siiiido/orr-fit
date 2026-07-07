# Member Detail Modal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the member detail modal to include an animated progress bar towards the next monthly challenge target, and display activities (including a new 'orr_run' type) in a visually distinct grid.

**Architecture:** Update TypeScript types to support the new activity type, then refactor `MemberDetailModal.tsx` to compute current month distances and target gaps. We will use CSS transitions or inline styles for the progress bar animation, and a CSS grid layout for the activity tiles.

**Tech Stack:** React, Tailwind CSS, TypeScript

## Global Constraints

- No testing framework is currently configured; rely on type checking (`tsc -b`) and linter (`npm run lint`).
- UI styling must match the dark/brand-orange theme used in the rest of the application.
- The `Run` type update must ensure backwards compatibility with existing run records (handled gracefully if missing).

---

### Task 1: Update TypeScript Definitions

**Files:**
- Modify: `c:\Users\home\github\orr-fit\src\types\index.ts`

**Interfaces:**
- Produces: Updated `Run` interface with `'orr_run'` type.

- [ ] **Step 1: Update the Run type**

Modify `src/types/index.ts` to add `'orr_run'` to the `type` union in the `Run` interface.

```typescript
// Replace:
// type: 'treadmill' | 'outdoor' | 'stairmaster' | 'cycling';
// With:
// type: 'treadmill' | 'outdoor' | 'stairmaster' | 'cycling' | 'orr_run';
```

- [ ] **Step 2: Verify types**

Run: `npm run build`
Expected: Passes without new type errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "types: add orr_run to Run activity types"
```

---

### Task 2: Calculate Challenge Progress

**Files:**
- Modify: `c:\Users\home\github\orr-fit\src\components\MemberDetailModal.tsx`

**Interfaces:**
- Consumes: Updated `Run` interface, `MonthlyChallenge` from `src/types/index.ts`

- [ ] **Step 1: Implement distance calculations**

Modify the top of the `MemberDetailModal` component body (around line 20) to calculate `currentMonthDistance` and find the next challenge target. Add state for the progress bar animation.

```tsx
  // Inside MemberDetailModal component:
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
  
  // Animation state
  const [animatedProgress, setAnimatedProgress] = React.useState(0);
  React.useEffect(() => {
    // Small delay to ensure the DOM is ready and the transition triggers
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercent);
    }, 100);
    return () => clearTimeout(timer);
  }, [progressPercent]);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MemberDetailModal.tsx
git commit -m "feat: calculate monthly progress and next challenge target"
```

---

### Task 3: Render Progress Bar & Activity Grid

**Files:**
- Modify: `c:\Users\home\github\orr-fit\src\components\MemberDetailModal.tsx`
- Modify: `c:\Users\home\github\orr-fit\src\index.css`

**Interfaces:**
- Consumes: Calculations from Task 2, `stats` object containing `orr_run`.

- [ ] **Step 1: Update stats collection**

Ensure `stats` object tracks `orr_run` and other activities properly.

```tsx
  const stats = {
    outdoor: { distance: 0, duration: 0, count: 0 },
    treadmill: { distance: 0, duration: 0, count: 0 },
    stairmaster: { duration: 0, count: 0 },
    cycling: { duration: 0, count: 0 },
    orr_run: { distance: 0, duration: 0, count: 0 }, // Add this
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
    } else if (r.type === 'orr_run') { // Add this
      stats.orr_run.distance += r.distance;
      stats.orr_run.duration += r.duration;
      stats.orr_run.count += 1;
    }
  });
```

- [ ] **Step 2: Render Progress Bar UI**

Replace the top section of the modal's return statement (below the header) with the new progress bar and grid layout.

```tsx
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
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-brand-darkBg p-3 rounded-xl border border-gray-800 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1">야외 러닝</span>
              <span className="text-lg font-bold text-white">{stats.outdoor.distance.toFixed(1)} km</span>
              <span className="text-[10px] text-gray-500">{stats.outdoor.count}회</span>
            </div>
            
            <div className="bg-gradient-to-br from-brand-orange/20 to-orange-600/10 p-3 rounded-xl border border-brand-orange/30 flex flex-col items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="text-xs text-brand-orange font-bold mb-1">ORR RUN 🔥</span>
              <span className="text-lg font-bold text-white">{stats.orr_run.distance.toFixed(1)} km</span>
              <span className="text-[10px] text-gray-400">{stats.orr_run.count}회</span>
            </div>

            <div className="bg-brand-darkBg p-3 rounded-xl border border-gray-800 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1">트레드밀</span>
              <span className="text-lg font-bold text-white">{stats.treadmill.distance.toFixed(1)} km</span>
              <span className="text-[10px] text-gray-500">{stats.treadmill.count}회</span>
            </div>

            <div className="bg-brand-darkBg p-3 rounded-xl border border-gray-800 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1">기타 (머신/사이클)</span>
              <span className="text-lg font-bold text-white">
                {Math.floor((stats.stairmaster.duration + stats.cycling.duration) / 60)} 분
              </span>
              <span className="text-[10px] text-gray-500">
                {stats.stairmaster.count + stats.cycling.count}회
              </span>
            </div>
          </div>
```

- [ ] **Step 3: Add shimmer animation**

Ensure `index.css` supports the shimmer animation if used above. Add the keyframes to `c:\Users\home\github\orr-fit\src\index.css`.

```css
/* In index.css */
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
```

- [ ] **Step 4: Verify**

Run `npm run lint` and `npm run build` to verify no syntax errors.
Verify the UI visually using `npm run dev`.

- [ ] **Step 5: Commit**

```bash
git add src/components/MemberDetailModal.tsx src/index.css
git commit -m "feat: render animated progress bar and activity grid"
```
