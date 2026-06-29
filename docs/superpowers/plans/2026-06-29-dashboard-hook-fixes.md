# Dashboard Hook Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify `useDashboardData` to prevent loading flickers during real-time updates and handle Supabase database errors.

**Architecture:** Use `useRef` to track `members` and `runs` state values during renders, letting the `fetchData` callback check if they are empty without triggering re-subscriptions. Append `.throwOnError()` to Supabase fetches to propagate database errors to the `catch` block.

**Tech Stack:** React (hooks, refs), Supabase JS Client, TypeScript.

## Global Constraints

- Prevent loading screen/spinner flickers on background syncs.
- Propagate Supabase fetch errors to the catch block for logging.
- Verify compilation succeeds.
- Append fix report to `task-3-report.md`.

---

### Task 1: Update `src/hooks/useDashboardData.ts`

**Files:**
- Modify: `src/hooks/useDashboardData.ts`

- [ ] **Step 1: Implement useRef-based state tracking to prevent loading flickers**
- [ ] **Step 2: Append `.throwOnError()` (or check and throw `{ error }`) to Supabase queries**
- [ ] **Step 3: Save file and verify compilation**

### Task 2: Verify and Commit

- [ ] **Step 1: Run compilation check**
- [ ] **Step 2: Commit changes**
- [ ] **Step 3: Update `task-3-report.md`**
