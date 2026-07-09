# Orr Run Modal White Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dark mode classes from OrrRunModal to ensure it always renders in white (light) mode.

**Architecture:** Tailwind CSS class removal.

**Tech Stack:** React, Tailwind CSS.

## Global Constraints
- Only modify Tailwind utility classes in the specified file.

---

### Task 1: Update OrrRunModal component

**Files:**
- Modify: `src/components/OrrRunModal.tsx`

**Interfaces:**
- Consumes: N/A
- Produces: UI component matching original light theme.

- [ ] **Step 1: Write implementation**
Modify `src/components/OrrRunModal.tsx` to remove all `dark:` prefixed utility classes. Specifically:
- `dark:bg-neutral-900`
- `dark:bg-indigo-900/50`
- `dark:text-indigo-300`
- `dark:bg-emerald-900/50`
- `dark:text-emerald-300`
- `dark:text-white`
- `dark:text-gray-300`
- `dark:bg-neutral-800/50`
- `dark:text-neutral-300`
- `dark:bg-orange-900/30`
- `dark:bg-orange-900/50`
- `dark:text-orange-400`
- `dark:text-neutral-400`
- `dark:bg-sky-900/30`
- `dark:bg-sky-900/50`
- `dark:text-sky-400`

- [ ] **Step 2: Run linter/build to verify**
Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**
```bash
git add src/components/OrrRunModal.tsx
git commit -m "style: remove dark mode classes from OrrRunModal"
```
