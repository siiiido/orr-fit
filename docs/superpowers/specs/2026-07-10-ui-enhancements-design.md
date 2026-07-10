# ORR-FIT UI Enhancements Design Spec

## 1. Overview
This design spec outlines the implementation of two UI enhancements for the ORR-FIT dashboard:
1. **Hall of Fame (명예의 전당) Modal**: A dedicated UI to view the previous month's health pass winners.
2. **Preferred Workout Highlight**: An interactive animated border highlighting the most frequently performed workout type in the user's personal record modal.

## 2. Feature 1: Hall of Fame (Previous Month's Winners) Modal
### Architecture & Components
- **New Component (`HallOfFameModal.tsx`)**: A standalone modal component displaying last month's achievers.
- **Trigger Button**: A "🏆 지난달 획득자" (Last Month Winners) button integrated into the `Header` or main dashboard view (next to `GoalProgress`).
- **Data Logic (in `App.tsx` or inside Modal)**:
  - Calculate the previous month string (e.g., `2026-06`).
  - Filter the `runs` dataset for the previous month.
  - Aggregate total distance per `member`.
  - Compare the aggregated distances against `monthlyChallenge.tiers` to determine who earned a health pass (i.e., reached at least the bronze tier).
  - Sort the winners by distance descending.

### UI & Styling
- **Modal Design**: Follows the existing dark UI theme with `brand-darkSurface` and `brand-orange` accents.
- **Visuals**: 
  - A celebratory header.
  - Top 3 winners can be highlighted with 🥇🥈🥉 medals.
  - A clean list format for all achievers.

## 3. Feature 2: Preferred Workout Highlight
### Architecture & Components
- **Target Component**: `MemberDetailModal.tsx`
- **Logic Validation**: The component already calculates `preferredWorkout` by finding the activity with the highest `count`.

### UI & Styling
- **Animated Border Effect**: We will create a highly interactive, premium "rotating gradient border" effect for the winning activity card.
- **Implementation Approach**:
  - Add conditional Tailwind CSS classes to the activity card that matches `preferredWorkout`.
  - Use an inner container and a spinning background gradient (`animate-spin` on a pseudo-element or absolute div) to create the glowing border effect.
  - Apply a subtle scale-up effect (`scale-105`) and drop-shadow to make it pop out of the grid.

## 4. Error Handling & Edge Cases
- **No Winners Last Month**: If no one reached the required tier last month, the modal will display a friendly empty state message (e.g., "지난달에는 달성자가 없었습니다. 이번 달의 주인공이 되어보세요!").
- **Tied Workouts**: If a user has a tie for `preferredWorkout` (e.g., exactly 5 treadmill runs and 5 outdoor runs), the existing logic picks the first one encountered. This is acceptable.
- **No Runs**: If the user has 0 runs, no card is highlighted.

## 5. Scope Check
This scope is well-contained. It only involves adding one new component (`HallOfFameModal.tsx`) and modifying existing components (`App.tsx`, `Header.tsx`, `MemberDetailModal.tsx`, `index.css`).
