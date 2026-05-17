import { KeyRound, ServerCog } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  LOCAL_OPENAI_API_KEY_SECRET,
  deleteSecret,
  getSecretStoreStatus,
  persistLocalOpenAISettings,
  readLocalOpenAISettings,
  readSecret,
  writeSecret,
  type LocalOpenAISettings,
} from '../settings';

interface LocalOpenAISettingsProps {
  disabled?: boolean;
  settings?: LocalOpenAISettings;
  onSettingsChange?(settings: LocalOpenAISettings): void;
}

export function LocalOpenAISettings({
  disabled = false,
  settings: controlledSettings,
  onSettingsChange,
}: LocalOpenAISettingsProps) {
  const [uncontrolledSettings, setUncontrolledSettings] = useState<LocalOpenAISettings>(() =>
    readLocalOpenAISettings(),
  );
  const settings = controlledSettings ?? uncontrolledSettings;

  const [secretStoreReady, setSecretStoreReady] = useState(false);
  const [rememberKey, setRememberKey] = useState(false);
  // Track which keys have been hydrated so we never silently overwrite the
  // stored key with an empty string on the first render before the async
  // read has completed.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const status = await getSecretStoreStatus();
      if (cancelled) return;
      setSecretStoreReady(status.ready);
      if (!status.ready) {
        setHydrated(true);
        return;
      }
      const stored = await readSecret(LOCAL_OPENAI_API_KEY_SECRET);
      if (cancelled) return;
      if (typeof stored === 'string' && stored.length > 0) {
        setRememberKey(true);
        const next = persistLocalOpenAISettings({ ...settings, apiKey: stored });
        setUncontrolledSettings(next);
        onSettingsChange?.(next);
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally run only on mount: subsequent edits go through patchSettings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patchSettings(patch: Partial<LocalOpenAISettings>) {
    const nextSettings = persistLocalOpenAISettings({ ...settings, ...patch });
    setUncontrolledSettings(nextSettings);
    onSettingsChange?.(nextSettings);
    if (hydrated && secretStoreReady && rememberKey && typeof patch.apiKey === 'string') {
      if (patch.apiKey.length === 0) {
        void deleteSecret(LOCAL_OPENAI_API_KEY_SECRET);
      } else {
        void writeSecret(LOCAL_OPENAI_API_KEY_SECRET, patch.apiKey);
      }
    }
  }

  function toggleRememberKey(next: boolean) {
    setRememberKey(next);
    if (!secretStoreReady) return;
    if (next) {
      const key = settings.apiKey ?? '';
      if (key.length > 0) {
        void writeSecret(LOCAL_OPENAI_API_KEY_SECRET, key);
      }
    } else {
      void deleteSecret(LOCAL_OPENAI_API_KEY_SECRET);
    }
  }

  return (
    <details className="local-openai-settings">
      <summary>
        <ServerCog size={17} aria-hidden />
        <span>Local OpenAI</span>
      </summary>

      <div className="local-openai-settings-grid">
        <label>
          <span>Base URL</span>
          <input
            type="url"
            value={settings.baseUrl}
            disabled={disabled}
            spellCheck={false}
            onChange={(event) => patchSettings({ baseUrl: event.target.value })}
          />
        </label>

        <label>
          <span>Modelo</span>
          <input
            type="text"
            value={settings.model}
            disabled={disabled}
            spellCheck={false}
            onChange={(event) => patchSettings({ model: event.target.value })}
          />
        </label>

        <label>
          <span>API key</span>
          <div className="local-openai-key-field">
            <KeyRound size={15} aria-hidden />
            <input
              type="password"
              value={settings.apiKey ?? ''}
              disabled={disabled}
              autoComplete="off"
              onChange={(event) => patchSettings({ apiKey: event.target.value })}
            />
          </div>
        </label>

        <label className="local-openai-remember-key">
          <input
            type="checkbox"
            checked={rememberKey}
            disabled={disabled || !secretStoreReady}
            onChange={(event) => toggleRememberKey(event.target.checked)}
          />
          <span>
            Recordar API key en este equipo
            {!secretStoreReady ? ' (no disponible en modo web)' : null}
          </span>
        </label>

        <label>
          <span>Timeout</span>
          <input
            type="number"
            min={1000}
            max={300000}
            step={1000}
            value={settings.timeoutMs}
            disabled={disabled}
            onChange={(event) => patchSettings({ timeoutMs: Number(event.target.value) })}
          />
        </label>
      </div>
    </details>
  );
}
