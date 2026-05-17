import { claudeCodeProvider } from './claudeCode';
import { codexProvider } from './codex';
import { deterministicProvider } from './deterministic';
import { localOpenAIProvider } from './localOpenAI';
import { anthropicApiProvider } from './anthropicApi';
import { openaiApiProvider } from './openaiApi';
import type { Provider, ProviderId } from './types';

const ACTIVE_PROVIDER_STORAGE_KEY = 'designme.activeProviderId';

const providers: Provider[] = [
  deterministicProvider,
  localOpenAIProvider,
  anthropicApiProvider,
  openaiApiProvider,
  claudeCodeProvider,
  codexProvider,
];

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isProviderId(value: string): value is ProviderId {
  return providers.some((provider) => provider.id === value);
}

function migrateProviderId(value: string | null): ProviderId | undefined {
  if (value === 'claude-code') return 'claude-code-cli';
  if (value === 'codex') return 'codex-cli';
  return value && isProviderId(value) ? value : undefined;
}

export function listProviders(): Provider[] {
  return providers;
}

export function getProvider(id: ProviderId): Provider {
  const provider = providers.find((candidate) => candidate.id === id);

  if (!provider) {
    throw new Error(`Unknown provider: ${id}`);
  }

  return provider;
}

export function getActiveProviderId(): ProviderId {
  if (!canUseLocalStorage()) {
    return 'deterministic';
  }

  try {
    const storedId = migrateProviderId(window.localStorage.getItem(ACTIVE_PROVIDER_STORAGE_KEY));
    return storedId ?? 'deterministic';
  } catch {
    return 'deterministic';
  }
}

export function setActiveProviderId(id: ProviderId): void {
  getProvider(id);

  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(ACTIVE_PROVIDER_STORAGE_KEY, id);
  } catch {
    // Ignore storage failures in private mode, SSR, or tests.
  }
}
