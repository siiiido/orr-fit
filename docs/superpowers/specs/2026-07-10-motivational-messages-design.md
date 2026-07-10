# Motivational Messages Design Spec

## 1. Overview
Update the `getMotivationalMessage` logic in `MemberDetailModal.tsx` to provide rich, personalized, and diverse motivational messages. The messages will incorporate the user's ranking, total distance milestones, and preferred workout types. We will also incorporate the gym name "멋짐" (Mutjim) and use "부산" (Busan) for distance analogies.

## 2. Dynamic Message Pool
Instead of returning the first matching string, the system will evaluate multiple conditions, build an array of applicable messages, and randomly select one to display. This ensures the user sees varied messages each time they open the modal.

### Conditions and Messages

**A. Milestones (총 누적 거리 기반)**
- `totalDistance >= 500`: "총 누적 500km 돌파! 부산에서 서울까지 완주한 당신, 멋짐 그 자체입니다 🚀"
- `totalDistance >= 100`: "와! 총 누적 거리 100km 돌파! 부산에서 경주까지 달려가신 셈이네요 🗺️ 멋짐 최고!"

**B. Workout Preferences (선호 종목 기반)**
(Determine the workout type with the highest count `> 0`)
- `outdoor`: "야외 러닝을 가장 좋아하시네요! 오늘도 부산의 시원한 바람맞으며 달려볼까요? 🍃"
- `stairmaster`: "천국의 계단 마스터! 멋짐에서 독보적인 하체 근력을 뽐내고 계시네요 💪"
- `cycling`: "실내 사이클 매니아! 묵묵히 페달을 밟는 당신의 열정, 정말 멋짐! 🚴‍♂️"
- `treadmill`: "트레드밀의 제왕! 멋짐 안에서 비가 오나 눈이 오나 꾸준히 달리는 모습 최고예요 🏃‍♂️"
- `orr_run`: "ORR RUN 단골손님! 함께 달리는 즐거움을 아는 당신이 진짜 일류입니다 🎉"

**C. Ranking (순위 기반)**
- `rank === 1`: "현재 부동의 1위! 멋짐의 레이스킹 자리를 굳건히 지켜주세요 👑"
- `rank === 2 || rank === 3`: "현재 ${rank}위! 1위 탈환이 코앞입니다. 멋짐에서 조금만 더 속도를 내볼까요? ⚡"
- `rank === 4 || rank === 5`: "현재 ${rank}위! 순위권(TOP 3) 진입을 위해 멋짐에서 조금만 더 파이팅! 🚀"
- `rank > 5 && rank <= 10`: "Top 5 진입을 향해! 이번 주말에 멋짐에서 땀 한 번 쫙 빼보는 건 어떨까요? 🔥"

**D. Monthly Activity (월간 활동 기반)**
- `currentMonthRuns.length === 0`: "아직 이번 달 첫 인증을 하지 않으셨네요! 오늘부터 멋짐에서 가볍게 시작해볼까요? 🌱"
- `currentMonthRuns.length === 1`: "첫 인증!! 시작이 반입니다, 멋짐과 함께 조금 더 화이팅이에요! 🔥"
- `currentMonthRuns.length >= 5`: "이번 달 벌써 ${currentMonthRuns.length}회나 달렸네요! 멋짐이 인정하는 꾸준함의 대명사 👍"
- `isMaxTierReached`: "이번 달 최고 목표 달성 완료! 당신의 멈추지 않는 열정에 멋짐이 박수를 보냅니다 🎉"
- `distanceRemaining > 0 && distanceRemaining <= 5`: "다음 챌린지 목표까지 단 ${distanceRemaining.toFixed(1)}km! 멋짐과 함께 가보자고! 💪"

**E. Default Fallback**
- "오늘도 멋짐과 함께 신나게 달려볼까요? 🏃"

## 3. Implementation Details
- Add logic to find the `preferredWorkout` from the `stats` object.
- Push all matching strings into a `candidateMessages` array.
- Use `React.useMemo` to pick a random message from the array. The dependency array will be `[member.id, runs.length]` to ensure the message remains stable while the user switches tabs (preventing UI flickering), but updates if they log a new run.

## 4. Verification Plan
- Open the member detail modal for various users.
- Verify that messages related to "멋짐" and "부산" are correctly rendered.
- Check that the text does not flicker or randomly change when toggling between the 'Summary' and 'History' tabs.
