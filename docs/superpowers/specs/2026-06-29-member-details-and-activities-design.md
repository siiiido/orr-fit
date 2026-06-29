# Member Details & Activities Classification — Design Spec

**Date:** 2026-06-29  
**Project:** ORR-FIT Running Leaderboard  
**Author:** Antigravity

---

## 1. Goal

Enhance the running leaderboard with:
1. Member nicknames (up to 10 characters), displayed more prominently than real names.
2. Workout classification (트레드밀/Treadmill, 야외러닝/Outdoor Running, 천국의계단/Stairmaster, 싸이클/Cycling).
3. Auto-conversion of duration into distance for Stairmaster and Cycling (10 minutes = 1 km).
4. Interactive Member Detail Modal showing last certification date and workout breakdown by type.
5. Monthly challenge tier medals (🥇, 🥈, 🥉) displayed next to names in the leaderboard list.

---

## 2. Data Model & Migration

### Database Changes
Apply the following alter table queries to the Supabase database:

```sql
-- 1. Add nickname to members table
ALTER TABLE members ADD COLUMN nickname VARCHAR(10);

-- 2. Add workout type to runs table
ALTER TABLE runs ADD COLUMN type VARCHAR(20) DEFAULT 'outdoor' NOT NULL;
```

### TypeScript Type Adjustments (`src/types/index.ts`)
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

export interface LeaderboardEntry {
  memberId: string;
  name: string;
  nickname?: string; // NEW
  gender: 'M' | 'F';
  totalDistance: number;
  totalRuns: number;
  averagePace: string;
  totalDuration: number;
  lastRunDate: string;
  highestChallengeTier?: string; // NEW ('gold' | 'silver' | 'bronze' | null)
}
```

---

## 3. UI Design & Formatting Rules

### Name & Nickname Display
Wherever a name is shown (Podium, Leaderboard, Recent Activity, Admin Panel):
- If `nickname` exists: Display the **Nickname** first in bold, vibrant orange color (`text-brand-orange font-black`), followed by the real name in muted gray brackets `(RealName)` (e.g., **연지동 킹왕짱** <span class="text-xs text-gray-500 font-normal">(김철수)</span>).
- If `nickname` does not exist: Fall back to showing only the **Real Name** prominently.

### Leaderboard Medals
Calculate each member's highest achieved challenge tier for the current month. If they have achieved any tier, display the corresponding emoji badge next to their name:
- Gold Tier: 🥇
- Silver Tier: 🥈
- Bronze Tier: 🥉

### Member Detail Modal (`src/components/MemberDetailModal.tsx`)
A popup modal triggered when clicking a member's name in the leaderboard or podium.
- **Header**: Large Nickname (if exists) and Real Name.
- **Metadata**: Display `"최근 인증일: YYYY-MM-DD"` based on their latest run log date. If no logs exist, show `"최근 인증일: 없음"`.
- **Content Grid**: Visual cards or rows for each of the four categories (`트레드밀`, `야외러닝`, `천국의계단`, `싸이클`).
  - For Treadmill and Outdoor: Show total km, total minutes, workout count, and average pace (formatted as `MM'SS"`).
  - For Stairmaster and Cycling: Show total minutes, workout count, and converted distance (`minutes / 10` km). Do not show pace.

---

## 4. Admin Panel Enhancements

### New Member Form
- Input field added for "닉네임 (최대 10자)" (optional).
- Max length restriction: `maxLength={10}`.

### Workout Log Form
- Dropdown select field added: "운동 종류" (`야외러닝` | `트레드밀` | `천국의계단` | `싸이클`).
- If `천국의계단` or `싸이클` is selected:
  - Hide or disable the "러닝 거리 (km)" input.
  - The "운동 시간 (분/초)" inputs change behavior: only "분" is required.
  - When submitting, automatically calculate distance as `durationMinutes / 10` and duration in seconds as `durationMinutes * 60`.

### History Log Form
- Display the workout type badge (`야외러닝`, `트레드밀`, `천국의계단`, `싸이클`) next to the log entry in the history list.

---

## 5. Calculations & Integration

### Hook Changes (`src/hooks/useDashboardData.ts`)
- In `fetchData`, update mapping of `runs` to parse `type` correctly.
- Add `type` mapping support.

### Leaderboard Entries Generation (`src/App.tsx`)
- Keep existing cumulative distance logic because `distance = minutes / 10` is automatically pre-calculated on insert for Stairmaster/Cycling.
- Compute `highestChallengeTier` by checking current month runs total distance against `monthlyChallenge.tiers`. Expose this in `LeaderboardEntry`.
