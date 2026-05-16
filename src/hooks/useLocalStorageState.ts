import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export function useLocalStorageState<T>(
  key: string,
  initialValue: T | (() => T),
  options: { serialize?: (value: T) => string; deserialize?: (value: string) => T } = {},
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

  useEffect(() => {
    try {
      localStorage.setItem(key, serialize(value));
    } catch {
      // Local storage can fail in hardened browser contexts.
    }
  }, [key, serialize, value]);

  return [value, setValue];
}
