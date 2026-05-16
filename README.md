# Designme Studio

Local-first designer for apps, software screens, dashboards, decks, infographics, and websites. It does not require an API key: the first version uses a deterministic design engine, exports standalone HTML, and generates a handoff prompt that you can paste into Codex or Claude when you want the paid agents you already use to continue the work.

## Features

- Local deterministic generator: no mandatory API key, cloud workspace, or model provider.
- Live preview for desktop, tablet, and mobile canvases.
- Visual directions backed by shared design tokens.
- Tweaks for density, tone, motion, radius, and device framing.
- Critique panel with a growing quality rubric and contrast-aware scoring.
- HTML export plus a clean handoff prompt for Codex, Claude, or another agent.

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

## What It Borrows Conceptually

- From Open CoDesign: local-first workflow, explicit sessions, live preview, real file exports, no forced cloud lock-in.
- From Huashu Design: design direction advisor, tweakable variations, early visual assumptions, and a practical critique rubric.

No model provider is hardcoded. The app is useful offline as a design starter and gives you a clean bridge back to Codex or Claude without binding this app to an API account.
