import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { createProviderRunManager } = require('../../../electron/providerRuns.cjs') as {
  createProviderRunManager(adapter?: {
    start(args: {
      payload: Record<string, unknown>;
      runId: string;
      signal: AbortSignal;
      emit(event: Record<string, unknown>): void;
    }): void | Promise<void>;
  }): {
    start(webContents: FakeWebContents, payload: Record<string, unknown>): Promise<{ runId: string }>;
    stop(webContents: FakeWebContents, runId: string): { stopped: boolean };
  };
};

interface FakeWebContents {
  id: number;
  isDestroyed(): boolean;
  send(channel: string, payload: unknown): void;
}

function makeStartPayload() {
  return {
    providerId: 'claude-code',
    prompt: 'Build a compact dashboard',
    artifactType: 'dashboard',
    directionId: 'calm',
    tweaks: { density: 'compact' },
  };
}

function makeWebContents(id: number) {
  const sent: Array<{ channel: string; payload: unknown }> = [];
  const webContents: FakeWebContents = {
    id,
    isDestroyed: () => false,
    send: (channel, payload) => sent.push({ channel, payload }),
  };

  return { sent, webContents };
}

describe('provider run manager', () => {
  it('creates unique runIds and emits provider events with the owning runId', async () => {
    const { sent, webContents } = makeWebContents(1);
    const manager = createProviderRunManager({
      start({ emit }) {
        emit({ type: 'token', text: 'hello' });
      },
    });

    const first = await manager.start(webContents, makeStartPayload());
    const second = await manager.start(webContents, makeStartPayload());
    await Promise.resolve();

    expect(first.runId).not.toBe(second.runId);
    expect(sent).toEqual([
      { channel: 'designme:provider-event', payload: { runId: first.runId, type: 'token', text: 'hello' } },
      { channel: 'designme:provider-event', payload: { runId: second.runId, type: 'token', text: 'hello' } },
    ]);
  });

  it('only lets the owning webContents stop a run', async () => {
    const owner = makeWebContents(1);
    const other = makeWebContents(2);
    const manager = createProviderRunManager();
    const { runId } = await manager.start(owner.webContents, makeStartPayload());

    expect(manager.stop(other.webContents, runId)).toEqual({ stopped: false });
    expect(manager.stop(owner.webContents, runId)).toEqual({ stopped: true });
    expect(owner.sent[owner.sent.length - 1]).toEqual({
      channel: 'designme:provider-event',
      payload: { runId, type: 'stopped' },
    });
  });
});
