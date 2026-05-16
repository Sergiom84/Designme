# Architecture

Designme is a local-first design studio built around a deterministic generator. The generator is intentionally split into stages so quality can improve without requiring a model API.

## Flow

1. `src/engine/brief.ts` normalizes the raw prompt into a `DerivedBrief`.
2. `src/engine/intent/intentResolver.ts` detects domain, UX goal, states, risks, and required modules.
3. `src/engine/index.ts` applies the intent back into the brief, then builds HTML, critique, and handoff output.
4. `src/engine/render/components/` provides reusable HTML string components for buttons, cards, navigation, lists, charts, states, and device frames.
5. `src/engine/render/styles/` provides shared generated CSS plus artifact-specific layout CSS.
6. `src/engine/render/` renders the standalone HTML artifact by artifact type.
7. `src/design-system/tokens/` provides palettes, themes, CSS variables, and contrast helpers.
8. The React app previews the generated HTML inside a sandboxed iframe and exposes export/handoff controls.

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
