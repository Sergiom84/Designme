# Responsive Shell

Designme's app shell now adapts across desktop, laptop, tablet and mobile without requiring a global minimum width.

## Layout

- Desktop >= 1280px: three fixed work areas: brief, preview and inspector.
- Laptop 1024px-1279px: brief plus preview on the first row, inspector below as a full-width panel.
- Tablet and mobile: one-column flow with brief, preview and inspector stacked.
- Canvas-only mode hides side panels and keeps the toolbar plus preview.

## Preview Controls

- Device modes: desktop, tablet and mobile canvas widths.
- Zoom modes: fit, 50%, 75% and 100%.
- Compare mode: saved versions can be shown beside the current output.
- Reset view: returns to desktop, fit zoom, no compare and normal panels.

Keyboard shortcuts:

- Ctrl/Cmd+S: save version.
- Ctrl/Cmd+E: export HTML.
- Ctrl/Cmd+B: toggle canvas-only mode.
- Ctrl/Cmd+0: reset preview.
