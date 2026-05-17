import { AppWindow, ChartPie, Globe2, LayoutDashboard, Plus, Presentation, Save, Smartphone, Sparkles, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { artifactOptions, type ArtifactType } from '../engine/index';
import { es } from '../i18n';
import type { RecentSessionItem, VersionSnapshot } from '../types/app';
import { classNames } from '../utils/classNames';
import { formatTime } from '../utils/format';

const artifactIcons: Record<ArtifactType, LucideIcon> = {
  software: AppWindow,
  web: Globe2,
  dashboard: LayoutDashboard,
  mobile: Smartphone,
  deck: Presentation,
  infographic: ChartPie,
};

interface LeftPanelProps {
  prompt: string;
  promptPresets: string[];
  artifactType: ArtifactType;
  activeSessionId: string;
  recentSessions: RecentSessionItem[];
  versions: VersionSnapshot[];
  compareVersionId: string;
  onCreateSession(): void;
  onSelectSession(sessionId: string): void;
  onPromptChange(prompt: string): void;
  onArtifactTypeChange(type: ArtifactType): void;
  onSaveVersion(): void;
  onRestoreVersion(snapshot: VersionSnapshot): void;
  onCompareVersion(snapshot: VersionSnapshot): void;
}

export function LeftPanel({
  prompt,
  promptPresets,
  artifactType,
  activeSessionId,
  recentSessions,
  versions,
  compareVersionId,
  onCreateSession,
  onSelectSession,
  onPromptChange,
  onArtifactTypeChange,
  onSaveVersion,
  onRestoreVersion,
  onCompareVersion,
}: LeftPanelProps) {
  return (
    <aside className="left-panel">
      <header className="brand-row">
        <div className="brand-mark">
          <Sparkles size={20} aria-hidden />
        </div>
        <div>
          <strong>Designme Studio</strong>
          <span>{es.app.brandSubtitle}</span>
        </div>
      </header>

      <section className="input-section sessions-section" aria-labelledby="sessions-heading">
        <div className="section-title-row">
          <span id="sessions-heading" className="section-label">Recientes</span>
          <button
            type="button"
            className="icon-button"
            title="Nueva sesión"
            aria-label="Nueva sesión"
            onClick={onCreateSession}
          >
            <Plus size={17} aria-hidden />
          </button>
        </div>
        <div className="session-list" role="list" aria-label="Sesiones recientes">
          {recentSessions.map((session) => (
            <article
              key={session.id}
              role="listitem"
              className={classNames('session-item', activeSessionId === session.id && 'is-selected')}
            >
              <button
                type="button"
                aria-current={activeSessionId === session.id ? 'true' : undefined}
                aria-label={`Abrir sesión ${session.name}`}
                onClick={() => onSelectSession(session.id)}
              >
                <span>{session.name}</span>
                <small>{formatTime(session.updatedAt)}</small>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="input-section" aria-labelledby="brief-heading">
        <label id="brief-heading" htmlFor="prompt">Brief</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          spellCheck={false}
          aria-describedby="prompt-help"
        />
        <p id="prompt-help" className="sr-only">
          Describe el producto, audiencia, objetivo y formato que quieres generar.
        </p>
        <div className="preset-list" role="group" aria-label="Prompts predefinidos">
          {promptPresets.map((preset) => (
            <button key={preset} type="button" aria-label={`Usar preset: ${preset}`} onClick={() => onPromptChange(preset)}>
              <Wand2 size={14} aria-hidden />
              <span>{preset}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="input-section" aria-labelledby="artifact-heading">
        <span id="artifact-heading" className="section-label">Artefacto</span>
        <div className="artifact-grid" role="group" aria-labelledby="artifact-heading">
          {artifactOptions.map((option) => {
            const Icon = artifactIcons[option.id];
            return (
              <button
                key={option.id}
                type="button"
                className={classNames('artifact-button', artifactType === option.id && 'is-selected')}
                aria-pressed={artifactType === option.id}
                onClick={() => onArtifactTypeChange(option.id)}
              >
                <Icon size={18} aria-hidden />
                <strong>{option.label}</strong>
                <span>{option.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="input-section versions-section" aria-labelledby="versions-heading">
        <div className="section-title-row">
          <span id="versions-heading" className="section-label">Versiones</span>
          <button
            type="button"
            className="icon-button"
            title="Guardar versión"
            aria-label="Guardar versión"
            onClick={onSaveVersion}
          >
            <Save size={17} aria-hidden />
          </button>
        </div>
        {versions.length === 0 ? (
          <p className="empty-copy">Guarda una versión para comparar decisiones sin perder el camino.</p>
        ) : (
          <div className="version-list" role="list" aria-label="Versiones guardadas">
            {versions.map((snapshot) => (
              <article key={snapshot.id} role="listitem" className={classNames('version-item', compareVersionId === snapshot.id && 'is-selected')}>
                <button type="button" aria-label={`Restaurar versión ${snapshot.name}`} onClick={() => onRestoreVersion(snapshot)}>
                  <span>{snapshot.name}</span>
                  <small>{formatTime(snapshot.at)}</small>
                </button>
                <button
                  type="button"
                  className="compare-button"
                  aria-pressed={compareVersionId === snapshot.id}
                  aria-label={`${compareVersionId === snapshot.id ? 'Cerrar comparación con' : 'Comparar con'} ${snapshot.name}`}
                  onClick={() => onCompareVersion(snapshot)}
                >
                  {compareVersionId === snapshot.id ? 'Comparando' : 'Comparar'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
