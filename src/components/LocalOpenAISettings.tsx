import { KeyRound, ServerCog } from 'lucide-react';
import { useState } from 'react';
import {
  persistLocalOpenAISettings,
  readLocalOpenAISettings,
  type LocalOpenAISettings,
} from '../settings';

interface LocalOpenAISettingsProps {
  disabled?: boolean;
}

export function LocalOpenAISettings({ disabled = false }: LocalOpenAISettingsProps) {
  const [settings, setSettings] = useState<LocalOpenAISettings>(() => readLocalOpenAISettings());

  function patchSettings(patch: Partial<LocalOpenAISettings>) {
    setSettings((current) => persistLocalOpenAISettings({ ...current, ...patch }));
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
