import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { createCspState, STATE_FILENAME } = require('../../../electron/cspState.cjs') as {
  createCspState(options: { userDataDir?: string; filePath?: string }): {
    get(): { allowLocalProvider: boolean };
    set(patch: { allowLocalProvider?: boolean }): { allowLocalProvider: boolean };
    filePath: string;
  };
  STATE_FILENAME: string;
};

let workdir: string;

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), 'designme-csp-state-'));
});

afterEach(() => {
  rmSync(workdir, { recursive: true, force: true });
});

describe('cspState', () => {
  it('defaults to denying local provider traffic when no state file exists', () => {
    const state = createCspState({ userDataDir: workdir });
    expect(state.get()).toEqual({ allowLocalProvider: false });
    expect(state.filePath).toBe(join(workdir, STATE_FILENAME));
  });

  it('reads a previously persisted allowLocalProvider flag from disk', () => {
    writeFileSync(join(workdir, STATE_FILENAME), JSON.stringify({ allowLocalProvider: true }), 'utf8');
    const state = createCspState({ userDataDir: workdir });
    expect(state.get()).toEqual({ allowLocalProvider: true });
  });

  it('persists state changes and ignores no-op updates', () => {
    const state = createCspState({ userDataDir: workdir });

    state.set({ allowLocalProvider: true });
    expect(state.get()).toEqual({ allowLocalProvider: true });
    expect(JSON.parse(readFileSync(state.filePath, 'utf8'))).toEqual({ allowLocalProvider: true });

    // Same value again should not throw and should keep the file consistent.
    state.set({ allowLocalProvider: true });
    expect(JSON.parse(readFileSync(state.filePath, 'utf8'))).toEqual({ allowLocalProvider: true });

    state.set({ allowLocalProvider: false });
    expect(state.get()).toEqual({ allowLocalProvider: false });
    expect(JSON.parse(readFileSync(state.filePath, 'utf8'))).toEqual({ allowLocalProvider: false });
  });

  it('falls back to the safe default when the state file is corrupt', () => {
    writeFileSync(join(workdir, STATE_FILENAME), '{not json', 'utf8');
    const state = createCspState({ userDataDir: workdir });
    expect(state.get()).toEqual({ allowLocalProvider: false });
  });

  it('ignores patches that do not contain a boolean allowLocalProvider', () => {
    const state = createCspState({ userDataDir: workdir });
    state.set({ allowLocalProvider: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state.set({ allowLocalProvider: 'yes' as any });
    expect(state.get()).toEqual({ allowLocalProvider: true });
  });
});
