# Orr Run Event Homepage Banner & Admin Design

## Overview
This feature introduces a D-Day countdown button on the homepage for an upcoming "orr run" event. The button appears a specified number of days before the event. When clicked, it opens a modal showing the specific route for that run. The configuration for this event is managed via an Admin dashboard.

## Architecture & Data Model

### Database
* We will use the existing `settings` table in Supabase.
* **Key**: `'next_orr_run'`
* **Value Format (JSON)**:
  ```json
  {
    "date": "YYYY-MM-DD",
    "d_day": 7,
    "route_modal_id": 1,
    "enabled": true
  }
  ```
  *(Note: Added an `enabled` flag to allow admins to easily hide the banner even if the date is set, providing more control).*

## Admin Dashboard (Event Settings)

* **Location**: Within the existing Admin/Member Management area.
* **UI Structure**: Add a new tab named **"이벤트 관리 (orr run)"** alongside the existing tabs to isolate event settings from member data.
* **Form Fields**:
  1. **러닝 날짜 (Event Date)**: Date picker.
  2. **D-Day 설정**: Number input (e.g., `7` means the button appears 7 days before the event).
  3. **모달/루트 선택**: Dropdown menu (`route_modal_id`). Options will map to pre-defined route components in the frontend (e.g., 1 = Route A Modal, 2 = Route B Modal).
  4. **노출 여부 (Toggle)**: Quick switch to manually enable/disable the feature.
* **Action**: Saving the form updates the `next_orr_run` setting in the Supabase `settings` table.

## Homepage UI

### 1. The Floating Button (Pill-shaped FAB)
* **Position**: Bottom right corner of the screen, fixed position.
* **Shape**: Pill-shaped (알약 형태) to accommodate changing text cleanly.
* **Animation**: The text inside the button will cycle smoothly:
  * `🏃 orr run`
  * `D-[남은 일수]`
  * `Click me!`
* **Visibility Logic**: 
  * Only renders if `enabled` is true.
  * Calculates the difference between the current date and the event `date`.
  * If `difference <= d_day` AND `difference >= 0`, the button is visible.

### 2. Route Modals
* Clicking the floating button triggers a modal overlay in the center of the screen.
* The modal dynamically loads a specific route component based on the `route_modal_id` value retrieved from the database.
* The modals themselves (e.g., map images, meeting point info, distance) are hardcoded React components in the frontend for performance and flexibility.

## Edge Cases & Error Handling
* If `route_modal_id` does not match any existing component, a default fallback modal or graceful error message will be shown.
* Timezone handling: Ensure D-Day calculations are based on the user's local timezone (KST).
