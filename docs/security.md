# Security

Designme is local-first, but Electron still needs strict boundaries because the renderer can export files and access the clipboard through IPC.

## Electron Window

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- `webSecurity: true`
- external navigation is blocked
- `window.open` is denied
- `<webview>` attachment is denied

## CSP

`electron/security.cjs` injects a Content Security Policy through `webRequest.onHeadersReceived`.

- Production allows local app assets only.
- Development allows Vite on `127.0.0.1:5173` and its websocket.
- `object-src` is always `none`.
- `base-uri` is restricted to `self`.

## IPC

The renderer only receives four methods:

- `exportHtml`
- `exportBundle`
- `openExports`
- `copyText`

Payloads are validated in both `preload.cjs` and `electron/validators.cjs`. IPC handlers also reject senders whose frame URL is not the trusted app URL.

## Preview Iframe

The generated preview iframe uses:

```tsx
sandbox="allow-scripts"
```

Scripts are required for the standalone tweak dock and prototype state toggles. The iframe intentionally does not allow same-origin, forms, popups, downloads, modals, pointer lock, or top navigation. Generated prototype storage uses guarded access so sandboxed previews do not crash when `localStorage` is unavailable.

## Exports

Desktop exports never accept arbitrary output paths from the renderer. File and bundle names are sanitized, paths are resolved inside the configured export directory, and bundle exports only write the expected file list.
