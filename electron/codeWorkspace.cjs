const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { dialog } = require('electron');
const ignore = require('ignore');

const MAX_FILE_BYTES = 1024 * 1024;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const MAX_FILES = 5000;
const SKIP_NAMES = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'release', 'coverage']);
const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.rb',
  '.go',
  '.rs',
  '.java',
  '.css',
  '.scss',
  '.html',
  '.md',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
]);

const watchers = new Map();

function assertString(value, message) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(message);
  }
}

function normalizeRoot(rootPath) {
  assertString(rootPath, 'Workspace root must be a string');
  return path.resolve(rootPath);
}

function resolveInside(rootPath, relPath = '') {
  const root = normalizeRoot(rootPath);
  const target = path.resolve(root, relPath);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new Error('Workspace path escapes root');
  }
  return { root, target };
}

function isAllowedFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (filePath.endsWith('.lock')) return false;
  return TEXT_EXTENSIONS.has(ext);
}

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return 'application/json';
  if (ext === '.md') return 'text/markdown';
  if (ext === '.html') return 'text/html';
  if (ext === '.css' || ext === '.scss') return 'text/css';
  return 'text/plain';
}

async function readIgnore(root) {
  const matcher = ignore();
  matcher.add(['node_modules/**', '.git/**', 'dist/**', 'build/**', '.next/**', 'release/**', 'coverage/**', '*.lock']);
  for (const name of ['.gitignore', '.designmeignore']) {
    try {
      matcher.add(await fs.readFile(path.join(root, name), 'utf8'));
    } catch {
      // Optional ignore files.
    }
  }
  return matcher;
}

async function pickWorkspace() {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return {
    canceled: result.canceled,
    rootPath: result.filePaths[0],
  };
}

async function indexWorkspace(rootPath) {
  const root = normalizeRoot(rootPath);
  const matcher = await readIgnore(root);
  const files = [];
  let bytes = 0;
  let capped = false;

  async function walk(dir) {
    if (files.length >= MAX_FILES || bytes >= MAX_TOTAL_BYTES) {
      capped = true;
      return;
    }

    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      const rel = path.relative(root, absolute).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        if (!SKIP_NAMES.has(entry.name) && !matcher.ignores(`${rel}/`)) {
          await walk(absolute);
        }
        continue;
      }
      if (!entry.isFile() || matcher.ignores(rel) || !isAllowedFile(absolute)) continue;
      const stat = await fs.stat(absolute);
      if (stat.size > MAX_FILE_BYTES) continue;
      const content = await fs.readFile(absolute);
      const sha1 = createHash('sha1').update(content).digest('hex');
      files.push({ path: rel, size: stat.size, mime: mimeFor(absolute), sha1 });
      bytes += stat.size;
      if (files.length >= MAX_FILES || bytes >= MAX_TOTAL_BYTES) {
        capped = true;
        break;
      }
    }
  }

  await walk(root);
  return { rootPath: root, files, stats: { fileCount: files.length, bytes, capped } };
}

async function readWorkspaceFile(rootPath, relPath) {
  assertString(relPath, 'Workspace file path must be a string');
  const { target } = resolveInside(rootPath, relPath);
  if (!isAllowedFile(target)) {
    throw new Error('Workspace file type is not allowed');
  }
  const stat = await fs.stat(target);
  if (!stat.isFile() || stat.size > MAX_FILE_BYTES) {
    throw new Error('Workspace file is too large');
  }
  return { content: await fs.readFile(target, 'utf8') };
}

async function loadChokidar() {
  const mod = await import('chokidar');
  return mod.default || mod;
}

async function watchWorkspace(rootPath, webContents) {
  const root = normalizeRoot(rootPath);
  closeWorkspaceWatcher(webContents);
  const chokidar = await loadChokidar();
  const watcher = chokidar.watch(root, {
    ignored: /(^|[\\/])(\.git|node_modules|dist|build|\.next|release|coverage)([\\/]|$)/,
    ignoreInitial: true,
    awaitWriteFinish: true,
  });
  watcher.on('all', (event, changedPath) => {
    if (webContents.isDestroyed()) return;
    webContents.send('designme:code-workspace-change', {
      event,
      path: path.relative(root, changedPath).replace(/\\/g, '/'),
    });
  });
  const onDestroyed = () => {
    watcher.close();
    watchers.delete(webContents.id);
  };
  if (typeof webContents.once === 'function') {
    webContents.once('destroyed', onDestroyed);
  }
  watchers.set(webContents.id, { watcher, onDestroyed });
  return { watching: true };
}

function closeWorkspaceWatcher(webContents) {
  const entry = watchers.get(webContents.id);
  if (!entry) return { stopped: false };
  entry.watcher.close();
  watchers.delete(webContents.id);
  if (typeof webContents.removeListener === 'function') {
    webContents.removeListener('destroyed', entry.onDestroyed);
  } else if (typeof webContents.off === 'function') {
    webContents.off('destroyed', entry.onDestroyed);
  }
  return { stopped: true };
}

module.exports = {
  closeWorkspaceWatcher,
  indexWorkspace,
  pickWorkspace,
  readWorkspaceFile,
  resolveInside,
  watchWorkspace,
};
