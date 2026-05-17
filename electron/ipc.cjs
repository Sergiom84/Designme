const { clipboard, ipcMain, shell } = require('electron');
const fs = require('node:fs/promises');
const { writeExportBundle } = require('./exportBundle.cjs');
const { exportDirectory, timestampedExportPath } = require('./paths.cjs');
const { createProviderRunManager } = require('./providerRuns.cjs');
const { detectClaudeCode } = require('./providers/claude-code.cjs');
const { detectCodex } = require('./providers/codex.cjs');
const { isAllowedAppUrl } = require('./security.cjs');
const { detectLocalSetup } = require('./setupDetection.cjs');
const {
  validateClipboardText,
  validateCspStatePayload,
  validateExportBundlePayload,
  validateExportHtmlPayload,
  validateLocalSetupDetectionResult,
  validateProviderStartPayload,
  validateProviderStatusPayload,
  validateProviderStopPayload,
  validateSecretKeyPayload,
  validateSecretSetPayload,
} = require('./validators.cjs');

function assertTrustedSender(event, isDev) {
  const frameUrl = event.senderFrame?.url || event.sender.getURL();
  if (!isAllowedAppUrl(frameUrl, isDev)) {
    throw new Error('Blocked IPC from untrusted sender');
  }
}

const providerStatusDetectors = {
  'claude-code-cli': () => detectClaudeCode({ checkStatus: true }),
  'codex-cli': () => detectCodex({ checkStatus: true }),
  'anthropic-api': () => ({ available: Boolean(secretStoreForStatus?.get?.('anthropic-api.apiKey')) }),
  'openai-api': () => ({ available: Boolean(secretStoreForStatus?.get?.('openai-api.apiKey')) }),
};

let secretStoreForStatus;

function registerIpcHandlers(app, isDev, options = {}) {
  const cspState = options.cspState;
  const logger = options.logger;
  const secretStore = options.secretStore;
  const providerRuns = createProviderRunManager({ secretStore });
  secretStoreForStatus = secretStore;

  ipcMain.handle('designme:export-html', async (event, payload) => {
    assertTrustedSender(event, isDev);
    validateExportHtmlPayload(payload);

    try {
      const { dir, filePath } = timestampedExportPath(app, payload.name, 'html');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, payload.html, 'utf8');
      logger?.info?.('HTML exported', { filePath });
      return { filePath, directory: dir };
    } catch (error) {
      logger?.error?.('HTML export failed', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  });

  ipcMain.handle('designme:export-bundle', async (event, payload) => {
    assertTrustedSender(event, isDev);
    validateExportBundlePayload(payload);
    try {
      const result = await writeExportBundle(app, payload);
      logger?.info?.('Bundle exported', { filePath: result.filePath });
      return result;
    } catch (error) {
      logger?.error?.('Bundle export failed', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  });

  ipcMain.handle('designme:open-exports', async (event) => {
    assertTrustedSender(event, isDev);
    const dir = exportDirectory(app);
    await fs.mkdir(dir, { recursive: true });
    await shell.openPath(dir);
    return { directory: dir };
  });

  ipcMain.handle('designme:copy-text', async (event, text) => {
    assertTrustedSender(event, isDev);
    validateClipboardText(text);
    clipboard.writeText(text);
  });

  ipcMain.handle('designme:provider-start', async (event, payload) => {
    assertTrustedSender(event, isDev);
    validateProviderStartPayload(payload);
    return providerRuns.start(event.sender, payload);
  });

  ipcMain.handle('designme:provider-stop', async (event, payload) => {
    assertTrustedSender(event, isDev);
    validateProviderStopPayload(payload);
    return providerRuns.stop(event.sender, payload.runId);
  });

  ipcMain.handle('designme:provider-status', async (event, payload) => {
    assertTrustedSender(event, isDev);
    validateProviderStatusPayload(payload);

    const detectProvider = providerStatusDetectors[payload.providerId];
    if (!detectProvider) {
      return {
        providerId: payload.providerId,
        status: 'error',
        detail: 'Provider status is not available in desktop IPC.',
      };
    }

    const detection = await detectProvider();
    return {
      providerId: payload.providerId,
      status: detection.available && !detection.statusError ? 'ready' : 'error',
      version: detection.version,
      detail: detection.status || detection.statusError || detection.error,
    };
  });

  ipcMain.handle('designme:detect-local-setup', async (event) => {
    assertTrustedSender(event, isDev);
    const detection = await detectLocalSetup();
    validateLocalSetupDetectionResult(detection);
    return detection;
  });

  ipcMain.handle('designme:set-csp-state', async (event, payload) => {
    assertTrustedSender(event, isDev);
    validateCspStatePayload(payload);
    if (!cspState) {
      return { allowLocalProvider: false };
    }
    const next = cspState.set({ allowLocalProvider: payload.allowLocalProvider });
    return next;
  });

  ipcMain.handle('designme:get-csp-state', async (event) => {
    assertTrustedSender(event, isDev);
    if (!cspState) {
      return { allowLocalProvider: false };
    }
    return cspState.get();
  });

  ipcMain.handle('designme:secret-status', async (event) => {
    assertTrustedSender(event, isDev);
    return { ready: Boolean(secretStore?.ready?.()) };
  });

  ipcMain.handle('designme:secret-set', async (event, payload) => {
    assertTrustedSender(event, isDev);
    validateSecretSetPayload(payload);
    if (!secretStore) {
      return { stored: false };
    }
    return secretStore.set(payload.key, payload.value);
  });

  ipcMain.handle('designme:secret-get', async (event, payload) => {
    assertTrustedSender(event, isDev);
    validateSecretKeyPayload(payload);
    if (!secretStore) {
      return { value: null };
    }
    const value = secretStore.get(payload.key);
    return { value: typeof value === 'string' ? value : null };
  });

  ipcMain.handle('designme:secret-delete', async (event, payload) => {
    assertTrustedSender(event, isDev);
    validateSecretKeyPayload(payload);
    if (!secretStore) {
      return { deleted: false };
    }
    return secretStore.delete(payload.key);
  });
}

module.exports = {
  registerIpcHandlers,
};
