import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
  IDB_SESSIONS_DB_NAME,
  IDB_SESSIONS_STORE_NAME,
  deleteIdbString,
  hasIndexedDB,
  readIdbString,
  writeIdbString,
} from '../../../src/sessions/idbStore';

beforeEach(() => {
  // Each test gets a fresh in-memory IndexedDB so writes do not bleed across.
  globalThis.indexedDB = new IDBFactory();
});

afterEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe('idbStore', () => {
  it('reports IndexedDB presence and exposes the db/store names used by the wrapper', () => {
    expect(hasIndexedDB()).toBe(true);
    expect(IDB_SESSIONS_DB_NAME).toBe('designme');
    expect(IDB_SESSIONS_STORE_NAME).toBe('sessions');
  });

  it('round-trips serialized payloads through readIdbString / writeIdbString', async () => {
    const payload = JSON.stringify({ sessions: [{ id: 'one', name: 'demo' }] });

    expect(await readIdbString('designme.sessions')).toBeUndefined();
    expect(await writeIdbString('designme.sessions', payload)).toBe(true);
    expect(await readIdbString('designme.sessions')).toBe(payload);

    expect(await deleteIdbString('designme.sessions')).toBe(true);
    expect(await readIdbString('designme.sessions')).toBeUndefined();
  });

  it('reports unavailable when IndexedDB is missing from the global', async () => {
    const original = globalThis.indexedDB;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).indexedDB;
    try {
      expect(hasIndexedDB()).toBe(false);
      expect(await readIdbString('designme.sessions')).toBeUndefined();
      expect(await writeIdbString('designme.sessions', 'noop')).toBe(false);
      expect(await deleteIdbString('designme.sessions')).toBe(false);
    } finally {
      globalThis.indexedDB = original;
    }
  });
});
