# Member Detail Modal Redesign

## Goal
Redesign the `MemberDetailModal` to be more interactive and visually engaging. The new design will highlight the user's progress towards their monthly challenge using an animated horizontal progress bar, and display their activity breakdown (including the newly added 'ORR RUN' activity type) in a modern grid tile layout.

## Scope & Components

### 1. Data Types Update (`src/types/index.ts`)
- Update the `Run` interface's `type` field to include `'orr_run'`.
  ```ts
  type: 'treadmill' | 'outdoor' | 'stairmaster' | 'cycling' | 'orr_run';
  ```

### 2. Challenge Progress Calculation (`MemberDetailModal.tsx`)
- Calculate **Current Month Distance**: Sum of distances for runs where the `run_date` falls within the current calendar month.
- Calculate **Total Distance**: Sum of distances for all runs.
- Determine the **Next Monthly Challenge Target**:
  - Iterate through `monthlyChallenge.tiers` (sorted by `km`).
  - Find the first tier where `tier.km > currentMonthDistance`.
  - Calculate `distanceRemaining = nextTier.km - currentMonthDistance`.
  - Calculate progress percentage for the bar: `(currentMonthDistance / nextTier.km) * 100`.

### 3. UI Redesign (`MemberDetailModal.tsx`)
- **Top Section (Progress)**:
  - Display "이번달: X km / 누적: Y km" at the top.
  - Render an animated horizontal progress bar. The bar fills up from 0 to the calculated percentage when the modal opens.
  - Display text indicating how many km remain until the next challenge tier.
- **Bottom Section (Activity Grid)**:
  - Replace the current list/stat display with a 2-column grid layout.
  - Each activity type (Outdoor, Treadmill, ORR RUN, etc.) gets a grid tile showing its total distance and frequency for the user.
  - **ORR RUN Tile**: Give this specific tile a distinct visual treatment (e.g., a vibrant gradient background like `#ea580c` to `#f97316` with bold text) to highlight it as a special ORR fit club activity.

## Error Handling & Edge Cases
- If the user has completed all challenge tiers, the progress bar should show 100% and display a congratulatory message instead of "distance remaining".
- If `monthlyChallenge` is null or has no tiers, gracefully hide the progress bar or show a fallback message.
- If the user has 0 runs, the distances should display 0km.

## Testing Strategy
- Open the modal for a user with no runs.
- Open the modal for a user with runs in the current month and past months to verify distance calculations.
- Open the modal for a user who has exceeded the highest monthly challenge tier.
- Verify the animation of the progress bar upon modal render.
