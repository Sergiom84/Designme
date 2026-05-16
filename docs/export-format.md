# Export Format

Designme supports two local-first exports.

## Standalone HTML

`Export HTML` writes one self-contained `.html` file. It includes the generated markup, CSS, script, tweak dock and UX metadata.

## Bundle

`Export bundle` writes a folder:

```txt
Designme Export/
  index.html
  styles.css
  script.js
  designme.json
  handoff.md
  README.md
```

- `index.html` opens directly in a browser without a server.
- `styles.css` contains the extracted generated CSS.
- `script.js` contains the extracted standalone interactions.
- `designme.json` contains prompt, artifact type, direction, theme, tweaks, UX intent and quality report.
- `handoff.md` is ready to paste into Codex, Claude or another design/dev agent.
- `README.md` explains how to continue the export.

Electron validates the bundle file names and writes only the expected files inside the safe exports directory.
