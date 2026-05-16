function isAllowedAppUrl(url, isDev) {
  if (isDev) {
    return url.startsWith('http://127.0.0.1:5173') || url.startsWith('ws://127.0.0.1:5173');
  }
  return url.startsWith('file://');
}

function contentSecurityPolicy(isDev) {
  if (isDev) {
    return [
      "default-src 'self' http://127.0.0.1:5173",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:5173",
      "style-src 'self' 'unsafe-inline' http://127.0.0.1:5173",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-src 'self'",
    ].join('; ');
  }

  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
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

function configureWindowSecurity(win, isDev) {
  applyContentSecurityPolicy(win, isDev);

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
  configureWindowSecurity,
  isAllowedAppUrl,
};
