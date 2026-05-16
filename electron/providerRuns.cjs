const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { extractHtmlFromClaudeText, startClaudeCodeRun } = require('./providers/claude-code.cjs');
const { validateProviderEventPayload, validateProviderStartPayload } = require('./validators.cjs');

function claudeCodeWorkspace() {
  const workspace = path.join(os.tmpdir(), 'designme-claude-code');
  fs.mkdirSync(workspace, { recursive: true });
  return workspace;
}

function createDefaultProviderAdapter() {
  return {
    async start({ payload, signal, emit }) {
      if (payload.providerId !== 'claude-code') {
        emit({ type: 'error', message: `Provider ${payload.providerId} is not available in desktop IPC.` });
        return;
      }

      emit({ type: 'started' });

      let emittedTerminal = false;
      const run = startClaudeCodeRun(
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
            const html = extractHtmlFromClaudeText(event.text || '');
            if (!html) {
              emittedTerminal = true;
              emit({ type: 'error', message: 'Claude Code did not return a complete standalone HTML document.' });
              return;
            }
            emittedTerminal = true;
            emit({ type: 'final', html, notes: 'Generated with Claude Code.' });
          },
        },
        { cwd: claudeCodeWorkspace() },
      );

      const result = await run.done;
      if (!emittedTerminal) {
        const html = extractHtmlFromClaudeText(result.finalText || '');
        if (html) {
          emit({ type: 'final', html, notes: 'Generated with Claude Code.' });
          return;
        }

        emit({ type: 'error', message: 'Claude Code did not return a complete standalone HTML document.' });
      }
    },
  };
}

function createProviderRunManager(adapter) {
  const runs = new Map();
  const providerAdapter = adapter || createDefaultProviderAdapter();

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
