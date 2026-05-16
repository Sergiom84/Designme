const { contextBridge, ipcRenderer } = require('electron');

const MAX_HTML_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_BYTES = 1024 * 1024;
const MAX_BUNDLE_FILE_BYTES = 5 * 1024 * 1024;
const BUNDLE_FILE_NAMES = ['index.html', 'styles.css', 'script.js', 'designme.json', 'handoff.md', 'README.md'];

function byteLength(value) {
  return new TextEncoder().encode(String(value)).length;
}

function assertPlainObject(value, message) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(message);
  }
}

function validateName(value, label) {
  if (value !== undefined && typeof value !== 'string') {
    throw new Error(`${label} name must be a string`);
  }
  if (typeof value === 'string' && /[\\/]|(^|[.])\.\.($|[.])/.test(value)) {
    throw new Error(`${label} name contains invalid path characters`);
  }
}

function validateExportHtmlPayload(payload) {
  assertPlainObject(payload, 'Invalid export payload');
  validateName(payload.name, 'Export');
  if (typeof payload.html !== 'string' || payload.html.trim().length === 0) {
    throw new Error('No HTML payload received');
  }
  if (byteLength(payload.html) > MAX_HTML_BYTES) {
    throw new Error('HTML export is too large');
  }
}

function validateExportBundlePayload(payload) {
  assertPlainObject(payload, 'Invalid bundle payload');
  validateName(payload.name, 'Bundle');
  assertPlainObject(payload.files, 'Invalid bundle files');

  const fileNames = Object.keys(payload.files);
  const unexpected = fileNames.filter((fileName) => !BUNDLE_FILE_NAMES.includes(fileName));
  const missing = BUNDLE_FILE_NAMES.filter((fileName) => typeof payload.files[fileName] !== 'string');

  if (unexpected.length > 0 || missing.length > 0) {
    throw new Error('Bundle contains invalid file entries');
  }

  for (const fileName of BUNDLE_FILE_NAMES) {
    if (byteLength(payload.files[fileName]) > MAX_BUNDLE_FILE_BYTES) {
      throw new Error(`${fileName} is too large`);
    }
  }
}

function validateClipboardText(text) {
  if (typeof text !== 'string') {
    throw new Error('Clipboard payload must be text');
  }
  if (byteLength(text) > MAX_TEXT_BYTES) {
    throw new Error('Clipboard payload is too large');
  }
}

contextBridge.exposeInMainWorld('designme', {
  exportBundle: (payload) => {
    validateExportBundlePayload(payload);
    return ipcRenderer.invoke('designme:export-bundle', payload);
  },
  exportHtml: (payload) => {
    validateExportHtmlPayload(payload);
    return ipcRenderer.invoke('designme:export-html', payload);
  },
  openExports: () => ipcRenderer.invoke('designme:open-exports'),
  copyText: (text) => {
    validateClipboardText(text);
    return ipcRenderer.invoke('designme:copy-text', text);
  },
});
