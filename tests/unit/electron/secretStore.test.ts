import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { createSecretStore, FILENAME } = require('../../../electron/secretStore.cjs') as {
  createSecretStore(options: {
    userDataDir?: string;
    filePath?: string;
    safeStorage?: {
      isEncryptionAvailable(): boolean;
      encryptString(value: string): Buffer | Uint8Array;
      decryptString(buffer: Buffer | Uint8Array): string;
    };
  }): {
    ready(): boolean;
    has(key: string): boolean;
    set(key: string, value: string): { stored: boolean };
    get(key: string): string | undefined;
    delete(key: string): { deleted: boolean };
    filePath: string;
  };
  FILENAME: string;
};

function fakeSafeStorage(available: boolean) {
  return {
    isEncryptionAvailable: () => available,
    encryptString: (value: string) => Buffer.from(`enc:${value}`, 'utf8'),
    decryptString: (buffer: Buffer | Uint8Array) => {
      const text = Buffer.from(buffer).toString('utf8');
      return text.startsWith('enc:') ? text.slice(4) : text;
    },
  };
}

let workdir: string;

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), 'designme-secret-store-'));
});

afterEach(() => {
  rmSync(workdir, { recursive: true, force: true });
});

describe('secretStore', () => {
  it('reports not-ready when safeStorage is missing or encryption is unavailable', () => {
    const noSafeStorage = createSecretStore({ userDataDir: workdir });
    expect(noSafeStorage.ready()).toBe(false);
    expect(noSafeStorage.set('local-openai.apiKey', 'k')).toEqual({ stored: false });

    const unavailable = createSecretStore({ userDataDir: workdir, safeStorage: fakeSafeStorage(false) });
    expect(unavailable.ready()).toBe(false);
    expect(unavailable.set('local-openai.apiKey', 'k')).toEqual({ stored: false });
    expect(unavailable.get('local-openai.apiKey')).toBeUndefined();
  });

  it('encrypts, persists, reads, and deletes secrets when safeStorage is ready', () => {
    const store = createSecretStore({ userDataDir: workdir, safeStorage: fakeSafeStorage(true) });
    expect(store.ready()).toBe(true);
    expect(store.filePath).toBe(join(workdir, FILENAME));

    expect(store.set('local-openai.apiKey', 'sk-test-123').stored).toBe(true);
    expect(store.has('local-openai.apiKey')).toBe(true);
    expect(store.get('local-openai.apiKey')).toBe('sk-test-123');

    // The on-disk payload must not contain the plaintext.
    const raw = readFileSync(store.filePath, 'utf8');
    expect(raw).not.toContain('sk-test-123');

    expect(store.delete('local-openai.apiKey')).toEqual({ deleted: true });
    expect(store.get('local-openai.apiKey')).toBeUndefined();
    expect(store.delete('local-openai.apiKey')).toEqual({ deleted: false });
  });

  it('rejects invalid keys before touching the filesystem', () => {
    const store = createSecretStore({ userDataDir: workdir, safeStorage: fakeSafeStorage(true) });
    expect(() => store.set('../escape', 'x')).toThrow(/Invalid secret key/);
    expect(() => store.set('with space', 'x')).toThrow(/Invalid secret key/);
    expect(() => store.get('')).toThrow(/Invalid secret key/);
  });

  it('rejects oversized plaintext values', () => {
    const store = createSecretStore({ userDataDir: workdir, safeStorage: fakeSafeStorage(true) });
    const tooLong = 'x'.repeat(9 * 1024);
    expect(() => store.set('local-openai.apiKey', tooLong)).toThrow(/too large/);
  });
});
