import { useCallback, useEffect, useState } from 'react';
import {
  getActiveProviderId,
  listProviders,
  setActiveProviderId,
  type Provider,
  type ProviderId,
  type ProviderStatus,
} from '../providers';

interface UseProviderRuntimeOptions {
  /** Optional callback for surfacing provider switch messages in the status row. */
  onStatus?(message: string): void;
}

interface UseProviderRuntimeResult {
  providerList: Provider[];
  activeProviderId: ProviderId;
  providerStatuses: Record<string, ProviderStatus>;
  changeProvider(providerId: string): void;
}

function syncCspState(providerId: ProviderId): void {
  // Keep the Electron network gate in sync with the active provider so
  // 127.0.0.1/localhost traffic from the renderer is only allowed when the
  // user is actually using the local-openai adapter. Best-effort: the
  // renderer still falls back to deterministic if Electron is absent.
  if (!window.designme?.setCspState) return;
  void window.designme.setCspState({ allowLocalProvider: providerId === 'local-openai' }).catch(() => undefined);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
}

/**
 * Owns the renderer-side provider runtime:
 *  - reads the persisted active provider and keeps the picker in sync,
 *  - polls each provider's `status()` so the picker can show ready/error badges,
 *  - mirrors the active provider into the Electron CSP/network-gate state on
 *    mount and on every change so the network filter cannot lag behind the UI.
 *
 * The hook deliberately does NOT own the agent stream visibility flag — that
 * stays in App because it interacts with keyboard shortcuts and inspector tabs.
 */
export function useProviderRuntime(options: UseProviderRuntimeOptions = {}): UseProviderRuntimeResult {
  const { onStatus } = options;
  const [providerList] = useState<Provider[]>(() => listProviders());
  const [activeProviderId, setActiveProviderIdState] = useState<ProviderId>(() => getActiveProviderId());
  const [providerStatuses, setProviderStatuses] = useState<Record<string, ProviderStatus>>({});

  useEffect(() => {
    let cancelled = false;
    for (const provider of providerList) {
      void provider.status().then((providerStatus) => {
        if (cancelled) return;
        setProviderStatuses((current) => ({ ...current, [provider.id]: providerStatus }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [providerList, activeProviderId]);

  useEffect(() => {
    // On mount, push the renderer's restored provider selection to the main
    // process so the persisted CSP/network-gate state matches the UI.
    syncCspState(activeProviderId);
    // Only run on mount; subsequent changes go through `changeProvider`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeProvider = useCallback(
    (providerId: string) => {
      try {
        const nextProviderId = providerId as ProviderId;
        setActiveProviderId(nextProviderId);
        setActiveProviderIdState(nextProviderId);
        syncCspState(nextProviderId);
        const nextProvider = providerList.find((provider) => provider.id === nextProviderId);
        onStatus?.(`Provider activo: ${nextProvider?.label ?? nextProviderId}`);
      } catch (error) {
        onStatus?.(`No se pudo activar el provider: ${errorMessage(error)}`);
      }
    },
    [onStatus, providerList],
  );

  return { providerList, activeProviderId, providerStatuses, changeProvider };
}
