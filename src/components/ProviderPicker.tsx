import { classNames } from '../utils/classNames';

export type ProviderStatus = 'idle' | 'checking' | 'ready' | 'warning' | 'error';

export interface ProviderPickerOption {
  id: string;
  label: string;
  status: ProviderStatus;
}

interface ProviderPickerProps {
  providers: ProviderPickerOption[];
  activeProviderId: string;
  running: boolean;
  onProviderChange(providerId: string): void;
  onStop(): void;
}

const statusLabels: Record<ProviderStatus, string> = {
  idle: 'En espera',
  checking: 'Comprobando',
  ready: 'Disponible',
  warning: 'Revisar',
  error: 'No disponible',
};

function getStatusTone(status: ProviderStatus): 'ready' | 'warning' | 'error' {
  if (status === 'ready' || status === 'error') {
    return status;
  }

  return 'warning';
}

export function ProviderPicker({
  providers,
  activeProviderId,
  running,
  onProviderChange,
  onStop,
}: ProviderPickerProps) {
  const activeProvider = providers.find((provider) => provider.id === activeProviderId) ?? providers[0];
  const providerSelectId = 'provider-picker-select';
  const statusText = activeProvider ? statusLabels[activeProvider.status] : 'Sin providers';
  const statusTone = activeProvider ? getStatusTone(activeProvider.status) : undefined;

  return (
    <section className="provider-picker" aria-labelledby="provider-picker-label">
      <div className="provider-picker-control">
        <label id="provider-picker-label" htmlFor={providerSelectId}>
          Provider
        </label>
        <select
          id={providerSelectId}
          value={activeProvider?.id ?? ''}
          onChange={(event) => onProviderChange(event.target.value)}
          disabled={running || providers.length === 0}
          aria-describedby="provider-picker-status"
        >
          {providers.length === 0 ? (
            <option value="">Sin providers</option>
          ) : (
            providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.label}
              </option>
            ))
          )}
        </select>
      </div>

      <span
        id="provider-picker-status"
        className={classNames('provider-status-badge', statusTone && `is-${statusTone}`)}
        aria-label={`Estado del provider: ${statusText}`}
      >
        {statusText}
      </span>

      {running ? (
        <button type="button" className="command-button provider-stop-button" onClick={onStop}>
          Stop
        </button>
      ) : null}
    </section>
  );
}
