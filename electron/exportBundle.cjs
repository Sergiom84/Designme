const fs = require('node:fs/promises');
const path = require('node:path');
const { exportDirectory, sanitizeFileName } = require('./paths.cjs');

const bundleFiles = ['index.html', 'styles.css', 'script.js', 'designme.json', 'handoff.md', 'README.md'];

function timestampedBundleDirectory(app, name) {
  const baseDir = exportDirectory(app);
  const base = sanitizeFileName(name || 'designme-bundle');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(baseDir, `${base}-${stamp}`);
}

async function writeExportBundle(app, payload) {
  const directory = timestampedBundleDirectory(app, payload.name);
  const resolvedDirectory = path.resolve(directory);
  const resolvedExports = path.resolve(exportDirectory(app));
  const relative = path.relative(resolvedExports, resolvedDirectory);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Bundle path escapes export directory');
  }

  await fs.mkdir(directory, { recursive: true });
  await Promise.all(
    bundleFiles.map((fileName) => fs.writeFile(path.join(directory, fileName), payload.files[fileName], 'utf8')),
  );

  return {
    directory,
    filePath: path.join(directory, 'index.html'),
  };
}

module.exports = {
  bundleFiles,
  writeExportBundle,
};
