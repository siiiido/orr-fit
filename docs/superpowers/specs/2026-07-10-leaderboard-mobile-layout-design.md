# Leaderboard Mobile Layout Design

## 1. Overview
When a member has a long nickname (up to 6 chars) and a name (up to 4 chars), along with a medal and a gender tag, the UI layout breaks on mobile devices in the Leaderboard list. The goal is to update the layout to stack the text vertically on mobile screens while maintaining a single-line horizontal layout on desktop.

## 2. Changes
- **Target Component**: `src/components/Leaderboard.tsx`
- **Action**: Update the `renderNameTag` and its wrapping table cell elements.
- **Implementation Details**:
  - Change the container of the name, nickname, medal, and gender tag to use `flex-col` on mobile and `sm:flex-row` on larger screens.
  - Specifically, adjust the `div` in the table cell from `flex items-center gap-1.5` to `flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-1.5`.
  - Inside `renderNameTag`, ensure the layout allows the nickname + medal to sit on the first line, and the name on the second line if wrapped, or explicitly separate them into stacked flex containers for mobile.

## 3. Architecture & Trade-offs
- **Approach**: Multi-line stacking on mobile.
- **Trade-offs**: This ensures no text is truncated or hidden (preserving data visibility), at the cost of slightly increasing the vertical height of table rows on mobile devices.

## 4. Verification Plan
- Simulate a mobile viewport (e.g., width < 640px).
- Verify that a user with a 6-character nickname, 4-character name, a medal, and a gender tag renders cleanly on two lines.
- Verify that the layout remains horizontal on desktop viewports.
