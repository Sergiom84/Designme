import type { GenerateEvent, GenerateRequest, Provider } from './types';

const STUB_DELAY_MS = 800;

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Generation aborted.', 'AbortError'));
      return;
    }

    const timeoutId = globalThis.setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        globalThis.clearTimeout(timeoutId);
        reject(new DOMException('Generation aborted.', 'AbortError'));
      },
      { once: true },
    );
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildStubHtml(req: GenerateRequest): string {
  const title = escapeHtml(req.prompt.trim() || 'Designme prototype');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Claude Code Stub</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f6f2ea;
        color: #181818;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          linear-gradient(135deg, rgba(17, 24, 39, 0.08), transparent 34%),
          #f6f2ea;
      }

      main {
        width: min(920px, calc(100vw - 48px));
        border: 1px solid rgba(24, 24, 24, 0.14);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.82);
        padding: 40px;
        box-shadow: 0 24px 80px rgba(24, 24, 24, 0.14);
      }

      p {
        max-width: 64ch;
        line-height: 1.65;
      }

      .meta {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 28px;
      }

      .meta span {
        border: 1px solid rgba(24, 24, 24, 0.12);
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>This is a fake Claude Code provider response. It exercises the async provider path, delay handling, and cancellation flow before the real desktop bridge exists.</p>
      <div class="meta" aria-label="Generation details">
        <span>${req.artifactType}</span>
        <span>${req.directionId}</span>
        <span>${req.tweaks.density}</span>
      </div>
    </main>
  </body>
</html>`;
}

async function* generate(req: GenerateRequest): AsyncIterable<GenerateEvent> {
  try {
    yield { type: 'token', text: 'Starting Claude Code stub...' };
    await wait(STUB_DELAY_MS, req.signal);
    yield { type: 'tool-call', name: 'claude-code-stub', args: { artifactType: req.artifactType } };
    await wait(STUB_DELAY_MS, req.signal);
    yield { type: 'tool-result', name: 'claude-code-stub', result: { ok: true } };
    yield { type: 'final', html: buildStubHtml(req), notes: 'Stub response for provider wiring.' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      yield { type: 'error', message: 'Generation aborted.' };
      return;
    }

    yield {
      type: 'error',
      message: error instanceof Error ? error.message : 'Claude Code stub failed.',
    };
  }
}

export const claudeCodeStubProvider: Provider = {
  id: 'claude-code',
  label: 'Claude Code',
  async status() {
    return 'ready';
  },
  generate,
};
