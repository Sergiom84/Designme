import { claudeCodeStubProvider } from './claudeCodeStub';
import { deterministicProvider } from './deterministic';
import type { Provider, ProviderId } from './types';

const ACTIVE_PROVIDER_STORAGE_KEY = 'designme.activeProviderId';

const providers: Provider[] = [deterministicProvider, claudeCodeStubProvider];

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isProviderId(value: string): value is ProviderId {
  return providers.some((provider) => provider.id === value);
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
    const storedId = window.localStorage.getItem(ACTIVE_PROVIDER_STORAGE_KEY);
    return storedId && isProviderId(storedId) ? storedId : 'deterministic';
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
