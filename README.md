# Designme Studio

Local-first designer for apps, software screens, dashboards, decks, infographics, and websites. It does not require an API key: the first version uses a deterministic design engine, exports standalone HTML, and generates a handoff prompt that you can paste into Codex or Claude when you want the paid agents you already use to continue the work.

## Features

- Local deterministic generator: no mandatory API key, cloud workspace, or model provider.
- Live preview for desktop, tablet, and mobile canvases.
- Responsive app shell with zoom, canvas-only mode, and saved-version comparison.
- Visual directions backed by shared design tokens.
- Tweaks for density, tone, motion, radius, and device framing.
- Critique panel with a growing quality rubric and contrast-aware scoring.
- Local quality analyzer for accessibility, hierarchy, layout, copy, contrast, and export readiness.
- HTML export plus a clean handoff prompt for Codex, Claude, or another agent.
- Bundle export with `index.html`, `styles.css`, `script.js`, `designme.json`, `handoff.md`, and README.
- Hardened Electron shell with CSP, sender-checked IPC, and a stricter preview sandbox.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run desktop
```

## Validate

```bash
npm run check
npm run security:audit
```

## Windows executable

```bash
npm run package
```

The packaged portable executable is created under `release/`. Exported HTML files are written to `Documents/Designme/exports` unless `DESIGNME_EXPORT_DIR` is set.

## Quality Roadmap

The active improvement plan lives in [`docs/PLAN_MEJORAS_DESIGNME.md`](docs/PLAN_MEJORAS_DESIGNME.md).

Baseline prompts and acceptance checks live under [`docs/quality/`](docs/quality/). The current priority is:

1. Tokens and theme quality.
2. Modular generator architecture.
3. Measurable critique and accessibility.
4. Responsive app shell.
5. Safer Electron IPC and preview boundaries.

## Architecture Snapshot

- `src/engine.ts` is a compatibility barrel.
- `src/engine/brief.ts` turns prompts into a derived brief.
- `src/engine/intent/` detects domain, UX goal, modules, states, and risks.
- `src/engine/options.ts` owns artifact options, directions, and default tweaks.
- `src/engine/render/components/` owns reusable HTML string components for generated artifacts.
- `src/engine/render/styles/` owns shared generated CSS and artifact-specific layout CSS.
- `src/engine/render/` owns standalone HTML rendering by artifact type.
- `src/engine/critique.ts` and `src/engine/handoff.ts` keep quality review and agent handoff separate from rendering.
- `src/quality/` analyzes generated HTML and turns measurable issues into critique scores.
- `src/components/`, `src/hooks/`, and `src/styles/` keep the responsive app shell modular.
- `src/export/` builds standalone HTML and structured export bundles.
- `src/design-system/tokens/` owns themes, palettes, CSS variables, and contrast helpers.
- Security notes: [`docs/security.md`](docs/security.md).

More detail: [`docs/architecture.md`](docs/architecture.md).

## What It Borrows Conceptually

- From Open CoDesign: local-first workflow, explicit sessions, live preview, real file exports, no forced cloud lock-in.
- From Huashu Design: design direction advisor, tweakable variations, early visual assumptions, and a practical critique rubric.

No model provider is hardcoded. The app is useful offline as a design starter and gives you a clean bridge back to Codex or Claude without binding this app to an API account.
