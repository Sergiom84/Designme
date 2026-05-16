# Accessibility

Designme's app shell now follows a small set of native-first accessibility rules.

## Inspector

- Inspector tabs use `role="tablist"` / `role="tab"` / `role="tabpanel"`.
- Arrow Left/Right, Home and End move between tabs.
- Only the selected tab is in the normal tab order.
- Active tab panels are focusable so keyboard users can enter the panel content predictably.

## Controls

- Icon-only buttons have explicit `aria-label` values.
- Segmented controls expose `aria-pressed` on selected options.
- Preview zoom/device controls are named groups.
- Score meters have accessible labels.
- The handoff textarea has a real label.

## Status

The status row uses `role="status"`, `aria-live="polite"` and `aria-atomic="true"` so export/copy/save feedback is announced without interrupting the user.

## Focus And Targets

Keyboard focus uses visible outlines. Primary icon buttons are at least 40px square, and common command buttons use 42px minimum height.
