function isAllowedAppUrl(url, isDev) {
  if (isDev) {
    return url.startsWith('http://127.0.0.1:5173') || url.startsWith('ws://127.0.0.1:5173');
  }
  return url.startsWith('file://');
}

// CSP headers are baked into the document at load time, so once the renderer
// is up its connect-src directive cannot be tightened without a reload. To
// support a dynamic toggle, the document CSP keeps the wider host list
// (127.0.0.1/localhost) and the actual gating happens at the network layer
// via `installNetworkGate`, which consults the live CSP state on every
// outbound request.
function localProviderConnectSources() {
  return ['http://127.0.0.1:*', 'http://localhost:*'];
}

function contentSecurityPolicy(isDev) {
  if (isDev) {
    const connectSources = [
      "'self'",
      'http://127.0.0.1:5173',
      'ws://127.0.0.1:5173',
      ...localProviderConnectSources(),
    ];

    return [
      "default-src 'self' http://127.0.0.1:5173",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:5173",
      "style-src 'self' 'unsafe-inline' http://127.0.0.1:5173",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      `connect-src ${connectSources.join(' ')}`,
      "object-src 'none'",
      "base-uri 'self'",
      "frame-src 'self'",
    ].join('; ');
  }

  const connectSources = ["'self'", ...localProviderConnectSources()];

  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-src 'self'",
  ].join('; ');
}

function applyContentSecurityPolicy(win, isDev) {
  const csp = contentSecurityPolicy(isDev);
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });
}

const LOCAL_HOST_PATTERN = /^(?:https?|wss?):\/\/(?:127\.0\.0\.1|localhost)(?::(\d+))?(?:\/|$)/i;
const VITE_DEV_PORT = '5173';

/**
 * Decides whether a renderer-originated request to a local host should be
 * allowed. The Vite dev server (127.0.0.1:5173) is always permitted; every
 * other 127.0.0.1/localhost port is only reachable when `allowLocalProvider`
 * is true, i.e. when the user has explicitly switched to the local-openai
 * provider. Non-local URLs are always allowed at this layer; document CSP
 * still blocks anything outside `connect-src`.
 */
function shouldAllowRequest(url, state, isDev) {
  const match = LOCAL_HOST_PATTERN.exec(url);
  if (!match) return true;
  const port = match[1];
  if (isDev && port === VITE_DEV_PORT) {
    return true;
  }
  return Boolean(state?.allowLocalProvider);
}

function installNetworkGate(win, getState, isDev) {
  win.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    const allowed = shouldAllowRequest(details.url, getState(), isDev);
    callback({ cancel: !allowed });
  });
}

function configureWindowSecurity(win, isDev, opts = {}) {
  applyContentSecurityPolicy(win, isDev);

  if (typeof opts.getCspState === 'function') {
    installNetworkGate(win, opts.getCspState, isDev);
  }

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedAppUrl(url, isDev)) {
      event.preventDefault();
    }
  });

  win.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
}

module.exports = {
  applyContentSecurityPolicy,
  configureWindowSecurity,
  contentSecurityPolicy,
  installNetworkGate,
  isAllowedAppUrl,
  shouldAllowRequest,
};
