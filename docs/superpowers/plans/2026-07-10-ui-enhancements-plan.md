# UI Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Hall of Fame" modal for last month's health pass winners and an animated border for the user's preferred workout in the personal record modal.

**Architecture:** Create `HallOfFameModal.tsx` and integrate it into `App.tsx` and `Header.tsx`. Modify `MemberDetailModal.tsx` to conditionally apply a CSS animated border.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React

## Global Constraints
- Target App: Vite + React + TypeScript + Tailwind
- No automated test framework is installed; verify via `npm run build` and `npm run lint`.

---

### Task 1: Create `HallOfFameModal.tsx` Component

**Files:**
- Create: `src/components/HallOfFameModal.tsx`

**Interfaces:**
- Consumes: `Member`, `Run`, `MonthlyChallenge` from `src/types/index.ts`
- Produces: `HallOfFameModal` functional component

- [ ] **Step 1: Write the minimal implementation**

Create the file `src/components/HallOfFameModal.tsx` with the logic to calculate the previous month's string, filter runs, calculate distances, and determine winners who reached the minimum tier. It will render a modal similar to `MemberDetailModal`.

- [ ] **Step 2: Run verification**

Run: `npm run lint && npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/HallOfFameModal.tsx
git commit -m "feat: add HallOfFameModal component"
```

### Task 2: Integrate Hall of Fame Modal into App

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `HallOfFameModal` component

- [ ] **Step 1: Write the minimal implementation**

In `App.tsx`, add state `showHallOfFame`. Pass it to a button placed near the Goal Progress or Header. Render the `<HallOfFameModal>` when true.

- [ ] **Step 2: Run verification**

Run: `npm run lint && npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate HallOfFameModal into dashboard"
```

### Task 3: Add Animated Border to Preferred Workout

**Files:**
- Modify: `src/components/MemberDetailModal.tsx`

**Interfaces:**
- Consumes: Existing `MemberDetailModal` logic

- [ ] **Step 1: Write the minimal implementation**

In `src/components/MemberDetailModal.tsx`, locate the Activity Grid cards. If the card's activity matches `preferredWorkout`, add a glowing, animated border using Tailwind classes (e.g., `ring-2 ring-brand-orange animate-pulse` or a custom gradient spin).

- [ ] **Step 2: Run verification**

Run: `npm run lint && npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/MemberDetailModal.tsx
git commit -m "style: add animated border to preferred workout in MemberDetailModal"
```
