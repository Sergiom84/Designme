# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Dynamic local-network gate (`electron/cspState.cjs` + `session.webRequest.onBeforeRequest`) that blocks `127.0.0.1`/`localhost` traffic unless the user explicitly activates the `local-openai` provider. Vite dev (`127.0.0.1:5173`) stays exempt. State is persisted under `userData/csp-state.json` and synced from the renderer via the new `designme:set-csp-state` / `designme:get-csp-state` IPC channels.
- `useGenerate` now performs a one-shot automatic retry when an external LLM provider reports `INVALID_HTML_ERROR_MESSAGE`, appending a strict format hint to the prompt. The first-attempt error is hidden from the visible event stream so users only see the successful HTML when the retry recovers.
- Optional `safeStorage`-backed secret store (`electron/secretStore.cjs` + `src/settings/secretStore.ts`) for the Local OpenAI API key. A new "Recordar API key en este equipo" checkbox in `LocalOpenAISettings` persists the key as OS-encrypted ciphertext under `userData/secrets.json`. The checkbox is disabled and the key stays in memory only when `safeStorage` is unavailable (web mode, headless Linux without a keyring).
- Cross-platform release pipeline: new `.github/workflows/release.yml` builds macOS (`dmg` + `zip`, x64 + arm64), Linux (`AppImage` + `tar.gz`) and Windows (`portable` + `nsis`) artifacts on tag push or manual dispatch. `package.json` gains `package:mac` and `package:linux` scripts plus the matching electron-builder targets.
- Stricter LLM HTML extractor: candidates must include `<html>`, `</html>`, `<body>` and `</body>` before they are accepted, so truncated documents fail fast and the renderer-side retry kicks in instead of rendering a blank iframe.
- IndexedDB-backed session storage (`src/sessions/idbStore.ts` + `src/hooks/useIdbPersistedState.ts`). The session collection now lives in the `designme/sessions` IDB store, which is mirrored to localStorage as a warm cache. Lifts the ~5 MiB localStorage quota for users who keep many saved versions with embedded HTML; falls back to plain localStorage when IndexedDB is unavailable.

### Changed

- Document-level CSP `connect-src` keeps `127.0.0.1:*` and `localhost:*` listed at load time because CSP headers cannot be updated after the document is parsed; the runtime gate above enforces the dynamic policy.
- Broke `src/App.tsx` (~720 lines) into focused hooks/utilities: `useExportActions` (clipboard, HTML/bundle export, open exports folder), `useProviderRuntime` (active provider, status polling, Electron CSP gate sync), `useSetupDetection` (one-click local CLI / Ollama detection) and `src/utils/clipboard.ts` (`writeClipboard` helper). App is now ~570 lines and only orchestrates the panels.
- CI now runs Playwright e2e tests (chromium) in a dedicated job alongside the unit/lint/typecheck job. The HTML report is uploaded as an artifact on every run for post-mortem inspection.
- `src/App.tsx` shrunk further (~570 → ~470 lines) by extracting `useDesignSessionActions` (session mutators, version save/restore, create/select) and moving legacy localStorage parsers + prompt presets to `src/sessions/legacyInput.ts`.

### Fixed

- LLM output extraction (`electron/providers/htmlExtraction.cjs` + `src/providers/htmlExtraction.ts`) now scans every fenced ```html block plus the raw text and returns the longest valid `<!doctype html>...</html>` envelope. Avoids picking a stub document when the model returns "draft + final" or "option A vs option B" style responses.
- `MAX_PROVIDER_PROMPT_BYTES` raised from 128 KiB to 256 KiB in both `electron/validators.cjs` and `electron/preload.cjs` so prompt + brief + intent + preview comments + retry hint fit comfortably.
- Claude Code, Codex and Local OpenAI now share a single `INVALID_HTML_ERROR_MESSAGE` so the retry detector in `useGenerate` recognises the failure signal regardless of which provider produced it.
- Claude Code provider now spawns with `--permission-mode bypassPermissions`; the previous `dontAsk` value is not a valid Claude CLI flag and caused runs to fail.
- Claude Code detection no longer invokes the interactive `/status` slash command. CLI presence and version are still reported; authentication failures surface from the first run instead.
- Local OpenAI provider now requires a complete `<!doctype html>...</html>` envelope and emits a clear `error` event when the model returns markdown or plain text instead of HTML.
- The critique panel now reflects the HTML actually produced by external providers. `useGenerate` re-runs the local quality pass (`engine/rebuildDesignOutputWithHtml`) over the LLM HTML instead of inheriting the deterministic fallback's critique.
- `useGenerate` no longer rebuilds the deterministic project on every keystroke when an external provider is active and a session output is already cached.

## [0.2.0] - 2026-05-17

### Added

- Multi-provider generation with deterministic, Local OpenAI, Claude Code and Codex providers.
- Streaming agent panel with tokens, tool calls, tool results, errors and stop control.
- Desktop IPC bridge for Claude Code and Codex CLI runs with validated payloads.
- Local OpenAI/Ollama settings and one-click local setup detection for Claude Code, Codex and Ollama.
- Persistent recent sessions, version snapshots and preview comment mode.
- Provider documentation, comparison guide and release screenshots.

### Changed

- External providers now run only after an explicit `Generar` action.
- Local OpenAI settings persist endpoint/model/timeout while keeping API keys session-only.
- Windows packaging now targets portable and NSIS installers.

### Security

- Claude Code prompts are sent through `stdin` and dangerous tools are disabled.
- Codex runs with read-only sandbox and no interactive approval.
- Local setup detection returns only sanitized provider signals, never config contents or secrets.

## [0.1.0] - 2026-05-17

### Added

- Initial Designme Studio application baseline.
- Local-first project structure for generating and reviewing design artifacts.
- Phase 0 documentation baseline with a single-locale policy.
# v0.3.0 — Redesign OCD-inspired

- Added v2 three-column shell: chat rail, idea dashboard, right inspector.
- Added unified provider capabilities, ask flow, multi-idea generation, OpenAI/Anthropic API bridge scaffolding, and CLI provider rename.
- Added local workspace import, indexing, analysis, and prompt context injection.
- Added Design.md, critique, tweaks, workspace inspector tabs, scaffolds, and updated architecture docs.
