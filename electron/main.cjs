const path = require('node:path');
const { app, BrowserWindow } = require('electron');
const { registerIpcHandlers } = require('./ipc.cjs');
const { configureWindowSecurity } = require('./security.cjs');

const isDev = process.argv.includes('--dev');

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
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  configureWindowSecurity(win, isDev);

  if (isDev) {
    await win.loadURL('http://127.0.0.1:5173');
  } else {
    await win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

registerIpcHandlers(app);

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
