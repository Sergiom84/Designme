const fs = require('node:fs');
const path = require('node:path');

const FILENAME = 'secrets.json';
const MAX_PLAINTEXT_BYTES = 8 * 1024;
const KEY_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/i;

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return undefined;
  }
}

function safeReadJson(filePath) {
  const raw = safeReadFile(filePath);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function safeWriteJson(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
    return true;
  } catch {
    return false;
  }
}

function assertKey(key) {
  if (typeof key !== 'string' || !KEY_PATTERN.test(key)) {
    throw new Error('Invalid secret key');
  }
}

function assertPlaintext(value) {
  if (typeof value !== 'string') {
    throw new Error('Secret value must be a string');
  }
  if (Buffer.byteLength(value, 'utf8') > MAX_PLAINTEXT_BYTES) {
    throw new Error('Secret value is too large');
  }
}

/**
 * Builds a secret store backed by Electron's OS-level safeStorage (Keychain on
 * macOS, DPAPI on Windows, libsecret on Linux). Secrets are persisted under
 * `userData/secrets.json` as base64-encoded ciphertext per key.
 *
 * If safeStorage is unavailable (no display server on Linux, missing keyring,
 * tests) the store reports `ready=false` and refuses to persist new secrets so
 * we never fall back to plaintext on disk. Callers should treat the API key
 * as session-only in that case.
 */
function createSecretStore(options = {}) {
  const userDataDir = options.userDataDir || '.';
  const filePath = options.filePath || path.join(userDataDir, FILENAME);
  const safeStorage = options.safeStorage;

  function ready() {
    return Boolean(safeStorage && safeStorage.isEncryptionAvailable && safeStorage.isEncryptionAvailable());
  }

  function readAll() {
    return safeReadJson(filePath);
  }

  function writeAll(record) {
    return safeWriteJson(filePath, record);
  }

  return {
    ready,
    filePath,
    has(key) {
      assertKey(key);
      const record = readAll();
      return typeof record[key] === 'string' && record[key].length > 0;
    },
    set(key, value) {
      assertKey(key);
      assertPlaintext(value);
      if (!ready()) {
        return { stored: false };
      }
      const cipher = safeStorage.encryptString(value);
      const record = readAll();
      record[key] = Buffer.from(cipher).toString('base64');
      const stored = writeAll(record);
      return { stored };
    },
    get(key) {
      assertKey(key);
      if (!ready()) return undefined;
      const record = readAll();
      const encoded = record[key];
      if (typeof encoded !== 'string' || encoded.length === 0) return undefined;
      try {
        const cipher = Buffer.from(encoded, 'base64');
        return safeStorage.decryptString(cipher);
      } catch {
        return undefined;
      }
    },
    delete(key) {
      assertKey(key);
      const record = readAll();
      if (!(key in record)) return { deleted: false };
      delete record[key];
      writeAll(record);
      return { deleted: true };
    },
  };
}

module.exports = {
  FILENAME,
  KEY_PATTERN,
  MAX_PLAINTEXT_BYTES,
  createSecretStore,
};
