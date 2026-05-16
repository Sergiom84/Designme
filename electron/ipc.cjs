const { clipboard, ipcMain, shell } = require('electron');
const fs = require('node:fs/promises');
const { writeExportBundle } = require('./exportBundle.cjs');
const { exportDirectory, timestampedExportPath } = require('./paths.cjs');
const { isAllowedAppUrl } = require('./security.cjs');
const { validateClipboardText, validateExportBundlePayload, validateExportHtmlPayload } = require('./validators.cjs');

function assertTrustedSender(event, isDev) {
  const frameUrl = event.senderFrame?.url || event.sender.getURL();
  if (!isAllowedAppUrl(frameUrl, isDev)) {
    throw new Error('Blocked IPC from untrusted sender');
  }
}

function registerIpcHandlers(app, isDev) {
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
}

module.exports = {
  registerIpcHandlers,
};
