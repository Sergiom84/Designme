import { CheckCircle2, PlugZap, Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { LocalOpenAISettings } from '../../settings';
import type { ProviderId } from '../../providers';
import { classNames } from '../../utils/classNames';

interface ProviderSetupHintsProps {
  detection?: DesignmeLocalSetupDetection;
  activeProviderId: ProviderId;
  localOpenAISettings: LocalOpenAISettings;
  dismissed: boolean;
  checking: boolean;
  disabled?: boolean;
  onActivateProvider(providerId: ProviderId): void;
  onUseOllama(settings: Partial<LocalOpenAISettings>): void;
  onRefresh(): void;
  onDismiss(): void;
}

function readyProviderHint(provider: DesignmeLocalSetupProvider, activeProviderId: ProviderId): boolean {
  return provider.ready && provider.id !== activeProviderId;
}

function canUseOllama(
  localOpenAI: DesignmeLocalOpenAISetup | undefined,
  activeProviderId: ProviderId,
  settings: LocalOpenAISettings,
): localOpenAI is DesignmeLocalOpenAISetup {
  if (!localOpenAI?.ready) return false;
  return (
    activeProviderId !== 'local-openai' ||
    localOpenAI.baseUrl !== settings.baseUrl ||
    Boolean(localOpenAI.model && localOpenAI.model !== settings.model)
  );
}

export function ProviderSetupHints({
  detection,
  activeProviderId,
  localOpenAISettings,
  dismissed,
  checking,
  disabled = false,
  onActivateProvider,
  onUseOllama,
  onRefresh,
  onDismiss,
}: ProviderSetupHintsProps) {
  const requestedInitialDetection = useRef(false);
  const providerHints = detection?.providers.filter((provider) => readyProviderHint(provider, activeProviderId)) ?? [];
  const showOllama = canUseOllama(detection?.localOpenAI, activeProviderId, localOpenAISettings);
  const hasAction = providerHints.length > 0 || showOllama;
  const canDetect = Boolean(window.designme?.detectLocalSetup);

  useEffect(() => {
    if (requestedInitialDetection.current || detection || dismissed || checking || !canDetect) return;
    requestedInitialDetection.current = true;
    onRefresh();
  }, [canDetect, checking, detection, dismissed, onRefresh]);

  if (dismissed || (!canDetect && !checking && !hasAction) || (detection && !checking && !hasAction)) {
    return null;
  }

  return (
    <section className="provider-setup-hints" aria-label="Configuración rápida de providers" aria-live="polite">
      <div className="provider-setup-hint">
        <div className="provider-setup-hint-copy">
          {checking ? <Search size={16} aria-hidden /> : <PlugZap size={16} aria-hidden />}
          <span>
            {checking ? 'Buscando providers locales' : hasAction ? 'Providers detectados' : 'Detectar providers'}
          </span>
        </div>

        <div className="provider-setup-actions">
          {providerHints.map((provider) => (
            <button
              key={provider.id}
              type="button"
              className="command-button compact"
              disabled={disabled}
              title={provider.version ?? provider.detail}
              onClick={() => onActivateProvider(provider.id)}
            >
              <CheckCircle2 size={15} aria-hidden />
              <span>Activar {provider.label}</span>
            </button>
          ))}

          {showOllama ? (
            <button
              type="button"
              className={classNames('command-button compact', activeProviderId !== 'local-openai' && 'primary')}
              disabled={disabled}
              title={detection?.localOpenAI.detail}
              onClick={() =>
                onUseOllama({
                  baseUrl: detection.localOpenAI.baseUrl,
                  model: detection.localOpenAI.model ?? localOpenAISettings.model,
                })
              }
            >
              <CheckCircle2 size={15} aria-hidden />
              <span>Usar Ollama</span>
            </button>
          ) : null}

          <button
            type="button"
            className="icon-button compact"
            title="Buscar providers"
            aria-label="Buscar providers"
            onClick={onRefresh}
          >
            <Search size={15} aria-hidden />
          </button>
          <button
            type="button"
            className="icon-button compact"
            title="Ocultar sugerencias"
            aria-label="Ocultar sugerencias"
            onClick={onDismiss}
          >
            <X size={15} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
