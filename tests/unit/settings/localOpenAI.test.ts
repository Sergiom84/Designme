import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCAL_OPENAI_SETTINGS,
  LOCAL_OPENAI_SETTINGS_STORAGE_KEY,
  applyLocalOpenAISettingsPatch,
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
        apiKey: 'secret-token',
        timeoutMs: 500,
      },
      storage,
    );

    expect(saved.timeoutMs).toBe(1000);
    const stored = storage.getItem(LOCAL_OPENAI_SETTINGS_STORAGE_KEY);
    expect(stored).toContain('qwen-local');
    expect(stored).not.toContain('secret-token');
    expect(readLocalOpenAISettings(storage)).toEqual({ ...saved, apiKey: '' });
  });

  it('does not rehydrate API keys from old storage values', () => {
    const stored = JSON.stringify({
      baseUrl: 'http://localhost:1234/v1',
      model: 'local-model',
      apiKey: 'old-secret',
      timeoutMs: 30000,
    });

    expect(parseStoredLocalOpenAISettings(stored)).toEqual({
      baseUrl: 'http://localhost:1234/v1',
      model: 'local-model',
      apiKey: '',
      timeoutMs: 30000,
    });
  });

  it('applies Ollama import patches without persisting API keys', () => {
    const storage = new MemoryStorage();
    const current = {
      baseUrl: 'https://gateway.example/v1',
      model: 'remote-model',
      apiKey: 'session-only',
      timeoutMs: 60000,
    };

    const next = applyLocalOpenAISettingsPatch(
      current,
      {
        baseUrl: 'http://127.0.0.1:11434/v1',
        model: 'llama3.2:latest',
      },
      storage,
    );

    expect(next).toEqual({
      baseUrl: 'http://127.0.0.1:11434/v1',
      model: 'llama3.2:latest',
      apiKey: 'session-only',
      timeoutMs: 60000,
    });
    expect(storage.getItem(LOCAL_OPENAI_SETTINGS_STORAGE_KEY)).not.toContain('session-only');
  });
});
