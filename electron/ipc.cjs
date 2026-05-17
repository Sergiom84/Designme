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
  validateExportBundlePayload,
  validateExportHtmlPayload,
  validateLocalSetupDetectionResult,
  validateProviderStartPayload,
  validateProviderStatusPayload,
  validateProviderStopPayload,
} = require('./validators.cjs');

function assertTrustedSender(event, isDev) {
  const frameUrl = event.senderFrame?.url || event.sender.getURL();
  if (!isAllowedAppUrl(frameUrl, isDev)) {
    throw new Error('Blocked IPC from untrusted sender');
  }
}

const providerStatusDetectors = {
  'claude-code': () => detectClaudeCode({ checkStatus: true }),
  codex: () => detectCodex({ checkStatus: true }),
};

function registerIpcHandlers(app, isDev) {
  const providerRuns = createProviderRunManager();

  ipcMain.handle('designme:export-html', async (event, payload) => {
    assertTrustedSender(event, isDev);
    validateExportHtmlPayload(payload);

    const { dir, filePath } = timestampedExportPath(app, payload.name, 'html');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, payload.html, 'utf8');
    return { filePath, directory: dir };
  });

  ipcMain.handle('designme:export-bundle', async (event, payload) => {
    assertTrustedSender(event, isDev);
    validateExportBundlePayload(payload);
    return writeExportBundle(app, payload);
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
}

module.exports = {
  registerIpcHandlers,
};
