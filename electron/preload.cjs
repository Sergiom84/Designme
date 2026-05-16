const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('designme', {
  exportBundle: (payload) => ipcRenderer.invoke('designme:export-bundle', payload),
  exportHtml: (payload) => ipcRenderer.invoke('designme:export-html', payload),
  openExports: () => ipcRenderer.invoke('designme:open-exports'),
  copyText: (text) => ipcRenderer.invoke('designme:copy-text', text),
});
