const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const isDev = process.argv.includes('--dev');

function sanitizeFileName(value) {
  const safe = String(value || 'designme-export')
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return safe || 'designme-export';
}

function exportDirectory() {
  return (
    process.env.DESIGNME_EXPORT_DIR ||
    path.join(app.getPath('documents'), 'Designme', 'exports')
  );
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1120,
    minHeight: 760,
    title: 'Designme Studio',
    backgroundColor: '#f6f2ea',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  if (isDev) {
    await win.loadURL('http://127.0.0.1:5173');
  } else {
    await win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

ipcMain.handle('designme:export-html', async (_event, payload) => {
  if (!payload || typeof payload.html !== 'string') {
    throw new Error('No HTML payload received');
  }

  const dir = exportDirectory();
  await fs.mkdir(dir, { recursive: true });

  const base = sanitizeFileName(payload.name);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(dir, `${base}-${stamp}.html`);
  await fs.writeFile(filePath, payload.html, 'utf8');
  return { filePath, directory: dir };
});

ipcMain.handle('designme:open-exports', async () => {
  const dir = exportDirectory();
  await fs.mkdir(dir, { recursive: true });
  await shell.openPath(dir);
  return { directory: dir };
});

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
