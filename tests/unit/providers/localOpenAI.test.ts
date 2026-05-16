import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalOpenAIProvider } from '../../../src/providers/localOpenAI';
import type { GenerateEvent, GenerateRequest } from '../../../src/providers';

function makeRequest(signal = new AbortController().signal): GenerateRequest {
  return {
    prompt: 'Build a quiet analytics dashboard',
    artifactType: 'dashboard',
    directionId: 'systems',
    tweaks: {
      density: 'balanced',
      tone: 'light',
      motion: 'measured',
      radius: 8,
      showDevice: false,
    },
    signal,
  };
}

function streamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    }),
    { status: 200 },
  );
}

async function collectEvents(iterable: AsyncIterable<GenerateEvent>): Promise<GenerateEvent[]> {
  const events: GenerateEvent[] = [];
  for await (const event of iterable) {
    events.push(event);
  }
  return events;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('localOpenAIProvider', () => {
  it('checks /models with a GET request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const provider = createLocalOpenAIProvider({ baseUrl: 'http://localhost:1234/v1/' });

    await expect(provider.status()).resolves.toBe('ready');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:1234/v1/models',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns error when /models is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));

    const provider = createLocalOpenAIProvider({ baseUrl: 'http://localhost:1234/v1' });

    await expect(provider.status()).resolves.toBe('error');
  });

  it('times out the /models check after two seconds', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Request timed out.', 'AbortError'));
          });
        });
      }),
    );

    const provider = createLocalOpenAIProvider({ baseUrl: 'http://localhost:1234/v1' });
    const status = provider.status();

    await vi.advanceTimersByTimeAsync(2_000);

    await expect(status).resolves.toBe('error');
  });

  it('posts a streaming chat completion request and yields tokens plus final HTML', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      streamResponse([
        'data: {"choices":[{"delta":{"content":"```html\\n<div"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" class=\\"app\\">Hi</div>\\n```"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = createLocalOpenAIProvider({
      baseUrl: 'http://localhost:1234/v1/',
      model: 'local-model',
    });

    const events = await collectEvents(provider.generate(makeRequest()));

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:1234/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: expect.any(AbortSignal),
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      model: string;
      stream: boolean;
      messages: Array<{ role: string; content: string }>;
    };
    expect(body).toMatchObject({ model: 'local-model', stream: true });
    expect(body.messages[1]?.content).toContain('quiet analytics dashboard');
    expect(events).toEqual([
      { type: 'token', text: '```html\n<div' },
      { type: 'token', text: ' class="app">Hi</div>\n```' },
      {
        type: 'final',
        html: '<div class="app">Hi</div>',
        notes: 'Generated with local OpenAI-compatible model local-model.',
      },
    ]);
  });

  it('parses SSE events split across network chunks', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        streamResponse([
          'data: {"choices":[{"delta":{"content":"<!doctype html>"}}]}',
          '\n\ndata: {"choices":[{"delta":{"content":"<html></html>"}}]}\n\n',
        ]),
      ),
    );

    const provider = createLocalOpenAIProvider();
    const events = await collectEvents(provider.generate(makeRequest()));

    expect(events.at(-1)).toMatchObject({
      type: 'final',
      html: '<!doctype html><html></html>',
    });
  });

  it('yields an error event when the completion request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })));

    const provider = createLocalOpenAIProvider();
    const events = await collectEvents(provider.generate(makeRequest()));

    expect(events).toEqual([{ type: 'error', message: 'Local OpenAI request failed with 404.' }]);
  });
});
