import { afterEach, describe, expect, it, vi } from 'vitest';
import { claudeCodeProvider } from '../../../src/providers/claudeCode';
import type { GenerateRequest } from '../../../src/providers/types';

const originalDesignme = window.designme;
const runId = '123e4567-e89b-12d3-a456-426614174000';
const html = '<!doctype html><html><head><title>Done</title></head><body><main>Done</main></body></html>';

function makeRequest(): GenerateRequest {
  return {
    prompt: 'Build a dashboard',
    artifactType: 'dashboard',
    directionId: 'systems',
    tweaks: {
      density: 'balanced',
      motion: 'still',
      radius: 6,
      showDevice: true,
      tone: 'light',
    },
    signal: new AbortController().signal,
  };
}

afterEach(() => {
  window.designme = originalDesignme;
  vi.restoreAllMocks();
});

describe('claudeCodeProvider', () => {
  it('buffers provider events that arrive before providerStart resolves with the runId', async () => {
    let listener: ((event: DesignmeProviderEvent) => void) | undefined;
    window.designme = {
      copyText: vi.fn(),
      exportBundle: vi.fn(),
      exportHtml: vi.fn(),
      openExports: vi.fn(),
      providerStatus: vi.fn(),
      providerStop: vi.fn(),
      onProviderEvent: vi.fn((nextListener) => {
        listener = nextListener;
        return vi.fn();
      }),
      providerStart: vi.fn(async () => {
        listener?.({ runId, type: 'final', html, notes: 'Generated with Claude Code.' });
        return { runId };
      }),
    };

    const events = [];
    for await (const event of claudeCodeProvider.generate(makeRequest())) {
      events.push(event);
    }

    expect(events).toEqual([{ type: 'final', html, notes: 'Generated with Claude Code.' }]);
  });
});
