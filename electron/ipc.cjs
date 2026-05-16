const { clipboard, ipcMain, shell } = require('electron');
const fs = require('node:fs/promises');
const { writeExportBundle } = require('./exportBundle.cjs');
const { exportDirectory, timestampedExportPath } = require('./paths.cjs');
const { validateClipboardText, validateExportBundlePayload, validateExportHtmlPayload } = require('./validators.cjs');

function registerIpcHandlers(app) {
  ipcMain.handle('designme:export-html', async (_event, payload) => {
    validateExportHtmlPayload(payload);

    const { dir, filePath } = timestampedExportPath(app, payload.name, 'html');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, payload.html, 'utf8');
    return { filePath, directory: dir };
  });

  ipcMain.handle('designme:export-bundle', async (_event, payload) => {
    validateExportBundlePayload(payload);
    return writeExportBundle(app, payload);
  });

  ipcMain.handle('designme:open-exports', async () => {
    const dir = exportDirectory(app);
    await fs.mkdir(dir, { recursive: true });
    await shell.openPath(dir);
    return { directory: dir };
  });

  ipcMain.handle('designme:copy-text', async (_event, text) => {
    validateClipboardText(text);
    clipboard.writeText(text);
  });
}

module.exports = {
  registerIpcHandlers,
};
