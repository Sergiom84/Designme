import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { readIdbString, writeIdbString } from '../sessions/idbStore';

interface UseIdbPersistedStateOptions<T> {
  serialize?(value: T): string;
  deserialize?(value: string): T;
}

/**
 * Like {@link useLocalStorageState} but uses IndexedDB as the durable store so
 * payloads can exceed the ~5 MiB localStorage quota that the session
 * collection eventually hits when each saved version embeds a full HTML
 * artifact.
 *
 * Hydration strategy:
 *  1. Read the synchronous localStorage value first so the very first render
 *     already shows the user's previous session (no flash).
 *  2. After mount, asynchronously try IndexedDB. If a value is present, hydrate
 *     state from it (IDB is canonical when available).
 *  3. On every change, write to IndexedDB and best-effort to localStorage. If
 *     localStorage rejects (quota), the failure is swallowed and IDB keeps the
 *     source of truth.
 *
 * Web/Electron contexts without IndexedDB silently fall back to the
 * localStorage path that the rest of the app already uses.
 */
export function useIdbPersistedState<T>(
  key: string,
  initialValue: T | (() => T),
  options: UseIdbPersistedStateOptions<T> = {},
): [T, Dispatch<SetStateAction<T>>] {
  const { serialize = JSON.stringify, deserialize = JSON.parse as (value: string) => T } = options;

  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) return deserialize(stored);
    } catch {
      // Fall through to the local default.
    }
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  });

  const hydratedRef = useRef(false);

  // One-shot IDB hydration. The initial render already showed the
  // localStorage snapshot, so a state replacement here only fires when the IDB
  // payload differs (e.g. larger sessions list that did not fit in
  // localStorage on the previous run).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await readIdbString(key);
      if (cancelled) return;
      hydratedRef.current = true;
      if (typeof stored !== 'string') return;
      try {
        const parsed = deserialize(stored);
        setValue(parsed);
      } catch {
        // Ignore malformed IDB payload; the localStorage value remains active.
      }
    })();
    return () => {
      cancelled = true;
    };
    // Hydration only runs once per key; ignore deserialize identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    let serialized: string;
    try {
      serialized = serialize(value);
    } catch {
      return;
    }

    void writeIdbString(key, serialized);

    try {
      localStorage.setItem(key, serialized);
    } catch {
      // localStorage may throw (quota, privacy mode). IDB above keeps the data.
    }
  }, [key, serialize, value]);

  return [value, setValue];
}
