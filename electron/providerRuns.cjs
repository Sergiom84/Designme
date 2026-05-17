const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { extractHtmlFromClaudeText, startClaudeCodeRun } = require('./providers/claude-code.cjs');
const { extractHtmlFromCodexText, startCodexRun } = require('./providers/codex.cjs');
const { validateProviderEventPayload, validateProviderStartPayload } = require('./validators.cjs');

// Shared retry-signal message. Must match `INVALID_HTML_ERROR_MESSAGE` in
// `src/providers/htmlExtraction.ts` so `useGenerate` can detect the error and
// fire a single automatic retry with a stricter format hint, regardless of
// which provider produced the failure.
const INVALID_HTML_ERROR_MESSAGE = 'Provider did not return a complete standalone HTML document.';

const providerHandlers = {
  'claude-code-cli': {
    errorMessage: INVALID_HTML_ERROR_MESSAGE,
    extractHtml: extractHtmlFromClaudeText,
    notes: 'Generated with Claude Code.',
    startRun: startClaudeCodeRun,
    workspaceName: 'designme-claude-code',
  },
  'codex-cli': {
    errorMessage: INVALID_HTML_ERROR_MESSAGE,
    extractHtml: extractHtmlFromCodexText,
    notes: 'Generated with Codex.',
    startRun: startCodexRun,
    workspaceName: 'designme-codex',
  },
};

function extractStandaloneHtml(text) {
  const match = String(text || '').match(/<!doctype html[\s\S]*<\/html>/i);
  return match?.[0];
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Cloud provider request failed with ${response.status}: ${text.slice(0, 240)}`);
  }
  return JSON.parse(text);
}

function createCloudProviderHandler(providerId, secretStore) {
  const isOpenAI = providerId === 'openai-api';
  const isAnthropic = providerId === 'anthropic-api';
  if (!isOpenAI && !isAnthropic) return undefined;

  return {
    errorMessage: INVALID_HTML_ERROR_MESSAGE,
    extractHtml: extractStandaloneHtml,
    notes: isOpenAI ? 'Generated with OpenAI API.' : 'Generated with Anthropic API.',
    workspaceName: isOpenAI ? 'designme-openai-api' : 'designme-anthropic-api',
    async startRun({ prompt, signal }, events) {
      const key = secretStore?.get?.(isOpenAI ? 'openai-api.apiKey' : 'anthropic-api.apiKey');
      if (!key) {
        throw new Error(`${isOpenAI ? 'OpenAI' : 'Anthropic'} API key is not configured.`);
      }

      if (isOpenAI) {
        const json = await fetchJson('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            messages: [
              { role: 'system', content: 'Return one complete standalone HTML document only.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
          }),
          signal,
        });
        const text = json.choices?.[0]?.message?.content || '';
        events.onToken?.(text);
        events.onFinal?.({ text });
        return { done: Promise.resolve({ finalText: text }) };
      }

      const json = await fetchJson('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: 'Return one complete standalone HTML document only.',
          messages: [{ role: 'user', content: prompt }],
        }),
        signal,
      });
      const text = (json.content || []).map((block) => (block.type === 'text' ? block.text : '')).join('');
      events.onToken?.(text);
      events.onFinal?.({ text });
      return { done: Promise.resolve({ finalText: text }) };
    },
  };
}

function providerWorkspace(workspaceName) {
  const workspace = path.join(os.tmpdir(), workspaceName);
  fs.mkdirSync(workspace, { recursive: true });
  return workspace;
}

async function startCliProviderRun(handler, { payload, signal, emit }) {
  if (signal.aborted) {
    return;
  }

  emit({ type: 'started' });

  let emittedTerminal = false;
  const run = await handler.startRun(
    { prompt: payload.prompt, signal },
    {
      onToken(text) {
        emit({ type: 'token', text });
      },
      onToolCall(event) {
        emit({ type: 'tool-call', name: event.name, args: event.args });
      },
      onToolResult(event) {
        emit({ type: 'tool-result', name: event.name, result: event.result });
      },
      onFinal(event) {
        const html = handler.extractHtml(event.text || '');
        if (!html) {
          emittedTerminal = true;
          emit({ type: 'error', message: handler.errorMessage });
          return;
        }
        emittedTerminal = true;
        emit({ type: 'final', html, notes: handler.notes });
      },
    },
    { cwd: providerWorkspace(handler.workspaceName) },
  );

  const result = await run.done;
  if (!emittedTerminal) {
    const html = handler.extractHtml(result.finalText || '');
    if (html) {
      emit({ type: 'final', html, notes: handler.notes });
      return;
    }

    emit({ type: 'error', message: handler.errorMessage });
  }
}

function createDefaultProviderAdapter(options = {}) {
  return {
    async start({ payload, signal, emit }) {
      const handler = providerHandlers[payload.providerId] || createCloudProviderHandler(payload.providerId, options.secretStore);
      if (!handler) {
        emit({ type: 'error', message: `Provider ${payload.providerId} is not available in desktop IPC.` });
        return;
      }

      await startCliProviderRun(handler, { payload, signal, emit });
    },
  };
}

function createProviderRunManager(adapterOrOptions) {
  const runs = new Map();
  const providerAdapter =
    adapterOrOptions && typeof adapterOrOptions.start === 'function'
      ? adapterOrOptions
      : createDefaultProviderAdapter(adapterOrOptions || {});

  async function start(webContents, payload) {
    validateProviderStartPayload(payload);

    const runId = randomUUID();
    const controller = new AbortController();
    const onDestroyed = () => {
      controller.abort();
      runs.delete(runId);
    };
    const cleanupDestroyedListener = () => {
      if (typeof webContents.removeListener === 'function') {
        webContents.removeListener('destroyed', onDestroyed);
      } else if (typeof webContents.off === 'function') {
        webContents.off('destroyed', onDestroyed);
      }
    };
    const run = {
      cleanupDestroyedListener,
      controller,
      webContentsId: webContents.id,
    };
    runs.set(runId, run);

    if (typeof webContents.once === 'function') {
      webContents.once('destroyed', onDestroyed);
    }

    const emit = (event) => {
      if (!runs.has(runId) || webContents.isDestroyed()) {
        return;
      }

      const payloadWithRunId = { ...event, runId };
      validateProviderEventPayload(payloadWithRunId);
      webContents.send('designme:provider-event', payloadWithRunId);
    };

    Promise.resolve()
      .then(() => providerAdapter.start({ payload, runId, signal: controller.signal, emit }))
      .catch((error) => {
        emit({ type: 'error', message: error instanceof Error ? error.message : 'Provider run failed.' });
      })
      .finally(() => {
        run.cleanupDestroyedListener();
        runs.delete(runId);
      });

    return { runId };
  }

  function stop(webContents, runId) {
    const run = runs.get(runId);
    if (!run || run.webContentsId !== webContents.id) {
      return { stopped: false };
    }

    run.controller.abort();
    run.cleanupDestroyedListener();
    runs.delete(runId);

    if (!webContents.isDestroyed()) {
      const stoppedEvent = { runId, type: 'stopped' };
      validateProviderEventPayload(stoppedEvent);
      webContents.send('designme:provider-event', stoppedEvent);
    }

    return { stopped: true };
  }

  return {
    start,
    stop,
  };
}

module.exports = {
  createDefaultProviderAdapter,
  createProviderRunManager,
};
