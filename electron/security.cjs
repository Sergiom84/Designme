function isAllowedAppUrl(url, isDev) {
  if (isDev) {
    return url.startsWith('http://127.0.0.1:5173') || url.startsWith('ws://127.0.0.1:5173');
  }
  return url.startsWith('file://');
}

function configureWindowSecurity(win, isDev) {
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
};
