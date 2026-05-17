import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGenerate } from '../../../src/hooks/useGenerate';
import { getProvider } from '../../../src/providers';
import type { GenerateRequest, Provider } from '../../../src/providers/types';
import type { BuildInput } from '../../../src/engine/index';

vi.mock('../../../src/providers', () => ({
  getProvider: vi.fn(),
}));

const baseInput: BuildInput = {
  prompt: 'Build a dashboard',
  artifactType: 'dashboard',
  directionId: 'systems',
  tweaks: {
    density: 'balanced',
    motion: 'still',
    radius: 8,
    showDevice: false,
    tone: 'light',
  },
};

function createProvider(html = '<!doctype html><html><body><main>Manual</main></body></html>') {
  const generate = vi.fn((req: GenerateRequest) =>
    (async function* () {
      if (!req.signal.aborted) {
        yield { type: 'final' as const, html };
      }
    })(),
  );

  const provider: Provider = {
    id: 'claude-code-cli',
    label: 'Claude Code',
    status: vi.fn(async () => 'ready'),
    generate,
  };

  return { generate, provider };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useGenerate', () => {
  it('does not auto-run an external provider on mount or draft changes', async () => {
    const { generate, provider } = createProvider();
    vi.mocked(getProvider).mockReturnValue(provider);

    const { rerender, result } = renderHook(
      ({ input, runKey }) =>
        useGenerate(input, {
          providerId: 'claude-code-cli',
          autoGenerate: false,
          runKey,
        }),
      {
        initialProps: {
          input: baseInput,
          runKey: 0,
        },
      },
    );

    expect(generate).not.toHaveBeenCalled();
    expect(result.current.running).toBe(false);

    rerender({
      input: { ...baseInput, prompt: 'Changed dashboard brief' },
      runKey: 0,
    });

    expect(generate).not.toHaveBeenCalled();
    expect(result.current.events).toEqual([]);
  });

  it('automatically retries once with a stricter prompt when the provider reports invalid HTML', async () => {
    const calls: string[] = [];
    const generate = vi.fn((req: GenerateRequest) => {
      calls.push(req.prompt);
      const attempt = calls.length;
      return (async function* () {
        if (req.signal.aborted) return;
        if (attempt === 1) {
          yield {
            type: 'error' as const,
            message: 'Provider did not return a complete standalone HTML document.',
          };
          return;
        }
        yield {
          type: 'final' as const,
          html: '<!doctype html><html><body><main>Retry success</main></body></html>',
        };
      })();
    });

    const provider: Provider = {
      id: 'claude-code-cli',
      label: 'Claude Code',
      status: vi.fn(async () => 'ready'),
      generate,
    };

    vi.mocked(getProvider).mockReturnValue(provider);

    const { rerender, result } = renderHook(
      ({ input, runKey }) =>
        useGenerate(input, {
          providerId: 'claude-code-cli',
          autoGenerate: false,
          runKey,
        }),
      {
        initialProps: { input: baseInput, runKey: 0 },
      },
    );

    rerender({ input: baseInput, runKey: 1 });

    await waitFor(() => expect(generate).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.events.at(-1)).toMatchObject({ type: 'final' }));

    expect(calls[0]).toBe(baseInput.prompt);
    expect(calls[1]).toContain(baseInput.prompt);
    expect(calls[1]).toMatch(/<!doctype html>/i);
    // The first-attempt invalid-HTML error must not bleed into the visible
    // stream once the retry succeeded — users should see only the final HTML.
    expect(
      result.current.events.find(
        (event) =>
          event.type === 'error' &&
          event.message === 'Provider did not return a complete standalone HTML document.',
      ),
    ).toBeUndefined();
  });

  it('runs an external provider only when runKey changes', async () => {
    const { generate, provider } = createProvider();
    vi.mocked(getProvider).mockReturnValue(provider);

    const { rerender, result } = renderHook(
      ({ input, runKey }) =>
        useGenerate(input, {
          providerId: 'claude-code-cli',
          autoGenerate: false,
          runKey,
        }),
      {
        initialProps: {
          input: baseInput,
          runKey: 0,
        },
      },
    );

    rerender({ input: baseInput, runKey: 1 });

    await waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.events.at(-1)).toMatchObject({ type: 'final' }));

    rerender({
      input: { ...baseInput, prompt: 'Changed dashboard brief' },
      runKey: 1,
    });

    expect(generate).toHaveBeenCalledTimes(1);
    expect(result.current.events).toEqual([]);
  });
});
