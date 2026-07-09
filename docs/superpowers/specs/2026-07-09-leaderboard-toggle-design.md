# Leaderboard Time Filter Toggle Design

## Problem Statement
The current "이달의 Top 3" (This month's Top 3) and Leaderboard list are incorrectly using `totalDistance` (all-time cumulative distance) for ranking, which means users who haven't run this month are still showing up as #1. The user expects "이달의 Top 3" to reflect only the runs made in the current calendar month.

## Proposed Solution
Introduce a Segmented Control (pill-shaped toggle) in the Leaderboard header to switch between "이번 달" (This Month) and "전체 기간" (All Time). 

## UI / UX
- **Toggle Placement:** Next to or below the "Hall of Fame" / "이달의 Top 3" header in `Leaderboard.tsx`.
- **Style:** Pill-shaped segmented control with a sliding or highlighting effect (orange background) for the active state to fit the existing dark mode premium aesthetic.
- **Dynamic Headers:** 
  - When "이번 달" is selected: "이달의 Top 3"
  - When "전체 기간" is selected: "명예의 전당 Top 3" (or similar appropriate title)

## Data Flow & Architecture
1. **App.tsx (`getLeaderboardEntries`):**
   - Ensure that `currentMonthDistance` is correctly computed for all members based on `runs`. (Already present in code).
   - Currently, `LeaderboardEntry` type needs to include `currentMonthDistance`. 
2. **Types (`types.ts`):**
   - Add `currentMonthDistance: number` to `LeaderboardEntry` interface if it doesn't exist.
3. **Leaderboard.tsx State:**
   - Add a local state `const [timeFilter, setTimeFilter] = useState<'month' | 'all'>('month');`.
   - Before rendering the top 3 and list, sort the `entries` prop dynamically:
     ```tsx
     const sortedEntries = [...entries].sort((a, b) => {
       if (timeFilter === 'month') return b.currentMonthDistance - a.currentMonthDistance;
       return b.totalDistance - a.totalDistance;
     });
     ```
   - Use `sortedEntries` for both `topThree` extraction and `filteredEntries` rendering.

## Testing & Verification
- Verify that toggling between '이번 달' and '전체 기간' accurately recalculates rankings and updates the UI without page reload.
- Verify that users with 0km in the current month correctly drop in ranking when '이번 달' is selected.
- Verify that the total counts ("누적 거리" column) accurately reflect the selected filter context (i.e. show month's distance when on '이번 달', all-time distance when on '전체 기간').
