const path = require('node:path');

function sanitizeFileName(value) {
  const safe = String(value || 'designme-export')
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return safe || 'designme-export';
}

function exportDirectory(app) {
  return (
    process.env.DESIGNME_EXPORT_DIR ||
    path.join(app.getPath('documents'), 'Designme', 'exports')
  );
}

function timestampedExportPath(app, name, extension) {
  const dir = exportDirectory(app);
  const base = sanitizeFileName(name);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    dir,
    filePath: path.join(dir, `${base}-${stamp}.${extension}`),
  };
}

module.exports = {
  exportDirectory,
  sanitizeFileName,
  timestampedExportPath,
};
