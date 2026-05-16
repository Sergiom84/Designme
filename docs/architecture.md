# Architecture

Designme is a local-first design studio built around a deterministic generator. The generator is intentionally split into stages so quality can improve without requiring a model API.

## Flow

1. `src/engine/brief.ts` normalizes the raw prompt into a `DerivedBrief`.
2. `src/engine/intent/intentResolver.ts` detects domain, UX goal, states, risks, and required modules.
3. `src/engine/index.ts` applies the intent back into the brief, then builds HTML, critique, and handoff output.
4. `src/engine/render/components/` provides reusable HTML string components for buttons, cards, navigation, lists, charts, states, and device frames.
5. `src/engine/render/styles/` provides shared generated CSS plus artifact-specific layout CSS.
6. `src/engine/render/` renders the standalone HTML artifact by artifact type.
7. `src/quality/` analyzes the generated HTML for accessibility, contrast, hierarchy, layout, copy, interaction, and export issues.
8. `src/export/` turns the output into standalone HTML or a structured bundle.
9. `src/design-system/tokens/` provides palettes, themes, CSS variables, and contrast helpers.
10. `src/components/`, `src/hooks/`, and `src/styles/` compose the responsive app shell, preview controls, inspector and local persistence.
11. The React app previews the generated HTML inside a sandboxed iframe and exposes export/handoff controls.

## Current Intent Domains

- CRM / ventas
- Finanzas
- Salud
- Educación
- Marketing
- Diseño
- Operaciones
- Productividad
- General fallback

## Boundaries

- No mandatory external API.
- No cloud workspace assumption.
- Generated HTML remains standalone.
- Electron IPC accepts only narrow, validated payloads.

## Quality Pass

The quality pass is deterministic and local. It emits categorized issues with severity, suggested fixes, score buckets, keep notes, fix notes, and quick wins. The app shows those results in the Crítica tab, and the handoff remains available for deeper follow-up in Codex or Claude.

## Responsive Shell

The shell is split into brief, preview and inspector components. CSS lives under `src/styles/` by responsibility. Large screens keep three columns, laptop widths move the inspector below the main row, and mobile stacks panels without global horizontal scrolling.

## Export

Desktop exports are handled through validated Electron IPC. Single-file HTML remains available, and the bundle writer creates a folder with browser-ready `index.html`, extracted assets, `designme.json`, `handoff.md`, and a short README.
