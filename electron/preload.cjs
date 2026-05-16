const { clipboard, contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('designme', {
  exportHtml: (payload) => ipcRenderer.invoke('designme:export-html', payload),
  openExports: () => ipcRenderer.invoke('designme:open-exports'),
  copyText: (text) => clipboard.writeText(String(text || '')),
});
