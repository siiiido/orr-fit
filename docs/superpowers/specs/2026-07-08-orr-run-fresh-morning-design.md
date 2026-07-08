# Orr Run Fresh Morning Theme Design Spec

## Overview
This specification details the design update for the `OrrRunModal` to reflect a "Fresh Morning" (white) theme, tailored for weekend morning runs, and fixes the SVG clipping issue.

## Goals
- Fix SVG line animation clipping by adding proper padding/margins and `preserveAspectRatio`.
- Switch the modal's dark/black theme to a clean white theme (`bg-white`).
- Change typography colors from white to dark gray (`text-neutral-900`) for high readability.
- Update icon and badge colors to a fresh, vibrant palette (e.g., orange, light blue/green).
- Adjust the close button to blend in smoothly with the light background.

## SVG Clipping Fix
- The container for the SVG will use `p-6` or scale the SVG slightly down so the edges (especially the top/bottom of the 302x245 viewBox) do not hit the bounds of the `h-48` container.
- We will add `preserveAspectRatio="xMidYMid meet"` to the `<motion.svg>` component.

## Color Mapping
- Header Background: `bg-white`
- Header Text: `text-neutral-900`
- SVG Line: `#FF5500`
- Close Button: `text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200`
- Main CTA Button: `bg-brand-orange text-white hover:bg-orange-600` or a solid dark button depending on the exact style needed (we'll use the existing dark button style or orange to keep it fresh).
