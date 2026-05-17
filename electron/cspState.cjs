const fs = require('node:fs');
const path = require('node:path');

const STATE_FILENAME = 'csp-state.json';

function safeReadState(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.allowLocalProvider === 'boolean') {
      return { allowLocalProvider: parsed.allowLocalProvider };
    }
  } catch {
    // Treat missing or malformed state as "deny" — local network access stays
    // off until the user explicitly enables a local-openai provider.
  }
  return { allowLocalProvider: false };
}

function safeWriteState(filePath, state) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(state), 'utf8');
  } catch {
    // Persistence is best-effort; runtime state stays correct even when the
    // disk write fails (read-only filesystem, permissions, etc.).
  }
}

/**
 * Builds a mutable CSP/network gating state container backed by a JSON file in
 * the Electron user data directory. The renderer toggles `allowLocalProvider`
 * via IPC when the user switches to or away from the local-openai provider,
 * and the network filter in `security.cjs` reads the current value on every
 * outbound request.
 */
function createCspState(options = {}) {
  const userDataDir = options.userDataDir || '.';
  const filePath = options.filePath || path.join(userDataDir, STATE_FILENAME);
  let state = safeReadState(filePath);

  return {
    get() {
      return { ...state };
    },
    set(patch) {
      const next = { ...state };
      if (typeof patch?.allowLocalProvider === 'boolean') {
        next.allowLocalProvider = patch.allowLocalProvider;
      }
      if (next.allowLocalProvider === state.allowLocalProvider) {
        return state;
      }
      state = next;
      safeWriteState(filePath, state);
      return { ...state };
    },
    filePath,
  };
}

module.exports = {
  createCspState,
  STATE_FILENAME,
};
