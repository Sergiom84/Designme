# Designme Studio

Local-first designer for apps, software screens, dashboards, decks, infographics, and websites. It does not require an API key: the first version uses a deterministic design engine, exports standalone HTML, and generates a handoff prompt that you can paste into Codex or Claude when you want the paid agents you already use to continue the work.

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

## Windows executable

```bash
npm run package
```

The packaged portable executable is created under `release/`. Exported HTML files are written to `Documents/Designme/exports` unless `DESIGNME_EXPORT_DIR` is set.

## What It Borrows Conceptually

- From Open CoDesign: local-first workflow, explicit sessions, live preview, real file exports, no forced cloud lock-in.
- From Huashu Design: design direction advisor, tweakable variations, early visual assumptions, and a practical critique rubric.

No model provider is hardcoded. The app is useful offline as a design starter and gives you a clean bridge back to Codex or Claude without binding this app to an API account.
