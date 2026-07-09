# Leaderboard Mobile Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stack nickname/medal and name/gender tag vertically on mobile screens in the Leaderboard to prevent layout breakage.

**Architecture:** Tailwind CSS flex-col layout.

**Tech Stack:** React, Tailwind CSS.

## Global Constraints
- Do not remove the medal or gender elements.
- The layout must remain horizontal on screens `>= sm`.

---

### Task 1: Update Table Cell Layout in Leaderboard

**Files:**
- Modify: `src/components/Leaderboard.tsx`

**Interfaces:**
- Consumes: `LeaderboardEntry`
- Produces: Responsive UI layout for leaderboard names.

- [ ] **Step 1: Write implementation**
Modify `src/components/Leaderboard.tsx`.
Currently, `renderNameTag` is used to display the name, nickname, and medal, while the gender tag is rendered next to it.
Replace the `renderNameTag` function and its usage in the table cell with a new layout structure:

Remove the `renderNameTag` function (around line 41).
In the table body (around line 258), replace the `div` inside `<td className="py-3">` with:
```tsx
<div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 text-left font-bold text-white group-hover/row:underline">
  <div className="flex items-center gap-1">
    {entry.nickname ? (
      <span className="text-brand-orange font-black break-keep">{entry.nickname}</span>
    ) : (
      <span className="font-bold text-white break-keep">{entry.name}</span>
    )}
    {getTierMedalEmoji(entry.highestChallengeTier)}
  </div>
  <div className="flex items-center gap-1 mt-0.5 sm:mt-0">
    {entry.nickname && (
      <span className="text-[10px] text-gray-500 font-normal whitespace-nowrap">({entry.name})</span>
    )}
    <span className={`text-[9px] px-1 rounded-md font-extrabold whitespace-nowrap ${entry.gender === 'M' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
      {entry.gender}
    </span>
  </div>
</div>
```

- [ ] **Step 2: Run linter/build to verify**
Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**
```bash
git add src/components/Leaderboard.tsx
git commit -m "ui: update leaderboard mobile layout to stack name and nickname"
```
