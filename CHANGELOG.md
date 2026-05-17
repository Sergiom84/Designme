# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
