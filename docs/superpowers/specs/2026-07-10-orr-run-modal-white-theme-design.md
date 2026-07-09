# Orr Run Modal White Theme Design

## 1. Overview
The "orr run" D-Day notification modal (`OrrRunModal.tsx`) currently adapts to the user's dark mode preference due to Tailwind's `dark:` utility classes. The goal is to lock the modal's UI to a white (light) theme universally, regardless of the system or application dark mode settings, so that it matches the original design intent.

## 2. Changes
- **Target Component**: `src/components/OrrRunModal.tsx`
- **Action**: Remove all `dark:` prefixed utility classes from the JSX elements within the component.
- **Affected Elements to Update**:
  - Modal container background (`dark:bg-neutral-900` 제거)
  - Typography (`dark:text-white`, `dark:text-gray-300`, `dark:text-neutral-400` 등 제거)
  - Badges & Icons backgrounds/text (`dark:bg-indigo-900/50`, `dark:text-indigo-300`, `dark:bg-orange-900/30`, `dark:bg-sky-900/30` 등 제거)
  - Information block backgrounds (`dark:bg-neutral-800/50` 제거)

## 3. Architecture & Trade-offs
- **Approach**: By removing `dark:` classes, we rely purely on the default (light mode) Tailwind classes. 
- **Trade-offs**: This is the most straightforward and maintainable approach without introducing complex CSS scoping, overriding dark mode context, or adding custom CSS variables.

## 4. Verification Plan
- Toggle the application into dark mode.
- Open the Orr Run Banner modal.
- Verify the modal remains fully white with original light-mode typography colors, ensuring all text and icons are perfectly legible.
