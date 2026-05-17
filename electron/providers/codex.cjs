const { spawn: nodeSpawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const readline = require('node:readline');
const { extractStandaloneHtmlDocument } = require('./htmlExtraction.cjs');

const DEFAULT_TIMEOUT_MS = 2_500;
const DEFAULT_KILL_TIMEOUT_MS = 5_000;
const DEFAULT_COMMAND = 'codex';

function windowsCliSearchDirs(env = process.env) {
  if (os.platform() !== 'win32') {
    return [];
  }

  const windowsDir = env.SystemRoot || env.windir || 'C:\\Windows';
  const programFiles = env.ProgramFiles || process.env.ProgramFiles || 'C:\\Program Files';

  return [
    path.join(windowsDir, 'System32'),
    windowsDir,
    path.join(programFiles, 'nodejs'),
    env.APPDATA && path.join(env.APPDATA, 'npm'),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Microsoft', 'WindowsApps'),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'OpenAI', 'Codex', 'bin'),
    'C:\\Program Files\\WindowsApps',
  ].filter(Boolean);
}

function withCliPath(env = process.env) {
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') || 'PATH';
  const currentPath = env[pathKey] || '';
  const extraPaths = windowsCliSearchDirs(env).filter((dir) => !currentPath.toLowerCase().includes(String(dir).toLowerCase()));

  if (extraPaths.length === 0) {
    return env;
  }

  return {
    ...env,
    [pathKey]: `${currentPath}${currentPath ? path.delimiter : ''}${extraPaths.join(path.delimiter)}`,
  };
}

function findKnownWindowsExecutable(command, env = process.env) {
  if (os.platform() !== 'win32' || command !== DEFAULT_COMMAND) {
    return null;
  }

  const roots = [
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'OpenAI', 'Codex', 'bin'),
    'C:\\Program Files\\WindowsApps',
  ].filter(Boolean);

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const stack = [root];
    while (stack.length > 0) {
      const dir = stack.pop();
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const entry of entries) {
        const candidate = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.toLowerCase() === `${command}.exe`) {
          return candidate;
        }
        if (entry.isDirectory() && /(?:codex|openai|resources|bin)/i.test(candidate)) {
          stack.push(candidate);
        }
      }
    }
  }

  return null;
}

function resolveWindowsCommand(command, env = process.env) {
  if (os.platform() !== 'win32' || path.extname(command)) {
    return command;
  }

  const knownExecutable = findKnownWindowsExecutable(path.basename(command).toLowerCase(), env);
  if (knownExecutable) {
    return knownExecutable;
  }

  if (path.dirname(command) !== '.') {
    for (const extension of ['.exe', '.cmd', '.bat']) {
      const candidate = `${command}${extension}`;
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') || 'PATH';
  const searchDirs = String(env[pathKey] || '').split(path.delimiter).filter(Boolean);
  const extensions = ['.exe', '.cmd', '.bat'];

  for (const dir of searchDirs) {
    for (const extension of extensions) {
      const candidate = path.join(dir, `${command}${extension}`);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return command;
}

function shouldUseWindowsShell(command) {
  return os.platform() === 'win32' && /\.(?:cmd|bat)$/i.test(command);
}

function createTimeout(ms, onTimeout) {
  const timeout = setTimeout(onTimeout, ms);
  if (typeof timeout.unref === 'function') {
    timeout.unref();
  }
  return timeout;
}

function firstNonEmptyLine(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
}

function nonEmptyLines(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function pickCodexCommand(stdout) {
  const candidates = nonEmptyLines(stdout);
  return (
    candidates.find((line) => /\.exe$/i.test(line)) ||
    candidates.find((line) => /\.(cmd|bat|ps1)$/i.test(line)) ||
    candidates[0] ||
    DEFAULT_COMMAND
  );
}

function runCommand(command, args, options = {}) {
  const spawn = options.spawn || nodeSpawn;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    let child;

    function finish(error, result) {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);

      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }

    const timeoutId = createTimeout(timeoutMs, () => {
      if (child && typeof child.kill === 'function') {
        child.kill('SIGTERM');
      }
      finish(new Error(`${command} ${args.join(' ')} timed out after ${timeoutMs}ms.`));
    });

    try {
      const env = withCliPath(options.env || process.env);
      const commandPath = resolveWindowsCommand(command, env);
      child = spawn(commandPath, args, {
        cwd: options.cwd,
        env,
        shell: shouldUseWindowsShell(commandPath),
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      finish(error);
      return;
    }

    child.stdout?.setEncoding?.('utf8');
    child.stderr?.setEncoding?.('utf8');
    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => finish(error));
    child.on('close', (code) => {
      if (code === 0) {
        finish(null, { stdout, stderr, code });
        return;
      }

      const detail = firstNonEmptyLine(stderr) || firstNonEmptyLine(stdout) || `exit code ${code}`;
      finish(new Error(`${command} ${args.join(' ')} failed: ${detail}`));
    });
  });
}

async function detectCodex(options = {}) {
  const platform = options.platform || os.platform();
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const spawn = options.spawn || nodeSpawn;
  const locator = platform === 'win32' ? 'where.exe' : 'which';

  try {
    const env = withCliPath(options.env || process.env);
    const locateResult = await runCommand(locator, [DEFAULT_COMMAND], { spawn, timeoutMs, env });
    const commandPath = resolveWindowsCommand(pickCodexCommand(locateResult.stdout), env);
    const versionResult = await runCommand(commandPath, ['--version'], { spawn, timeoutMs, env });
    const detection = {
      available: true,
      command: commandPath,
      version: firstNonEmptyLine(versionResult.stdout) || firstNonEmptyLine(versionResult.stderr) || null,
    };

    if (options.checkStatus) {
      try {
        const statusResult = await runCommand(commandPath, ['login', 'status'], { spawn, timeoutMs, env });
        detection.status = firstNonEmptyLine(statusResult.stdout) || firstNonEmptyLine(statusResult.stderr) || null;
      } catch (error) {
        detection.statusError = error instanceof Error ? error.message : String(error);
      }
    }

    return detection;
  } catch (error) {
    return {
      available: false,
      command: DEFAULT_COMMAND,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function requestToPrompt(request) {
  if (typeof request === 'string') {
    return request;
  }

  if (request && typeof request.prompt === 'string') {
    return request.prompt;
  }

  throw new TypeError('Codex request must be a prompt string or an object with a prompt string.');
}

function contentArrayFromValue(value) {
  if (Array.isArray(value?.content)) {
    return value.content;
  }

  if (Array.isArray(value?.message?.content)) {
    return value.message.content;
  }

  return [];
}

function textFromPart(part) {
  if (typeof part === 'string') {
    return part;
  }

  if (typeof part?.text === 'string') {
    return part.text;
  }

  if (typeof part?.content === 'string') {
    return part.content;
  }

  if (Array.isArray(part?.content)) {
    return part.content.map(textFromPart).filter(Boolean).join('');
  }

  return '';
}

function textFromEvent(event) {
  if (typeof event?.delta === 'string') {
    return event.delta;
  }

  if (typeof event?.delta?.text === 'string') {
    return event.delta.text;
  }

  if (typeof event?.text === 'string') {
    return event.text;
  }

  if (typeof event?.message === 'string') {
    return event.message;
  }

  if (typeof event?.message?.text === 'string') {
    return event.message.text;
  }

  if (typeof event?.item?.text === 'string') {
    return event.item.text;
  }

  const parts = [...contentArrayFromValue(event), ...contentArrayFromValue(event?.item)];
  return parts.map(textFromPart).filter(Boolean).join('');
}

function toolCallFromEvent(event) {
  const item = event?.item || event;
  const type = String(item?.type || event?.type || '');

  if (/(result|output)/i.test(type)) {
    return null;
  }

  if (!/(tool|function).*call|call.*(tool|function)/i.test(type)) {
    return null;
  }

  return {
    name: item.name || item.tool_name || item.call_id || item.id || 'tool',
    args: item.arguments || item.args || item.input || {},
  };
}

function toolResultFromEvent(event) {
  const item = event?.item || event;
  const type = String(item?.type || event?.type || '');

  if (!/(tool|function).*(result|output)|(result|output).*(tool|function)/i.test(type)) {
    return null;
  }

  return {
    name: item.name || item.tool_name || item.call_id || item.id || 'tool',
    result: item.output || item.result || item.content || '',
  };
}

function finalTextFromEvent(event) {
  if (typeof event?.result === 'string') {
    return event.result;
  }

  if (typeof event?.final_output === 'string') {
    return event.final_output;
  }

  if (typeof event?.last_message === 'string') {
    return event.last_message;
  }

  return '';
}

function normalizeCodexEvent(event) {
  const normalized = [];
  const toolCall = toolCallFromEvent(event);
  const toolResult = toolResultFromEvent(event);
  const text = textFromEvent(event);
  const finalText = finalTextFromEvent(event);

  if (toolCall) {
    normalized.push({ type: 'tool-call', ...toolCall, raw: event });
  }

  if (toolResult) {
    normalized.push({ type: 'tool-result', ...toolResult, raw: event });
  }

  if (text) {
    normalized.push({ type: 'token', text, raw: event });
  }

  if (finalText) {
    normalized.push({ type: 'final', text: finalText, raw: event });
  }

  return normalized;
}

function extractHtmlFromCodexText(text) {
  return extractStandaloneHtmlDocument(text);
}

function createEmitter(callbacks) {
  return (event) => {
    callbacks.onEvent?.(event);

    if (event.type === 'token') {
      callbacks.onToken?.(event.text, event);
    }

    if (event.type === 'tool-call') {
      callbacks.onToolCall?.(event);
    }

    if (event.type === 'tool-result') {
      callbacks.onToolResult?.(event);
    }

    if (event.type === 'final') {
      callbacks.onFinal?.(event);
    }
  };
}

function splitCallbacksAndOptions(callbacksOrOptions, maybeOptions) {
  const callbackKeys = new Set(['onEvent', 'onToken', 'onToolCall', 'onToolResult', 'onFinal', 'onError', 'onExit']);
  const hasCallbacks = Object.keys(callbacksOrOptions || {}).some((key) => callbackKeys.has(key));

  if (callbacksOrOptions?.callbacks || callbacksOrOptions?.options) {
    return {
      callbacks: callbacksOrOptions.callbacks || {},
      options: { ...(callbacksOrOptions.options || {}), ...maybeOptions },
    };
  }

  return {
    callbacks: hasCallbacks ? callbacksOrOptions || {} : {},
    options: hasCallbacks || Object.keys(maybeOptions || {}).length > 0 ? maybeOptions || {} : callbacksOrOptions || {},
  };
}

function startCodexRun(request, callbacksOrOptions = {}, maybeOptions = {}) {
  const { callbacks, options } = splitCallbacksAndOptions(callbacksOrOptions, maybeOptions);
  const spawn = options.spawn || nodeSpawn;
  const env = withCliPath(options.env || process.env);
  const command = options.command || resolveWindowsCommand(DEFAULT_COMMAND, env);
  const killTimeoutMs = options.killTimeoutMs || DEFAULT_KILL_TIMEOUT_MS;
  const prompt = requestToPrompt(request);
  const cwd = options.cwd || process.cwd();
  const args = [
    '--ask-for-approval',
    'never',
    'exec',
    '--json',
    '--sandbox',
    'read-only',
    '--skip-git-repo-check',
    '-C',
    cwd,
    ...(options.extraArgs || []),
    '-',
  ];
  const emit = createEmitter(callbacks);
  let finalText = '';
  let killTimeoutId = null;
  let finished = false;

  const child = spawn(command, args, {
    cwd,
    env,
    shell: shouldUseWindowsShell(command),
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  child.stdout?.setEncoding?.('utf8');
  child.stderr?.setEncoding?.('utf8');
  child.stdin?.end?.(prompt);

  const done = new Promise((resolve, reject) => {
    let stderr = '';
    let settled = false;

    function finish(error, result) {
      if (settled) {
        return;
      }

      settled = true;
      finished = true;
      if (killTimeoutId) {
        clearTimeout(killTimeoutId);
      }
      if (request?.signal) {
        request.signal.removeEventListener('abort', stop);
      }

      if (error) {
        callbacks.onError?.(error);
        reject(error);
      } else {
        resolve(result);
      }
    }

    const rl = readline.createInterface({ input: child.stdout });

    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }

      try {
        const raw = JSON.parse(trimmed);
        const events = normalizeCodexEvent(raw);
        callbacks.onRaw?.(raw);

        for (const event of events) {
          if (event.type === 'token') {
            finalText += event.text;
          }
          if (event.type === 'final') {
            finalText = event.text || finalText;
          }
          emit(event);
        }
      } catch (error) {
        const parseError = {
          type: 'parse-error',
          line: trimmed,
          message: error instanceof Error ? error.message : String(error),
        };
        callbacks.onEvent?.(parseError);
      }
    });

    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => finish(error));
    child.on('close', (code, signal) => {
      rl.close();
      callbacks.onExit?.({ code, signal, stderr });

      if (code === 0 || signal === 'SIGTERM' || (request?.signal?.aborted && signal === 'SIGKILL')) {
        finish(null, { code, signal, stderr, finalText });
        return;
      }

      const detail = firstNonEmptyLine(stderr) || `exit code ${code}`;
      finish(new Error(`Codex run failed: ${detail}`));
    });
  });

  function stop() {
    if (finished) {
      return;
    }

    if (!child.killed) {
      child.kill('SIGTERM');
    }

    if (!killTimeoutId) {
      killTimeoutId = createTimeout(killTimeoutMs, () => {
        if (!finished) {
          child.kill('SIGKILL');
        }
      });
    }
  }

  if (request?.signal) {
    if (request.signal.aborted) {
      stop();
    } else {
      request.signal.addEventListener('abort', stop, { once: true });
    }
  }

  return { child, args, stop, done };
}

module.exports = {
  detectCodex,
  extractHtmlFromCodexText,
  normalizeCodexEvent,
  pickCodexCommand,
  resolveWindowsCommand,
  runCommand,
  shouldUseWindowsShell,
  startCodexRun,
  withCliPath,
};
