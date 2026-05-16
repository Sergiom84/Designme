function isAllowedAppUrl(url, isDev) {
  if (isDev) {
    return url.startsWith('http://127.0.0.1:5173') || url.startsWith('ws://127.0.0.1:5173');
  }
  return url.startsWith('file://');
}

function localProviderConnectSources(opts) {
  return opts?.allowLocalProvider ? ['http://127.0.0.1:*', 'http://localhost:*'] : [];
}

function contentSecurityPolicy(isDev, opts) {
  if (isDev) {
    const connectSources = [
      "'self'",
      'http://127.0.0.1:5173',
      'ws://127.0.0.1:5173',
      ...localProviderConnectSources(opts),
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

  const connectSources = ["'self'", ...localProviderConnectSources(opts)];

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

function applyContentSecurityPolicy(win, isDev, opts) {
  const csp = contentSecurityPolicy(isDev, opts);
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });
}

function configureWindowSecurity(win, isDev, opts) {
  applyContentSecurityPolicy(win, isDev, opts);

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
  isAllowedAppUrl,
};
