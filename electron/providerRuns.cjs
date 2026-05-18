const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { extractHtmlFromClaudeText, startClaudeCodeRun } = require('./providers/claude-code.cjs');
const { extractHtmlFromCodexText, startCodexRun } = require('./providers/codex.cjs');
const { extractStandaloneHtmlDocument } = require('./providers/htmlExtraction.cjs');
const { validateProviderEventPayload, validateProviderStartPayload } = require('./validators.cjs');

// Shared retry-signal message. Must match `INVALID_HTML_ERROR_MESSAGE` in
// `src/providers/htmlExtraction.ts` so `useGenerate` can detect the error and
// fire a single automatic retry with a stricter format hint, regardless of
// which provider produced the failure.
const INVALID_HTML_ERROR_MESSAGE = 'Provider did not return a complete standalone HTML document.';
const CLOUD_PROVIDER_SYSTEM_PROMPT =
  'Return one complete standalone HTML document only. Include CSS and JavaScript inline.';
const DEFAULT_CLOUD_PROVIDER_CONFIGS = {
  'anthropic-api': {
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-5-20250929',
  },
  'openai-api': {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
  },
};

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

function cleanText(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeBaseUrl(value, fallback) {
  return cleanText(value, fallback).replace(/\/+$/, '');
}

function cloudProviderConfig(providerId, config = {}) {
  const defaults = DEFAULT_CLOUD_PROVIDER_CONFIGS[providerId];
  return {
    baseUrl: normalizeBaseUrl(config.baseUrl, defaults.baseUrl),
    model: cleanText(config.model, defaults.model),
  };
}

function openAITextDelta(chunk) {
  return chunk?.choices?.[0]?.delta?.content || '';
}

function anthropicTextDelta(event) {
  if (event?.type !== 'content_block_delta') return '';
  if (event.delta?.type !== 'text_delta') return '';
  return event.delta.text || '';
}

async function streamOpenAI({ apiKey, config, prompt, signal }, events) {
  const client = new OpenAI({
    apiKey,
    baseURL: config.baseUrl,
  });
  const stream = await client.chat.completions.create(
    {
      model: config.model,
      messages: [
        { role: 'system', content: CLOUD_PROVIDER_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      stream: true,
      temperature: 0.7,
    },
    { signal },
  );
  let text = '';

  for await (const chunk of stream) {
    const token = openAITextDelta(chunk);
    if (!token) continue;
    text += token;
    events.onToken?.(token);
  }

  events.onFinal?.({ text });
  return text;
}

async function streamAnthropic({ apiKey, config, prompt, signal }, events) {
  const client = new Anthropic({
    apiKey,
    baseURL: config.baseUrl,
  });
  const stream = client.messages.stream(
    {
      model: config.model,
      max_tokens: 8192,
      system: CLOUD_PROVIDER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    },
    { signal },
  );
  let text = '';

  for await (const event of stream) {
    const token = anthropicTextDelta(event);
    if (!token) continue;
    text += token;
    events.onToken?.(token);
  }

  if (!text) {
    text = await stream.finalText().catch(() => '');
  }

  events.onFinal?.({ text });
  return text;
}

function createCloudProviderHandler(providerId, secretStore) {
  const isOpenAI = providerId === 'openai-api';
  const isAnthropic = providerId === 'anthropic-api';
  if (!isOpenAI && !isAnthropic) return undefined;

  return {
    errorMessage: INVALID_HTML_ERROR_MESSAGE,
    extractHtml: extractStandaloneHtmlDocument,
    workspaceName: isOpenAI ? 'designme-openai-api' : 'designme-anthropic-api',
    async startRun({ prompt, signal, providerConfig }, events) {
      const key = secretStore?.get?.(isOpenAI ? 'openai-api.apiKey' : 'anthropic-api.apiKey');
      if (!key) {
        throw new Error(`${isOpenAI ? 'OpenAI' : 'Anthropic'} API key is not configured.`);
      }

      const config = cloudProviderConfig(providerId, providerConfig);
      if (isOpenAI) {
        const text = await streamOpenAI({ apiKey: key, config, prompt, signal }, events);
        return { done: Promise.resolve({ finalText: text }) };
      }

      const text = await streamAnthropic({ apiKey: key, config, prompt, signal }, events);
      return { done: Promise.resolve({ finalText: text }) };
    },
    notes({ providerConfig } = {}) {
      const config = cloudProviderConfig(providerId, providerConfig);
      return isOpenAI
        ? `Generated with OpenAI API (${config.model}).`
        : `Generated with Anthropic API (${config.model}).`;
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
    { prompt: payload.prompt, signal, providerConfig: payload.providerConfig },
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
        const notes = typeof handler.notes === 'function' ? handler.notes(payload) : handler.notes;
        emit({ type: 'final', html, notes });
      },
    },
    { cwd: providerWorkspace(handler.workspaceName) },
  );

  const result = await run.done;
  if (!emittedTerminal) {
    const html = handler.extractHtml(result.finalText || '');
    if (html) {
      const notes = typeof handler.notes === 'function' ? handler.notes(payload) : handler.notes;
      emit({ type: 'final', html, notes });
      return;
    }

    emit({ type: 'error', message: handler.errorMessage });
  }
}

function createDefaultProviderAdapter(options = {}) {
  return {
    async start({ payload, signal, emit }) {
      const handler =
        providerHandlers[payload.providerId] || createCloudProviderHandler(payload.providerId, options.secretStore);
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
