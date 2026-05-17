const { spawn: nodeSpawn } = require('node:child_process');
const os = require('node:os');
const readline = require('node:readline');
const { extractStandaloneHtmlDocument } = require('./htmlExtraction.cjs');

const DEFAULT_TIMEOUT_MS = 2_500;
const DEFAULT_KILL_TIMEOUT_MS = 5_000;
const DEFAULT_COMMAND = 'claude';

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
      child = spawn(command, args, {
        cwd: options.cwd,
        env: options.env,
        shell: false,
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

async function detectClaudeCode(options = {}) {
  const platform = options.platform || os.platform();
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const spawn = options.spawn || nodeSpawn;
  const locator = platform === 'win32' ? 'where' : 'which';

  try {
    const locateResult = await runCommand(locator, [DEFAULT_COMMAND], { spawn, timeoutMs, env: options.env });
    const commandPath = firstNonEmptyLine(locateResult.stdout) || DEFAULT_COMMAND;
    const versionResult = await runCommand(commandPath, ['--version'], { spawn, timeoutMs, env: options.env });
    const detection = {
      available: true,
      command: commandPath,
      version: firstNonEmptyLine(versionResult.stdout) || firstNonEmptyLine(versionResult.stderr) || null,
    };

    // Login/auth state is not introspectable via a side-effect-free CLI call
    // (`/status` is a REPL slash command and `claude config get` requires args).
    // Surface CLI presence + version only; an auth failure will surface from the
    // first real run as a normal provider error event.
    if (options.checkStatus) {
      detection.status = `CLI detected${detection.version ? ` (${detection.version})` : ''}.`;
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

  throw new TypeError('Claude Code request must be a prompt string or an object with a prompt string.');
}

function contentArrayFromEvent(event) {
  if (Array.isArray(event?.message?.content)) {
    return event.message.content;
  }

  if (Array.isArray(event?.content)) {
    return event.content;
  }

  return [];
}

function normalizeClaudeEvent(event) {
  const normalized = [];

  if (event?.type === 'assistant') {
    for (const part of contentArrayFromEvent(event)) {
      if (part?.type === 'text' && typeof part.text === 'string') {
        normalized.push({ type: 'token', text: part.text, raw: event });
      }

      if (part?.type === 'tool_use') {
        normalized.push({
          type: 'tool-call',
          name: part.name || part.id || 'tool',
          args: part.input || {},
          raw: event,
        });
      }
    }
  }

  if (event?.type === 'user') {
    for (const part of contentArrayFromEvent(event)) {
      if (part?.type === 'tool_result') {
        normalized.push({
          type: 'tool-result',
          name: part.tool_use_id || part.name || 'tool',
          result: part.content,
          raw: event,
        });
      }
    }
  }

  if (event?.type === 'result') {
    normalized.push({
      type: 'final',
      text: typeof event.result === 'string' ? event.result : '',
      raw: event,
    });
  }

  return normalized;
}

function extractHtmlFromClaudeText(text) {
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

function startClaudeCodeRun(request, callbacksOrOptions = {}, maybeOptions = {}) {
  const { callbacks, options } = splitCallbacksAndOptions(callbacksOrOptions, maybeOptions);
  const spawn = options.spawn || nodeSpawn;
  const command = options.command || DEFAULT_COMMAND;
  const killTimeoutMs = options.killTimeoutMs || DEFAULT_KILL_TIMEOUT_MS;
  const prompt = requestToPrompt(request);
  const args = [
    '-p',
    '--output-format',
    'stream-json',
    '--input-format',
    'text',
    '--permission-mode',
    'bypassPermissions',
    '--disallowedTools',
    'Bash',
    'Edit',
    'MultiEdit',
    'NotebookEdit',
    'Write',
    'WebFetch',
    'WebSearch',
    ...(options.extraArgs || []),
  ];
  const emit = createEmitter(callbacks);
  let finalText = '';
  let killTimeoutId = null;
  let finished = false;

  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    shell: false,
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
        const events = normalizeClaudeEvent(raw);
        callbacks.onRaw?.(raw);

        for (const event of events) {
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

      if (code === 0 || signal === 'SIGTERM') {
        finish(null, { code, signal, stderr, finalText });
        return;
      }

      const detail = firstNonEmptyLine(stderr) || `exit code ${code}`;
      finish(new Error(`Claude Code run failed: ${detail}`));
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
  detectClaudeCode,
  extractHtmlFromClaudeText,
  normalizeClaudeEvent,
  runCommand,
  startClaudeCodeRun,
};
