const MAX_HTML_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_BYTES = 1024 * 1024;
const MAX_BUNDLE_FILE_BYTES = 5 * 1024 * 1024;
const BUNDLE_FILE_NAMES = ['index.html', 'styles.css', 'script.js', 'designme.json', 'handoff.md', 'README.md'];

function byteLength(value) {
  return Buffer.byteLength(String(value), 'utf8');
}

function assertPlainObject(value, message) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(message);
  }
}

function validateExportHtmlPayload(payload) {
  assertPlainObject(payload, 'Invalid export payload');
  if (typeof payload.html !== 'string' || payload.html.trim().length === 0) {
    throw new Error('No HTML payload received');
  }
  if (byteLength(payload.html) > MAX_HTML_BYTES) {
    throw new Error('HTML export is too large');
  }
  if (payload.name !== undefined && typeof payload.name !== 'string') {
    throw new Error('Export name must be a string');
  }
  if (typeof payload.name === 'string' && /[\\/]|(^|[.])\.\.($|[.])/.test(payload.name)) {
    throw new Error('Export name contains invalid path characters');
  }
}

function validateExportBundlePayload(payload) {
  assertPlainObject(payload, 'Invalid bundle payload');
  if (payload.name !== undefined && typeof payload.name !== 'string') {
    throw new Error('Bundle name must be a string');
  }
  if (typeof payload.name === 'string' && /[\\/]|(^|[.])\.\.($|[.])/.test(payload.name)) {
    throw new Error('Bundle name contains invalid path characters');
  }

  assertPlainObject(payload.files, 'Invalid bundle files');
  const receivedNames = Object.keys(payload.files);
  const unexpected = receivedNames.filter((name) => !BUNDLE_FILE_NAMES.includes(name));
  const missing = BUNDLE_FILE_NAMES.filter((name) => typeof payload.files[name] !== 'string');

  if (unexpected.length > 0 || missing.length > 0) {
    throw new Error('Bundle contains invalid file entries');
  }

  for (const fileName of BUNDLE_FILE_NAMES) {
    if (byteLength(payload.files[fileName]) > MAX_BUNDLE_FILE_BYTES) {
      throw new Error(`${fileName} is too large`);
    }
  }

  if (!payload.files['index.html'].includes('<!doctype html>')) {
    throw new Error('Bundle index.html must be standalone HTML');
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

module.exports = {
  validateClipboardText,
  validateExportBundlePayload,
  validateExportHtmlPayload,
};
