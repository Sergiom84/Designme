import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCAL_OPENAI_SETTINGS,
  LOCAL_OPENAI_SETTINGS_STORAGE_KEY,
  parseLocalOpenAISettings,
  parseStoredLocalOpenAISettings,
  persistLocalOpenAISettings,
  readLocalOpenAISettings,
} from '../../../src/settings';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('local OpenAI settings', () => {
  it('uses safe defaults for missing or invalid stored values', () => {
    expect(parseStoredLocalOpenAISettings('{bad json')).toEqual(DEFAULT_LOCAL_OPENAI_SETTINGS);
    expect(
      parseLocalOpenAISettings({
        baseUrl: 'file:///tmp/server',
        model: '',
        apiKey: '   ',
        timeoutMs: -1,
      }),
    ).toEqual({
      ...DEFAULT_LOCAL_OPENAI_SETTINGS,
      timeoutMs: 1000,
    });
  });

  it('normalizes valid OpenAI-compatible settings', () => {
    expect(
      parseLocalOpenAISettings({
        baseUrl: ' http://localhost:1234/v1/ ',
        model: ' gpt-oss ',
        apiKey: ' token ',
        timeoutMs: '120000.4',
      }),
    ).toEqual({
      baseUrl: 'http://localhost:1234/v1',
      model: 'gpt-oss',
      apiKey: 'token',
      timeoutMs: 120000,
    });
  });

  it('reads and persists through a storage-like object without throwing', () => {
    const storage = new MemoryStorage();

    const saved = persistLocalOpenAISettings(
      {
        baseUrl: 'https://localhost:8000/v1',
        model: 'qwen-local',
        apiKey: '',
        timeoutMs: 500,
      },
      storage,
    );

    expect(saved.timeoutMs).toBe(1000);
    expect(storage.getItem(LOCAL_OPENAI_SETTINGS_STORAGE_KEY)).toContain('qwen-local');
    expect(readLocalOpenAISettings(storage)).toEqual(saved);
  });
});
