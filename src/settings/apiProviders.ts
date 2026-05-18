import type { ProviderId } from '../providers';

export type ApiProviderId = Extract<ProviderId, 'anthropic-api' | 'openai-api'>;

export interface ApiProviderSettings {
  baseUrl: string;
  model: string;
}

export const API_PROVIDER_SETTINGS_STORAGE_KEY = 'designme.apiProviderSettings';

export const DEFAULT_API_PROVIDER_SETTINGS: Record<ApiProviderId, ApiProviderSettings> = {
  'anthropic-api': {
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-5-20250929',
  },
  'openai-api': {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
  },
};

export const API_PROVIDER_KEY_SECRETS: Record<ApiProviderId, string> = {
  'anthropic-api': 'anthropic-api.apiKey',
  'openai-api': 'openai-api.apiKey',
};

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getDefaultStorage(): StorageLike | undefined {
  return typeof window !== 'undefined' ? window.localStorage : undefined;
}

function cleanText(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function parseBaseUrl(value: unknown, fallback: string): string {
  const candidate = cleanText(value);
  if (!candidate) return fallback;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return fallback;
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return fallback;
  }
}

function parseProviderSettings(providerId: ApiProviderId, value: unknown): ApiProviderSettings {
  const defaults = DEFAULT_API_PROVIDER_SETTINGS[providerId];
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    baseUrl: parseBaseUrl(record.baseUrl, defaults.baseUrl),
    model: cleanText(record.model) || defaults.model,
  };
}

function readAllSettings(storage = getDefaultStorage()): Partial<Record<ApiProviderId, ApiProviderSettings>> {
  if (!storage) return {};

  try {
    const parsed = JSON.parse(storage.getItem(API_PROVIDER_SETTINGS_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Partial<Record<ApiProviderId, ApiProviderSettings>>) : {};
  } catch {
    return {};
  }
}

export function apiProviderSecretKey(providerId: ApiProviderId): string {
  return API_PROVIDER_KEY_SECRETS[providerId];
}

export function readApiProviderSettings(providerId: ApiProviderId, storage = getDefaultStorage()): ApiProviderSettings {
  const allSettings = readAllSettings(storage);
  return parseProviderSettings(providerId, allSettings[providerId]);
}

export function persistApiProviderSettings(
  providerId: ApiProviderId,
  settings: ApiProviderSettings,
  storage = getDefaultStorage(),
): ApiProviderSettings {
  const parsed = parseProviderSettings(providerId, settings);

  if (!storage) {
    return parsed;
  }

  try {
    storage.setItem(
      API_PROVIDER_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...readAllSettings(storage),
        [providerId]: parsed,
      }),
    );
  } catch {
    // Ignore storage failures in private mode, hardened contexts, or tests.
  }

  return parsed;
}
