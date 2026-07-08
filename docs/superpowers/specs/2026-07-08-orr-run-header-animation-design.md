# Orr Run Header Animation Design Spec

## Overview
This specification details the design for replacing the static gradient header of the `OrrRunModal` component with a dynamic, dark-themed header featuring a path-drawing SVG animation.

## Goals
- Replace the current gradient header in `OrrRunModal` with a solid dark background (`#111111` or `bg-neutral-950`).
- Display a dynamic text heading (e.g., "Citizens Park") centered in the header, mapping to the specific route.
- Animate a background SVG path (e.g., `citizens_park_line.svg`) so that it appears to be drawn from start to finish when the modal opens.
- The animation should run once per modal open and stop.

## Data Structure Changes
Update `ROUTE_DATA` inside `OrrRunModal.tsx` to include new properties for the header visual:
- `headerText` (string): The text to display prominently in the header.
- `headerSvgPath` (string): The `d` attribute of the SVG `<path>` to animate.
- `headerSvgViewBox` (string): The `viewBox` for the SVG container (e.g., `0 0 302 245`).

Example:
```typescript
'1': {
  headerText: 'Citizens Park',
  headerSvgPath: 'M212.845 2.09377L206.217...', // from citizens_park_line.svg
  headerSvgViewBox: '0 0 302 245',
  ...
}
```

## UI & Animation Details
- **Framer Motion**: The project already uses `motion` (`framer-motion` ecosystem). We will use `<motion.svg>` and `<motion.path>`.
- **Animation Props**:
  - `initial={{ pathLength: 0, opacity: 0 }}`
  - `animate={{ pathLength: 1, opacity: 1 }}`
  - `transition={{ duration: 2, ease: "easeInOut" }}`
- **Styling**:
  - The header container will be `h-48 bg-neutral-950 relative flex items-center justify-center overflow-hidden`.
  - The SVG will be placed absolutely with `opacity-60` (or similar) behind the text. The path will have `stroke="#FF5500"`.
  - The Text will be `text-3xl font-black text-white z-10 drop-shadow-lg`.

## Testability
- Route '1' will be temporarily or permanently updated to showcase the "Citizens Park" route logic with the provided path.
