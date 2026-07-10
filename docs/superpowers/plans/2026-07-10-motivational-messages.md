# Personalized Motivational Messages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the `getMotivationalMessage` logic in `MemberDetailModal` to dynamically build and randomly select personalized messages based on total distance, workout preferences, rankings, and monthly progress, featuring "부산" and "멋짐".

**Architecture:** Use `React.useMemo` to stabilize the random message selection so it doesn't flicker on tab changes.

**Tech Stack:** React, TypeScript.

## Global Constraints
- Must use `React.useMemo` for random selection.
- All predefined phrases including "멋짐" and "부산" from the spec must be implemented accurately.

---

### Task 1: Update Motivational Message Logic

**Files:**
- Modify: `src/components/MemberDetailModal.tsx`

**Interfaces:**
- Consumes: `memberRuns`, `stats`, `rank`, `isMaxTierReached`, `distanceRemaining`, `currentMonthRuns.length`, `totalDistance`.
- Produces: `motivationalMessage` string.

- [ ] **Step 1: Write implementation**
Modify `src/components/MemberDetailModal.tsx`. 
Locate the existing `getMotivationalMessage` function and the line `const motivationalMessage = getMotivationalMessage();`. Replace them with a `useMemo` hook that evaluates the conditions and returns a random message.

```typescript
  // Generate personalized motivational message
  const motivationalMessage = React.useMemo(() => {
    const candidates: string[] = [];

    // A. Milestones
    if (totalDistance >= 500) candidates.push("총 누적 500km 돌파! 부산에서 서울까지 완주한 당신, 멋짐 그 자체입니다 🚀");
    else if (totalDistance >= 100) candidates.push("와! 총 누적 거리 100km 돌파! 부산에서 경주까지 달려가신 셈이네요 🗺️ 멋짐 최고!");

    // B. Workout Preferences
    let preferredWorkout = '';
    let maxCount = 0;
    Object.entries(stats).forEach(([key, stat]) => {
      if (stat.count > maxCount) {
        maxCount = stat.count;
        preferredWorkout = key;
      }
    });

    if (maxCount > 0) {
      if (preferredWorkout === 'outdoor') candidates.push("야외 러닝을 가장 좋아하시네요! 오늘도 부산의 시원한 바람맞으며 달려볼까요? 🍃");
      else if (preferredWorkout === 'stairmaster') candidates.push("천국의 계단 마스터! 멋짐에서 독보적인 하체 근력을 뽐내고 계시네요 💪");
      else if (preferredWorkout === 'cycling') candidates.push("실내 사이클 매니아! 묵묵히 페달을 밟는 당신의 열정, 정말 멋짐! 🚴‍♂️");
      else if (preferredWorkout === 'treadmill') candidates.push("트레드밀의 제왕! 멋짐 안에서 비가 오나 눈이 오나 꾸준히 달리는 모습 최고예요 🏃‍♂️");
      else if (preferredWorkout === 'orr_run') candidates.push("ORR RUN 단골손님! 함께 달리는 즐거움을 아는 당신이 진짜 일류입니다 🎉");
    }

    // C. Ranking
    if (rank === 1) candidates.push("현재 부동의 1위! 멋짐의 레이스킹 자리를 굳건히 지켜주세요 👑");
    else if (rank === 2 || rank === 3) candidates.push(`현재 ${rank}위! 1위 탈환이 코앞입니다. 멋짐에서 조금만 더 속도를 내볼까요? ⚡`);
    else if (rank === 4 || rank === 5) candidates.push(`현재 ${rank}위! 순위권(TOP 3) 진입을 위해 멋짐에서 조금만 더 파이팅! 🚀`);
    else if (rank > 5 && rank <= 10) candidates.push("Top 5 진입을 향해! 이번 주말에 멋짐에서 땀 한 번 쫙 빼보는 건 어떨까요? 🔥");

    // D. Monthly Activity
    if (currentMonthRuns.length === 0) candidates.push("아직 이번 달 첫 인증을 하지 않으셨네요! 오늘부터 멋짐에서 가볍게 시작해볼까요? 🌱");
    else if (currentMonthRuns.length === 1) candidates.push("첫 인증!! 시작이 반입니다, 멋짐과 함께 조금 더 화이팅이에요! 🔥");
    else if (currentMonthRuns.length >= 5) candidates.push(`이번 달 벌써 ${currentMonthRuns.length}회나 달렸네요! 멋짐이 인정하는 꾸준함의 대명사 👍`);
    
    if (isMaxTierReached) candidates.push("이번 달 최고 목표 달성 완료! 당신의 멈추지 않는 열정에 멋짐이 박수를 보냅니다 🎉");
    else if (distanceRemaining > 0 && distanceRemaining <= 5) candidates.push(`다음 챌린지 목표까지 단 ${distanceRemaining.toFixed(1)}km! 멋짐과 함께 가보자고! 💪`);

    // E. Default Fallback
    if (candidates.length === 0) {
      candidates.push("오늘도 멋짐과 함께 신나게 달려볼까요? 🏃");
    }

    // Random selection
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, [member.id, currentMonthRuns.length, totalDistance, rank, isMaxTierReached, distanceRemaining]);
```

- [ ] **Step 2: Run linter/build to verify**
Run: `npm run build`
Expected: build succeeds without errors.

- [ ] **Step 3: Commit**
```bash
git add src/components/MemberDetailModal.tsx
git commit -m "feat: add personalized motivational messages with mutjim and busan context"
```
