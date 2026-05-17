import type { LocalOpenAISettings } from './types';

export const LOCAL_OPENAI_SETTINGS_STORAGE_KEY = 'designme.localOpenAISettings';

export const DEFAULT_LOCAL_OPENAI_SETTINGS: LocalOpenAISettings = {
  baseUrl: 'http://127.0.0.1:11434/v1',
  model: 'llama3.1:8b',
  apiKey: '',
  timeoutMs: 60_000,
};

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 300_000;

function getDefaultStorage(): StorageLike | undefined {
  return typeof window !== 'undefined' ? window.localStorage : undefined;
}

function cleanText(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function parseBaseUrl(value: unknown): string {
  const candidate = cleanText(value);

  if (!candidate) {
    return DEFAULT_LOCAL_OPENAI_SETTINGS.baseUrl;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return DEFAULT_LOCAL_OPENAI_SETTINGS.baseUrl;
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_LOCAL_OPENAI_SETTINGS.baseUrl;
  }
}

function parseTimeoutMs(value: unknown): number {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;

  if (!Number.isFinite(numeric)) {
    return DEFAULT_LOCAL_OPENAI_SETTINGS.timeoutMs;
  }

  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, Math.round(numeric)));
}

export function parseLocalOpenAISettings(value: unknown): LocalOpenAISettings {
  const record = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const model = cleanText(record.model) || DEFAULT_LOCAL_OPENAI_SETTINGS.model;
  const apiKey = cleanText(record.apiKey) || '';

  return {
    baseUrl: parseBaseUrl(record.baseUrl),
    model,
    apiKey,
    timeoutMs: parseTimeoutMs(record.timeoutMs),
  };
}

export function parseStoredLocalOpenAISettings(value: string | null): LocalOpenAISettings {
  if (!value) {
    return DEFAULT_LOCAL_OPENAI_SETTINGS;
  }

  try {
    return { ...parseLocalOpenAISettings(JSON.parse(value)), apiKey: '' };
  } catch {
    return DEFAULT_LOCAL_OPENAI_SETTINGS;
  }
}

export function readLocalOpenAISettings(storage = getDefaultStorage()): LocalOpenAISettings {
  if (!storage) {
    return DEFAULT_LOCAL_OPENAI_SETTINGS;
  }

  try {
    return parseStoredLocalOpenAISettings(storage.getItem(LOCAL_OPENAI_SETTINGS_STORAGE_KEY));
  } catch {
    return DEFAULT_LOCAL_OPENAI_SETTINGS;
  }
}

export function persistLocalOpenAISettings(
  settings: LocalOpenAISettings,
  storage = getDefaultStorage(),
): LocalOpenAISettings {
  const parsed = parseLocalOpenAISettings(settings);

  if (!storage) {
    return parsed;
  }

  try {
    const { apiKey: _apiKey, ...persistableSettings } = parsed;
    storage.setItem(LOCAL_OPENAI_SETTINGS_STORAGE_KEY, JSON.stringify(persistableSettings));
  } catch {
    // Ignore storage failures in private mode, hardened contexts, or tests.
  }

  return parsed;
}

export function applyLocalOpenAISettingsPatch(
  current: LocalOpenAISettings,
  patch: Partial<LocalOpenAISettings>,
  storage = getDefaultStorage(),
): LocalOpenAISettings {
  return persistLocalOpenAISettings({ ...current, ...patch }, storage);
}
