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
    id: 'claude-code',
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
          providerId: 'claude-code',
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

  it('runs an external provider only when runKey changes', async () => {
    const { generate, provider } = createProvider();
    vi.mocked(getProvider).mockReturnValue(provider);

    const { rerender, result } = renderHook(
      ({ input, runKey }) =>
        useGenerate(input, {
          providerId: 'claude-code',
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
