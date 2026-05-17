const path = require('node:path');
const fs = require('node:fs');
const { app, BrowserWindow, safeStorage } = require('electron');
const { createCspState } = require('./cspState.cjs');
const { registerIpcHandlers } = require('./ipc.cjs');
const { createSecretStore } = require('./secretStore.cjs');
const { configureWindowSecurity } = require('./security.cjs');

const isDev = process.argv.includes('--dev');

let cspState;
let secretStore;
let logger;

function createAppLogger() {
  const logPath = path.join(app.getPath('userData'), 'designme.log');

  function write(level, message, meta) {
    const entry = {
      time: new Date().toISOString(),
      level,
      message,
      ...(meta ? { meta } : {}),
    };

    try {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      fs.appendFileSync(logPath, `${JSON.stringify(entry)}\n`, 'utf8');
    } catch (error) {
      console.error('Failed to write Designme log', error);
    }
  }

  return {
    path: logPath,
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
  };
}

function ensureLogger() {
  if (!logger) {
    logger = createAppLogger();
  }
  return logger;
}

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
  const appLogger = ensureLogger();
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
  installWindowDiagnostics(win, appLogger);

  if (isDev) {
    appLogger.info('Loading development renderer', { url: 'http://127.0.0.1:5173' });
    await win.loadURL('http://127.0.0.1:5173');
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    appLogger.info('Loading production renderer', { indexPath });
    await win.loadFile(indexPath);
  }

  if (process.env.DESIGNME_DEBUG === '1') {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

function installWindowDiagnostics(win, appLogger) {
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    appLogger.error('Renderer failed to load', { errorCode, errorDescription, validatedURL });
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    appLogger.error('Renderer process gone', details);
  });

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    appLogger.info('Renderer console message', { level, message, line, sourceId });
  });
}

app.whenReady().then(() => {
  const appLogger = ensureLogger();
  appLogger.info('App starting', {
    isDev,
    version: app.getVersion(),
    userData: app.getPath('userData'),
    logPath: appLogger.path,
  });
  registerIpcHandlers(app, isDev, {
    cspState: ensureCspState(),
    logger: appLogger,
    secretStore: ensureSecretStore(),
  });
  return createWindow();
});

process.on('uncaughtException', (error) => {
  ensureLogger().error('Main process uncaught exception', {
    message: error.message,
    stack: error.stack,
  });
});

process.on('unhandledRejection', (reason) => {
  ensureLogger().error('Main process unhandled rejection', {
    reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : String(reason),
  });
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
