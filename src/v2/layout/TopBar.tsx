import { Moon, PanelLeftClose, Settings, Sun } from 'lucide-react';
import { listProviders, setActiveProviderId, type ProviderId, type ProviderStatus } from '../../providers';
import type { ThemeMode } from '../state/types';

interface TopBarProps {
  activeProviderId: ProviderId;
  providerStatuses: Partial<Record<ProviderId, ProviderStatus>>;
  projectTitle: string;
  theme: ThemeMode;
  onProviderChange(providerId: ProviderId): void;
  onThemeChange(theme: ThemeMode): void;
  onOpenProviderConfig(): void;
  onOpenProjects(): void;
}

export function TopBar({
  activeProviderId,
  providerStatuses,
  projectTitle,
  theme,
  onProviderChange,
  onThemeChange,
  onOpenProviderConfig,
  onOpenProjects,
}: TopBarProps) {
  const providers = listProviders();
  const activeProviderStatus = providerStatuses[activeProviderId] ?? 'idle';

  function changeProvider(value: string) {
    const providerId = value as ProviderId;
    setActiveProviderId(providerId);
    void window.designme?.setCspState?.({ allowLocalProvider: providerId === 'local-openai' }).catch(() => undefined);
    onProviderChange(providerId);
  }

  return (
    <header className="v2-topbar">
      <button className="v2-icon-button" type="button" title="Projects" onClick={onOpenProjects}>
        <PanelLeftClose size={18} />
      </button>
      <div className="v2-topbar__brand">
        <span className="v2-logo">D</span>
        <strong>Designme</strong>
      </div>
      <label className="v2-provider-picker">
        <span
          role="status"
          className={`v2-status-dot is-${activeProviderStatus}`}
          title={`Provider status: ${activeProviderStatus}`}
          aria-label={`Provider status: ${activeProviderStatus}`}
        />
        <span>Provider</span>
        <select value={activeProviderId} onChange={(event) => changeProvider(event.target.value)}>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.label} · {providerStatuses[provider.id] ?? 'idle'}
            </option>
          ))}
        </select>
      </label>
      <div className="v2-topbar__title" title={projectTitle}>
        {projectTitle}
      </div>
      <button
        className="v2-icon-button"
        type="button"
        title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <button className="v2-icon-button" type="button" title="Provider settings" onClick={onOpenProviderConfig}>
        <Settings size={18} />
      </button>
    </header>
  );
}
