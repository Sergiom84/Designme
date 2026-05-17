const { contextBridge, ipcRenderer } = require('electron');

const MAX_HTML_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_BYTES = 1024 * 1024;
const MAX_BUNDLE_FILE_BYTES = 5 * 1024 * 1024;
const MAX_PROVIDER_PROMPT_BYTES = 128 * 1024;
const MAX_PROVIDER_TEXT_BYTES = 1024 * 1024;
const MAX_PROVIDER_JSON_BYTES = 1024 * 1024;
const BUNDLE_FILE_NAMES = ['index.html', 'styles.css', 'script.js', 'designme.json', 'handoff.md', 'README.md'];
const PROVIDER_IDS = new Set(['deterministic', 'local-openai', 'claude-code', 'codex']);
const PROVIDER_EVENT_TYPES = new Set(['started', 'token', 'tool-call', 'tool-result', 'final', 'error', 'stopped']);
const LOCAL_SETUP_PROVIDER_IDS = new Set(['claude-code', 'codex']);

function byteLength(value) {
  return new TextEncoder().encode(String(value)).length;
}

function assertPlainObject(value, message) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(message);
  }
}

function jsonByteLength(value, message) {
  try {
    return byteLength(JSON.stringify(value));
  } catch (error) {
    throw new Error(message, { cause: error });
  }
}

function assertString(value, message, maxBytes = MAX_PROVIDER_TEXT_BYTES) {
  if (typeof value !== 'string') {
    throw new Error(message);
  }
  if (byteLength(value) > maxBytes) {
    throw new Error(`${message} is too large`);
  }
}

function assertOptionalPlainObject(value, message) {
  if (value !== undefined) {
    assertPlainObject(value, message);
    if (jsonByteLength(value, message) > MAX_PROVIDER_JSON_BYTES) {
      throw new Error(`${message} is too large`);
    }
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

function validateProviderRunId(runId) {
  assertString(runId, 'Provider runId must be a string', 128);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId)) {
    throw new Error('Provider runId is invalid');
  }
}

function validateProviderId(providerId) {
  assertString(providerId, 'Provider id must be a string', 64);
  if (!PROVIDER_IDS.has(providerId)) {
    throw new Error('Provider id is invalid');
  }
}

function validateProviderStartPayload(payload) {
  assertPlainObject(payload, 'Invalid provider start payload');
  validateProviderId(payload.providerId);
  assertString(payload.prompt, 'Provider prompt must be a string', MAX_PROVIDER_PROMPT_BYTES);
  assertString(payload.artifactType, 'Provider artifact type must be a string', 64);
  assertString(payload.directionId, 'Provider direction id must be a string', 64);
  assertPlainObject(payload.tweaks, 'Provider tweaks must be an object');
  assertOptionalPlainObject(payload.brief, 'Provider brief must be an object');
  assertOptionalPlainObject(payload.intent, 'Provider intent must be an object');
}

function validateProviderStopPayload(payload) {
  assertPlainObject(payload, 'Invalid provider stop payload');
  validateProviderRunId(payload.runId);
}

function validateProviderStatusPayload(payload) {
  assertPlainObject(payload, 'Invalid provider status payload');
  validateProviderId(payload.providerId);
}

function validateProviderEventPayload(payload) {
  assertPlainObject(payload, 'Invalid provider event payload');
  validateProviderRunId(payload.runId);

  if (!PROVIDER_EVENT_TYPES.has(payload.type)) {
    throw new Error('Invalid provider event type');
  }

  if (payload.type === 'token') {
    assertString(payload.text, 'Provider token text must be a string');
    return;
  }

  if (payload.type === 'tool-call') {
    assertString(payload.name, 'Provider tool name must be a string', 256);
    if (
      payload.args !== undefined &&
      jsonByteLength(payload.args, 'Provider tool args are invalid') > MAX_PROVIDER_JSON_BYTES
    ) {
      throw new Error('Provider tool args are too large');
    }
    return;
  }

  if (payload.type === 'tool-result') {
    assertString(payload.name, 'Provider tool name must be a string', 256);
    if (
      payload.result !== undefined &&
      jsonByteLength(payload.result, 'Provider tool result is invalid') > MAX_PROVIDER_JSON_BYTES
    ) {
      throw new Error('Provider tool result is too large');
    }
    return;
  }

  if (payload.type === 'final') {
    assertString(payload.html, 'Provider final html must be a string', MAX_HTML_BYTES);
    if (
      payload.output !== undefined &&
      jsonByteLength(payload.output, 'Provider output is invalid') > MAX_PROVIDER_JSON_BYTES
    ) {
      throw new Error('Provider output is too large');
    }
    if (payload.notes !== undefined) {
      assertString(payload.notes, 'Provider notes must be a string', MAX_PROVIDER_TEXT_BYTES);
    }
    return;
  }

  if (payload.type === 'error') {
    assertString(payload.message, 'Provider error message must be a string', 4096);
  }
}

function assertOptionalString(value, message, maxBytes = MAX_PROVIDER_TEXT_BYTES) {
  if (value !== undefined) {
    assertString(value, message, maxBytes);
  }
}

function assertBoolean(value, message) {
  if (typeof value !== 'boolean') {
    throw new Error(message);
  }
}

function validateLocalSetupDetectionResult(result) {
  assertPlainObject(result, 'Invalid local setup detection result');
  assertOptionalString(result.generatedAt, 'Local setup timestamp must be a string', 128);

  if (!Array.isArray(result.providers) || result.providers.length > 2) {
    throw new Error('Local setup providers are invalid');
  }

  for (const provider of result.providers) {
    assertPlainObject(provider, 'Invalid local setup provider');
    assertString(provider.id, 'Local setup provider id must be a string', 64);
    if (!LOCAL_SETUP_PROVIDER_IDS.has(provider.id)) {
      throw new Error('Local setup provider id is invalid');
    }
    assertString(provider.label, 'Local setup provider label must be a string', 128);
    assertBoolean(provider.detected, 'Local setup provider detected must be boolean');
    assertBoolean(provider.ready, 'Local setup provider ready must be boolean');
    assertBoolean(provider.configFound, 'Local setup provider configFound must be boolean');
    assertBoolean(provider.cliFound, 'Local setup provider cliFound must be boolean');
    if (provider.authFound !== undefined) {
      assertBoolean(provider.authFound, 'Local setup provider authFound must be boolean');
    }
    assertOptionalString(provider.version, 'Local setup provider version must be a string', 512);
    assertOptionalString(provider.detail, 'Local setup provider detail must be a string', 4096);
  }

  assertPlainObject(result.localOpenAI, 'Invalid local setup localOpenAI');
  assertString(result.localOpenAI.id, 'Local setup localOpenAI id must be a string', 64);
  if (result.localOpenAI.id !== 'ollama') {
    throw new Error('Local setup localOpenAI id is invalid');
  }
  assertString(result.localOpenAI.label, 'Local setup localOpenAI label must be a string', 128);
  assertBoolean(result.localOpenAI.detected, 'Local setup localOpenAI detected must be boolean');
  assertBoolean(result.localOpenAI.ready, 'Local setup localOpenAI ready must be boolean');
  assertBoolean(result.localOpenAI.configFound, 'Local setup localOpenAI configFound must be boolean');
  assertString(result.localOpenAI.baseUrl, 'Local setup localOpenAI baseUrl must be a string', 512);
  assertOptionalString(result.localOpenAI.model, 'Local setup localOpenAI model must be a string', 512);
  assertOptionalString(result.localOpenAI.detail, 'Local setup localOpenAI detail must be a string', 4096);
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
  providerStart: (payload) => {
    validateProviderStartPayload(payload);
    return ipcRenderer.invoke('designme:provider-start', payload);
  },
  providerStop: (payload) => {
    validateProviderStopPayload(payload);
    return ipcRenderer.invoke('designme:provider-stop', payload);
  },
  providerStatus: (payload) => {
    validateProviderStatusPayload(payload);
    return ipcRenderer.invoke('designme:provider-status', payload);
  },
  detectLocalSetup: async () => {
    const detection = await ipcRenderer.invoke('designme:detect-local-setup');
    validateLocalSetupDetectionResult(detection);
    return detection;
  },
  onProviderEvent: (listener) => {
    if (typeof listener !== 'function') {
      throw new Error('Provider event listener must be a function');
    }

    const wrappedListener = (_event, payload) => {
      validateProviderEventPayload(payload);
      listener(payload);
    };

    ipcRenderer.on('designme:provider-event', wrappedListener);
    return () => {
      ipcRenderer.removeListener('designme:provider-event', wrappedListener);
    };
  },
});
