const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { detectClaudeCode } = require('./providers/claude-code.cjs');
const { detectCodex } = require('./providers/codex.cjs');

const OLLAMA_BASE_URL = 'http://127.0.0.1:11434/v1';
const OLLAMA_TAGS_URL = 'http://127.0.0.1:11434/api/tags';

function existsAt(filePath, access = fs.access) {
  return access(filePath)
    .then(() => true)
    .catch(() => false);
}

function firstModelName(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.models)) {
    return undefined;
  }

  const model = value.models.find((item) => item && typeof item.name === 'string' && item.name.trim());
  return model?.name;
}

async function fetchOllamaModel(fetchImpl, timeoutMs) {
  if (typeof fetchImpl !== 'function') {
    return { ok: false, detail: 'Fetch is not available.' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(OLLAMA_TAGS_URL, { method: 'GET', signal: controller.signal });
    if (!response.ok) {
      return { ok: false, detail: `Ollama responded with ${response.status}.` };
    }

    const body = await response.json().catch(() => ({}));
    return {
      ok: true,
      detail: 'Ollama local server detected.',
      model: firstModelName(body),
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : 'Ollama local server is not reachable.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function providerDetection({ id, label, configFound, cli }) {
  const ready = Boolean(cli.available && !cli.statusError);

  return {
    id,
    label,
    detected: Boolean(configFound || cli.available),
    ready,
    configFound: Boolean(configFound),
    cliFound: Boolean(cli.available),
    command: typeof cli.command === 'string' ? cli.command : undefined,
    version: typeof cli.version === 'string' ? cli.version : undefined,
    detail:
      cli.status || cli.statusError || cli.error || (configFound ? 'Local config found.' : 'No local setup detected.'),
  };
}

async function detectLocalSetup(options = {}) {
  const homeDir = options.homeDir || os.homedir();
  const access = options.access || fs.access;
  const fetchImpl = options.fetch || globalThis.fetch;
  const detectClaude = options.detectClaudeCode || detectClaudeCode;
  const detectCodexCli = options.detectCodex || detectCodex;
  const timeoutMs = options.timeoutMs || 1_500;

  const claudeConfigPath = path.join(homeDir, '.claude', 'config.json');
  const codexAuthPath = path.join(homeDir, '.codex', 'auth.json');
  const ollamaConfigPath = path.join(homeDir, '.config', 'ollama');

  const [claudeConfigFound, codexAuthFound, ollamaConfigFound, claudeCli, codexCli, ollamaServer] = await Promise.all([
    existsAt(claudeConfigPath, access),
    existsAt(codexAuthPath, access),
    existsAt(ollamaConfigPath, access),
    detectClaude({ checkStatus: true }),
    detectCodexCli({ checkStatus: true }),
    fetchOllamaModel(fetchImpl, timeoutMs),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    providers: [
      providerDetection({
        id: 'claude-code-cli',
        label: 'Claude Code',
        configFound: claudeConfigFound,
        cli: claudeCli,
      }),
      {
        ...providerDetection({
          id: 'codex-cli',
          label: 'Codex',
          configFound: codexAuthFound,
          cli: codexCli,
        }),
        authFound: codexAuthFound,
      },
    ],
    localOpenAI: {
      id: 'ollama',
      label: 'Ollama',
      detected: Boolean(ollamaConfigFound || ollamaServer.ok),
      ready: Boolean(ollamaServer.ok),
      configFound: Boolean(ollamaConfigFound),
      baseUrl: OLLAMA_BASE_URL,
      model: ollamaServer.model,
      detail: ollamaServer.detail,
    },
  };
}

module.exports = {
  detectLocalSetup,
  existsAt,
  firstModelName,
};
