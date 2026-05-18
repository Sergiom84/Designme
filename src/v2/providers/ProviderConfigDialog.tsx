import { ExternalLink, KeyRound, RefreshCw, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ProviderId, ProviderStatus } from '../../providers';
import {
  LOCAL_OPENAI_API_KEY_SECRET,
  apiProviderSecretKey,
  deleteSecret,
  persistApiProviderSettings,
  persistLocalOpenAISettings,
  readApiProviderSettings,
  readLocalOpenAISettings,
  readSecret,
  setLocalOpenAISessionApiKey,
  writeSecret,
  type ApiProviderId,
  type ApiProviderSettings,
  type LocalOpenAISettings,
} from '../../settings';
import type { ThemeMode } from '../state/types';

type ConfigurableProviderId = ProviderId;
type ApiForm = ApiProviderSettings & { apiKey: string };

interface ProviderConfigDialogProps {
  open: boolean;
  activeProviderId: ProviderId;
  providerStatuses: Partial<Record<ProviderId, ProviderStatus>>;
  theme: ThemeMode;
  detection?: DesignmeLocalSetupDetection;
  checking: boolean;
  onClose(): void;
  onRecheck(): void | Promise<void>;
  onSaved?(providerId: ProviderId): void;
}

const PROVIDER_TABS: Array<{ id: ConfigurableProviderId; label: string; kind: 'local' | 'api' | 'cli' | 'none' }> = [
  { id: 'deterministic', label: 'Local', kind: 'none' },
  { id: 'local-openai', label: 'Local OpenAI', kind: 'local' },
  { id: 'anthropic-api', label: 'Anthropic API', kind: 'api' },
  { id: 'openai-api', label: 'OpenAI API', kind: 'api' },
  { id: 'claude-code-cli', label: 'Claude Code', kind: 'cli' },
  { id: 'codex-cli', label: 'Codex', kind: 'cli' },
];

const CLI_INSTALL_DOCS: Record<Extract<ProviderId, 'claude-code-cli' | 'codex-cli'>, string> = {
  'claude-code-cli': '/docs/providers.md#claude-code',
  'codex-cli': '/docs/providers.md#codex',
};

const STATUS_LABELS: Record<ProviderStatus, string> = {
  idle: 'Idle',
  checking: 'Checking',
  ready: 'Ready',
  error: 'Error',
};

function isApiProviderId(providerId: ProviderId): providerId is ApiProviderId {
  return providerId === 'anthropic-api' || providerId === 'openai-api';
}

function isCliProviderId(providerId: ProviderId): providerId is Extract<ProviderId, 'claude-code-cli' | 'codex-cli'> {
  return providerId === 'claude-code-cli' || providerId === 'codex-cli';
}

function createApiForms(): Record<ApiProviderId, ApiForm> {
  return {
    'anthropic-api': { ...readApiProviderSettings('anthropic-api'), apiKey: '' },
    'openai-api': { ...readApiProviderSettings('openai-api'), apiKey: '' },
  };
}

function providerLabel(providerId: ProviderId): string {
  return PROVIDER_TABS.find((provider) => provider.id === providerId)?.label ?? providerId;
}

export function ProviderConfigDialog({
  open,
  activeProviderId,
  providerStatuses,
  theme,
  detection,
  checking,
  onClose,
  onRecheck,
  onSaved,
}: ProviderConfigDialogProps) {
  const [activeTab, setActiveTab] = useState<ConfigurableProviderId>(activeProviderId);
  const [apiForms, setApiForms] = useState<Record<ApiProviderId, ApiForm>>(() => createApiForms());
  const [localForm, setLocalForm] = useState<LocalOpenAISettings>(() => readLocalOpenAISettings());
  const [message, setMessage] = useState('');
  const activeTabInfo = useMemo(
    () => PROVIDER_TABS.find((provider) => provider.id === activeTab) ?? PROVIDER_TABS[0],
    [activeTab],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    void readSecret(LOCAL_OPENAI_API_KEY_SECRET).then((storedKey) => {
      if (cancelled || typeof storedKey !== 'string') return;
      setLocalForm((current) => ({ ...current, apiKey: storedKey }));
      setLocalOpenAISessionApiKey(storedKey);
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  function patchApiForm(providerId: ApiProviderId, patch: Partial<ApiForm>) {
    setApiForms((current) => ({
      ...current,
      [providerId]: {
        ...current[providerId],
        ...patch,
      },
    }));
  }

  async function saveApiProvider(providerId: ApiProviderId) {
    const form = apiForms[providerId];
    const settings = persistApiProviderSettings(providerId, {
      baseUrl: form.baseUrl,
      model: form.model,
    });
    const key = form.apiKey.trim();

    if (key) {
      const stored = await writeSecret(apiProviderSecretKey(providerId), key);
      if (!stored) {
        setMessage(`${providerLabel(providerId)} settings saved, but the API key could not be stored.`);
        onSaved?.(providerId);
        return;
      }
    }

    patchApiForm(providerId, { ...settings, apiKey: '' });
    setMessage(
      key
        ? `${providerLabel(providerId)} settings saved.`
        : `${providerLabel(providerId)} settings saved. Key unchanged.`,
    );
    onSaved?.(providerId);
  }

  async function saveLocalOpenAI() {
    const key = (localForm.apiKey ?? '').trim();
    const settings = persistLocalOpenAISettings({ ...localForm, apiKey: key });
    setLocalOpenAISessionApiKey(key);

    if (key) {
      const stored = await writeSecret(LOCAL_OPENAI_API_KEY_SECRET, key);
      setMessage(
        stored ? 'Local OpenAI settings saved.' : 'Local OpenAI settings saved. Key kept for this session only.',
      );
    } else {
      await deleteSecret(LOCAL_OPENAI_API_KEY_SECRET);
      setMessage('Local OpenAI settings saved.');
    }

    setLocalForm(settings);
    onSaved?.('local-openai');
  }

  function renderStatus(providerId: ProviderId) {
    const status = providerStatuses[providerId] ?? 'idle';
    return (
      <span
        className="v2-provider-dialog__status"
        aria-label={`${providerLabel(providerId)} status: ${STATUS_LABELS[status]}`}
      >
        <span className={`v2-status-dot is-${status}`} />
        {STATUS_LABELS[status]}
      </span>
    );
  }

  function renderApiPanel(providerId: ApiProviderId) {
    const form = apiForms[providerId];

    return (
      <form
        className="v2-provider-dialog__form"
        onSubmit={(event) => {
          event.preventDefault();
          void saveApiProvider(providerId);
        }}
      >
        <label>
          <span>API key</span>
          <div className="v2-provider-dialog__key-field">
            <KeyRound size={15} aria-hidden />
            <input
              type="password"
              value={form.apiKey}
              autoComplete="off"
              placeholder="Leave blank to keep current key"
              onChange={(event) => patchApiForm(providerId, { apiKey: event.target.value })}
            />
          </div>
        </label>
        <label>
          <span>Base URL</span>
          <input
            type="url"
            value={form.baseUrl}
            spellCheck={false}
            onChange={(event) => patchApiForm(providerId, { baseUrl: event.target.value })}
          />
        </label>
        <label>
          <span>Model</span>
          <input
            type="text"
            value={form.model}
            spellCheck={false}
            onChange={(event) => patchApiForm(providerId, { model: event.target.value })}
          />
        </label>
        <div className="v2-provider-dialog__actions">
          <button className="v2-primary-button" type="submit">
            <Save size={15} aria-hidden />
            Save provider
          </button>
        </div>
      </form>
    );
  }

  function renderCliPanel(providerId: Extract<ProviderId, 'claude-code-cli' | 'codex-cli'>) {
    const setup = detection?.providers.find((provider) => provider.id === providerId);
    const detectedLabel = setup?.detected ? 'Detected' : 'Not detected';
    const readyLabel = setup?.ready ? 'Ready' : 'Not ready';

    return (
      <div className="v2-provider-dialog__form">
        <div className="v2-provider-dialog__field">
          <span>Detection</span>
          <strong>{checking ? 'Checking' : detectedLabel}</strong>
        </div>
        <div className="v2-provider-dialog__field">
          <span>Ready</span>
          <strong>{readyLabel}</strong>
        </div>
        <label>
          <span>CLI path</span>
          <input readOnly value={setup?.command ?? 'Not detected'} />
        </label>
        <div className="v2-provider-dialog__detail">{setup?.detail ?? 'Run detection to refresh this provider.'}</div>
        <div className="v2-provider-dialog__actions">
          <button className="v2-secondary-button" type="button" onClick={() => void onRecheck()}>
            <RefreshCw size={15} aria-hidden />
            Re-check
          </button>
          <a className="v2-provider-dialog__link" href={CLI_INSTALL_DOCS[providerId]} target="_blank" rel="noreferrer">
            Install docs
            <ExternalLink size={14} aria-hidden />
          </a>
        </div>
      </div>
    );
  }

  function renderLocalPanel() {
    return (
      <form
        className="v2-provider-dialog__form"
        onSubmit={(event) => {
          event.preventDefault();
          void saveLocalOpenAI();
        }}
      >
        <label>
          <span>Base URL</span>
          <input
            type="url"
            value={localForm.baseUrl}
            spellCheck={false}
            onChange={(event) => setLocalForm((current) => ({ ...current, baseUrl: event.target.value }))}
          />
        </label>
        <label>
          <span>Model</span>
          <input
            type="text"
            value={localForm.model}
            spellCheck={false}
            onChange={(event) => setLocalForm((current) => ({ ...current, model: event.target.value }))}
          />
        </label>
        <label>
          <span>Optional key</span>
          <div className="v2-provider-dialog__key-field">
            <KeyRound size={15} aria-hidden />
            <input
              type="password"
              value={localForm.apiKey ?? ''}
              autoComplete="off"
              onChange={(event) => setLocalForm((current) => ({ ...current, apiKey: event.target.value }))}
            />
          </div>
        </label>
        <div className="v2-provider-dialog__actions">
          <button className="v2-primary-button" type="submit">
            <Save size={15} aria-hidden />
            Save provider
          </button>
        </div>
      </form>
    );
  }

  function renderPanel() {
    if (activeTabInfo.kind === 'api' && isApiProviderId(activeTabInfo.id)) {
      return renderApiPanel(activeTabInfo.id);
    }
    if (activeTabInfo.kind === 'cli' && isCliProviderId(activeTabInfo.id)) {
      return renderCliPanel(activeTabInfo.id);
    }
    if (activeTabInfo.kind === 'local') {
      return renderLocalPanel();
    }

    return (
      <div className="v2-provider-dialog__form">
        <div className="v2-provider-dialog__field">
          <span>Status</span>
          <strong>Ready</strong>
        </div>
        <p className="v2-provider-dialog__detail">The local deterministic provider does not need configuration.</p>
      </div>
    );
  }

  return (
    <div className={`v2-provider-dialog-backdrop v2-shell--${theme}`} role="presentation">
      <section className="v2-provider-dialog" role="dialog" aria-modal="true" aria-labelledby="provider-config-title">
        <header className="v2-provider-dialog__header">
          <div>
            <h2 id="provider-config-title">Provider configuration</h2>
            {renderStatus(activeTabInfo.id)}
          </div>
          <button className="v2-icon-button" type="button" title="Close provider settings" onClick={onClose}>
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="v2-provider-dialog__body">
          <nav className="v2-provider-dialog__tabs" role="tablist" aria-label="Providers">
            {PROVIDER_TABS.map((provider) => {
              const status = providerStatuses[provider.id] ?? 'idle';
              return (
                <button
                  key={provider.id}
                  id={`provider-tab-${provider.id}`}
                  role="tab"
                  type="button"
                  aria-selected={activeTab === provider.id}
                  aria-controls={`provider-panel-${provider.id}`}
                  className={activeTab === provider.id ? 'is-active' : undefined}
                  onClick={() => setActiveTab(provider.id)}
                >
                  <span className={`v2-status-dot is-${status}`} aria-hidden />
                  {provider.label}
                </button>
              );
            })}
          </nav>

          <section
            id={`provider-panel-${activeTabInfo.id}`}
            className="v2-provider-dialog__panel"
            role="tabpanel"
            aria-labelledby={`provider-tab-${activeTabInfo.id}`}
          >
            {renderPanel()}
            {message ? <p className="v2-provider-dialog__message">{message}</p> : null}
          </section>
        </div>
      </section>
    </div>
  );
}
