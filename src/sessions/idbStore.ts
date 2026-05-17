const DB_NAME = 'designme';
const STORE_NAME = 'sessions';
const DB_VERSION = 1;

type IDBLike = IDBFactory | undefined;

function getIndexedDB(): IDBLike {
  return typeof globalThis !== 'undefined' && 'indexedDB' in globalThis
    ? (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB
    : undefined;
}

function openDb(factory: IDBFactory = getIndexedDB() as IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!factory) {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const request = factory.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
    request.onblocked = () => reject(new Error('IndexedDB upgrade blocked'));
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  worker: (store: IDBObjectStore) => IDBRequest<T> | T,
): Promise<T> {
  const factory = getIndexedDB();
  if (!factory) return Promise.reject(new Error('IndexedDB is not available'));

  return openDb(factory).then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        let result: IDBRequest<T> | T | undefined;
        try {
          result = worker(store);
        } catch (error) {
          reject(error);
          return;
        }

        tx.oncomplete = () => {
          db.close();
          if (result && typeof result === 'object' && 'result' in (result as IDBRequest<T>)) {
            resolve((result as IDBRequest<T>).result);
          } else {
            resolve(result as T);
          }
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error('IndexedDB transaction failed'));
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error ?? new Error('IndexedDB transaction aborted'));
        };
      }),
  );
}

/** True when the renderer can talk to IndexedDB at all (desktop + most browsers). */
export function hasIndexedDB(): boolean {
  return getIndexedDB() !== undefined;
}

/**
 * Reads a previously serialized blob for `key` from the `sessions` object
 * store. Returns `undefined` if IndexedDB is unavailable or the key has no
 * value. The value is intentionally stored as the raw JSON string the
 * existing `useLocalStorageState`-style serializer produced so the IDB layer
 * stays format-agnostic.
 */
export async function readIdbString(key: string): Promise<string | undefined> {
  if (!hasIndexedDB()) return undefined;
  try {
    const value = await withStore<unknown>('readonly', (store) => store.get(key));
    return typeof value === 'string' ? value : undefined;
  } catch {
    return undefined;
  }
}

export async function writeIdbString(key: string, value: string): Promise<boolean> {
  if (!hasIndexedDB()) return false;
  try {
    await withStore<IDBValidKey>('readwrite', (store) => store.put(value, key));
    return true;
  } catch {
    return false;
  }
}

export async function deleteIdbString(key: string): Promise<boolean> {
  if (!hasIndexedDB()) return false;
  try {
    await withStore<undefined>('readwrite', (store) => store.delete(key));
    return true;
  } catch {
    return false;
  }
}

export const IDB_SESSIONS_DB_NAME = DB_NAME;
export const IDB_SESSIONS_STORE_NAME = STORE_NAME;
