# Monthly Challenge Feature — Design Spec

**Date:** 2026-06-29  
**Project:** ORR-FIT Running Leaderboard  
**Author:** Antigravity

---

## Summary

Replace the existing "주간 미니 챌린지" card in `GoalProgress.tsx` with a **"월간 개인 챌린지"** card. Members can see the current month label, days remaining (D-12 countdown), tiered distance goals with fitness pass rewards, and a list of members who have already achieved each tier this month. Gym staff can configure the challenge tiers (km thresholds and reward days) from the admin panel.

---

## UI Design

### GoalProgress — 월간 챌린지 Card (replaces weekly card)

```
┌────────────────────────────────────┐
│  🏆  2026.06 월간 챌린지    D-2   │
│ ─────────────────────────────────  │
│  단계 보상                          │
│  🥉 30km  →  헬스권 3일            │
│  🥈 50km  →  헬스권 7일            │
│  🥇 80km  →  헬스권 14일           │
│ ─────────────────────────────────  │
│  이번 달 달성 회원                   │
│  🏆 박지민   80.2km  — 14일 획득   │
│  🥈 김철수   52.5km  — 7일 획득    │
│  🥉 이지혜   31.0km  — 3일 획득    │
└────────────────────────────────────┘
```

**Header:**
- Left: Month label formatted as `YYYY.MM` (e.g. `2026.06`)
- Right: Days remaining in current month as `D-N` (e.g. `D-2`)

**Tier display:** Static list of all configured tiers (bronze → gold), showing `km → 헬스권 N일`.

**Achievers list:** Only members who have reached at least the lowest tier this month. Sorted descending by total distance. Each row shows: member name, total km this month, highest tier achieved and its reward days. Members below the lowest tier are hidden.

---

## Data Model

### settings table — new key

```json
key: "monthly_challenge"
value: {
  "tiers": [
    { "km": 30, "reward_days": 3 },
    { "km": 50, "reward_days": 7 },
    { "km": 80, "reward_days": 14 }
  ]
}
```

Tiers are stored ascending by km. The app derives the highest achieved tier per member at runtime.

### Filtering logic (client-side)

For the achievers list:
1. Filter `runs` to the **current calendar month** (same year + month as today).
2. Sum `distance` per `member_id`.
3. For each member, find the **highest** tier where `totalKm >= tier.km`.
4. Keep only members who matched at least one tier.
5. Sort descending by `totalKm`.

---

## TypeScript Types

```ts
// src/types/index.ts — additions
export interface ChallengeTier {
  km: number;
  reward_days: number;
}

export interface MonthlyChallenge {
  tiers: ChallengeTier[];
}
```

---

## Hook Changes — useDashboardData.ts

- Add `monthlyChallenge` state (`MonthlyChallenge | null`, default `null`).
- In `fetchData`, read `settings` key `"monthly_challenge"` alongside existing `monthly_target` fetch.
- Parse `value.tiers` and call `setMonthlyChallenge(...)`.
- Expose `monthlyChallenge` in the return object.
- Realtime channel already subscribes to `settings` table — no additional subscription needed.

---

## Component Changes

### GoalProgress.tsx

**New props:**
```ts
interface GoalProgressProps {
  currentDistance: number;      // unchanged
  targetDistance: number;       // unchanged
  monthlyChallenge: MonthlyChallenge | null;  // NEW (replaces weeklyChallengeCompleteCount)
  members: Member[];            // NEW
  runs: Run[];                  // NEW
}
```

`weeklyChallengeCompleteCount` prop is **removed**.

**New internal logic:**
- `monthLabel`: `new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' })` → formatted as `2026.06`.
- `daysRemaining`: last day of month minus today.
- `achievers`: computed from `runs` filtered to current month, summed per member, matched to highest tier.

### AdminPanel.tsx

**New props:**
```ts
onUpdateChallenge: (tiers: ChallengeTier[]) => Promise<void>;  // NEW
monthlyChallenge: MonthlyChallenge | null;                     // NEW
```

**Settings tab additions:**
- Section titled "월간 챌린지 단계 설정" below the existing monthly target form.
- Local state: `challengeTiers: ChallengeTier[]` (initialized from prop, synced via `useEffect`).
- UI: rows of `[km input] km → 헬스권 [days input] 일` with a `🗑️` delete button per row.
- `+ 단계 추가` button appends `{ km: 0, reward_days: 0 }`.
- Submit button `챌린지 업데이트` calls `onUpdateChallenge(challengeTiers)`.
- Validation: tiers must have `km > 0` and `reward_days > 0` before submitting. Sort ascending by km before saving.
- `try-catch` with Korean error alert on failure (consistent with existing handlers).

### App.tsx

**New mutator:**
```ts
const handleUpdateChallenge = async (tiers: ChallengeTier[]) => {
  await supabase
    .from('settings')
    .upsert([{ key: 'monthly_challenge', value: { tiers } }])
    .throwOnError();
};
```

**Props wiring:**
- `GoalProgress`: add `monthlyChallenge`, `members`, `runs`; remove `weeklyChallengeCompleteCount`.
- `AdminPanel`: add `monthlyChallenge`, `onUpdateChallenge`.
- Remove `getWeeklyChallengeCount()` function from App.tsx (no longer used).

---

## SQL — supabase_schema.sql

Add initial `monthly_challenge` setting to the INSERT block:

```sql
INSERT INTO settings (key, value) VALUES
  ('monthly_challenge', '{"tiers":[{"km":30,"reward_days":3},{"km":50,"reward_days":7},{"km":80,"reward_days":14}]}')
ON CONFLICT (key) DO NOTHING;
```

> **Note:** Existing deployments will need to run this INSERT manually in the SQL Editor if the table already exists. The schema file comment will note this.

---

## Error Handling

- If `monthlyChallenge` is `null` (settings not yet loaded or key missing), the challenge card renders a placeholder "챌린지 설정을 불러오는 중..." state.
- Tier inputs with `km=0` or `reward_days=0` are rejected with inline validation before submit.

---

## Out of Scope

- Push notifications for tier achievement.
- Historical month data (only current calendar month shown).
- Per-member opt-out from challenge.
