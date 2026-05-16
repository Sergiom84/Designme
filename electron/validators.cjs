const MAX_HTML_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_BYTES = 1024 * 1024;

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
  validateExportHtmlPayload,
};
