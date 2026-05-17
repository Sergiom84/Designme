const path = require('node:path');
const { app, BrowserWindow, safeStorage } = require('electron');
const { createCspState } = require('./cspState.cjs');
const { registerIpcHandlers } = require('./ipc.cjs');
const { createSecretStore } = require('./secretStore.cjs');
const { configureWindowSecurity } = require('./security.cjs');

const isDev = process.argv.includes('--dev');

let cspState;
let secretStore;

function ensureCspState() {
  if (!cspState) {
    cspState = createCspState({ userDataDir: app.getPath('userData') });
  }
  return cspState;
}

function ensureSecretStore() {
  if (!secretStore) {
    secretStore = createSecretStore({ userDataDir: app.getPath('userData'), safeStorage });
  }
  return secretStore;
}

async function createWindow() {
  const state = ensureCspState();
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

  configureWindowSecurity(win, isDev, { getCspState: () => state.get() });

  if (isDev) {
    await win.loadURL('http://127.0.0.1:5173');
  } else {
    await win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  registerIpcHandlers(app, isDev, {
    cspState: ensureCspState(),
    secretStore: ensureSecretStore(),
  });
  return createWindow();
});

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
