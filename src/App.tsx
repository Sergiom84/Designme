import {
  AppWindow,
  ChartPie,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  FileCode2,
  FolderOpen,
  Gauge,
  Globe2,
  LayoutDashboard,
  Layers,
  Monitor,
  Palette,
  Presentation,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Tablet,
  Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getThemeById } from './design-system/tokens';
import {
  artifactOptions,
  buildDesignProject,
  defaultTweaks,
  designDirections,
  domainLabels,
  goalLabels,
  type ArtifactType,
  type Density,
  type DesignTweaks,
  type DirectionId,
  type Motion,
  type Tone,
} from './engine';
import type { QualityIssue, Severity } from './quality';

type PreviewMode = 'desktop' | 'tablet' | 'mobile';
type SideTab = 'directions' | 'tweaks' | 'critique' | 'handoff';

interface VersionSnapshot {
  id: string;
  at: string;
  name: string;
  prompt: string;
  artifactType: ArtifactType;
  directionId: DirectionId;
  tweaks: DesignTweaks;
}

const initialPrompt =
  'Crea un diseñador de apps, software y webs local-first: prompt a prototipo, con variaciones visuales, tweaks, crítica y export HTML.';

const sideTabs: Array<{ id: SideTab; label: string; icon: LucideIcon }> = [
  { id: 'directions', label: 'Direcciones', icon: Palette },
  { id: 'tweaks', label: 'Tweaks', icon: SlidersHorizontal },
  { id: 'critique', label: 'Crítica', icon: Gauge },
  { id: 'handoff', label: 'Handoff', icon: FileCode2 },
];

const artifactIcons: Record<ArtifactType, LucideIcon> = {
  software: AppWindow,
  web: Globe2,
  dashboard: LayoutDashboard,
  mobile: Smartphone,
  deck: Presentation,
  infographic: ChartPie,
};

const promptPresets = [
  'Dashboard para un CRM de ventas B2B con pipeline, riesgos y siguientes acciones.',
  'App móvil de hábitos para fundadores ocupados, con foco diario y progreso semanal.',
  'Web de producto para una herramienta de IA que convierte reuniones en tareas verificables.',
  'Deck de lanzamiento para explicar una plataforma local-first de diseño con agentes.',
];

function readStoredVersions(): VersionSnapshot[] {
  try {
    const raw = localStorage.getItem('designme.versions');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VersionSnapshot[];
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

function readStoredTweaks(): DesignTweaks {
  try {
    const raw = localStorage.getItem('designme.tweaks');
    return raw ? { ...defaultTweaks, ...(JSON.parse(raw) as Partial<DesignTweaks>) } : defaultTweaks;
  } catch {
    return defaultTweaks;
  }
}

function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('es', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

export default function App() {
  const [prompt, setPrompt] = useState(() => localStorage.getItem('designme.prompt') ?? initialPrompt);
  const [artifactType, setArtifactType] = useState<ArtifactType>(
    () => (localStorage.getItem('designme.artifactType') as ArtifactType | null) ?? 'software',
  );
  const [directionId, setDirectionId] = useState<DirectionId>(
    () => (localStorage.getItem('designme.directionId') as DirectionId | null) ?? 'systems',
  );
  const [tweaks, setTweaks] = useState<DesignTweaks>(readStoredTweaks);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [sideTab, setSideTab] = useState<SideTab>('directions');
  const [versions, setVersions] = useState<VersionSnapshot[]>(readStoredVersions);
  const [status, setStatus] = useState('Listo');
  const [exportPath, setExportPath] = useState('');

  const output = useMemo(
    () => buildDesignProject({ prompt, artifactType, directionId, tweaks }),
    [artifactType, directionId, prompt, tweaks],
  );

  useEffect(() => {
    localStorage.setItem('designme.prompt', prompt);
  }, [prompt]);

  useEffect(() => {
    localStorage.setItem('designme.artifactType', artifactType);
  }, [artifactType]);

  useEffect(() => {
    localStorage.setItem('designme.directionId', directionId);
  }, [directionId]);

  useEffect(() => {
    localStorage.setItem('designme.tweaks', JSON.stringify(tweaks));
  }, [tweaks]);

  useEffect(() => {
    localStorage.setItem('designme.versions', JSON.stringify(versions));
  }, [versions]);

  function patchTweaks(patch: Partial<DesignTweaks>) {
    setTweaks((current) => ({ ...current, ...patch }));
  }

  function saveVersion() {
    const snapshot: VersionSnapshot = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      name: output.name,
      prompt,
      artifactType,
      directionId,
      tweaks,
    };
    setVersions((current) => [snapshot, ...current].slice(0, 10));
    setStatus(`Versión guardada: ${output.name}`);
  }

  function restoreVersion(snapshot: VersionSnapshot) {
    setPrompt(snapshot.prompt);
    setArtifactType(snapshot.artifactType);
    setDirectionId(snapshot.directionId);
    setTweaks(snapshot.tweaks);
    setStatus(`Versión restaurada: ${snapshot.name}`);
  }

  async function writeClipboard(text: string): Promise<boolean> {
    if (window.designme?.copyText) {
      await window.designme.copyText(text);
      return true;
    }

    const scratch = document.createElement('textarea');
    scratch.value = text;
    scratch.setAttribute('readonly', 'true');
    scratch.style.position = 'fixed';
    scratch.style.left = '-9999px';
    document.body.appendChild(scratch);
    scratch.select();
    const ok = document.execCommand('copy');
    scratch.remove();
    return ok;
  }

  async function copyHandoff() {
    const copied = await writeClipboard(output.handoffPrompt);
    setStatus(copied ? 'Handoff copiado' : 'No se pudo acceder al portapapeles');
  }

  async function copyCritique() {
    const lines = [
      `Quality score: ${output.critique.total}/10`,
      '',
      'Scores:',
      ...output.critique.scores.map((score) => `- ${score.label}: ${score.value}/10`),
      '',
      'Issues:',
      ...output.critique.issues.map((issue) => `- [${issue.severity}] ${issue.title}: ${issue.suggestedFix}`),
      '',
      'Fix:',
      ...output.critique.fix.map((item) => `- ${item}`),
    ];
    const copied = await writeClipboard(lines.join('\n'));
    setStatus(copied ? 'Crítica copiada' : 'No se pudo acceder al portapapeles');
  }

  async function exportHtml() {
    if (window.designme) {
      const result = await window.designme.exportHtml({
        name: output.exportName,
        html: output.html,
      });
      setExportPath(result.filePath);
      setStatus('HTML exportado');
      return;
    }

    const blob = new Blob([output.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${output.exportName}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus('HTML descargado');
  }

  async function openExports() {
    if (!window.designme) {
      setStatus('La carpeta de exports está disponible en modo escritorio');
      return;
    }
    const result = await window.designme.openExports();
    setStatus(`Carpeta abierta: ${result.directory}`);
  }

  const previewSizeLabel =
    previewMode === 'desktop' ? 'Canvas desktop' : previewMode === 'tablet' ? 'Canvas tablet' : 'Canvas móvil';

  return (
    <div className="app-shell">
      <aside className="left-panel">
        <header className="brand-row">
          <div className="brand-mark">
            <Sparkles size={20} aria-hidden />
          </div>
          <div>
            <strong>Designme Studio</strong>
            <span>Local-first design agent</span>
          </div>
        </header>

        <section className="input-section">
          <label htmlFor="prompt">Brief</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            spellCheck={false}
          />
          <div className="preset-list">
            {promptPresets.map((preset) => (
              <button key={preset} type="button" onClick={() => setPrompt(preset)}>
                <Wand2 size={14} aria-hidden />
                <span>{preset}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="input-section">
          <label>Artefacto</label>
          <div className="artifact-grid">
            {artifactOptions.map((option) => {
              const Icon = artifactIcons[option.id];
              return (
                <button
                  key={option.id}
                  type="button"
                  className={classNames('artifact-button', artifactType === option.id && 'is-selected')}
                  onClick={() => setArtifactType(option.id)}
                >
                  <Icon size={18} aria-hidden />
                  <strong>{option.label}</strong>
                  <span>{option.hint}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="input-section versions-section">
          <div className="section-title-row">
            <label>Versiones</label>
            <button
              type="button"
              className="icon-button"
              title="Guardar versión"
              aria-label="Guardar versión"
              onClick={saveVersion}
            >
              <Save size={17} aria-hidden />
            </button>
          </div>
          {versions.length === 0 ? (
            <p className="empty-copy">Guarda una versión para comparar decisiones sin perder el camino.</p>
          ) : (
            <div className="version-list">
              {versions.map((snapshot) => (
                <button key={snapshot.id} type="button" onClick={() => restoreVersion(snapshot)}>
                  <span>{snapshot.name}</span>
                  <small>{formatTime(snapshot.at)}</small>
                </button>
              ))}
            </div>
          )}
        </section>
      </aside>

      <main className="center-panel">
        <header className="canvas-toolbar">
          <div>
            <span>{previewSizeLabel}</span>
            <h1>{output.name}</h1>
            <p>{output.briefSummary}</p>
          </div>
          <div className="toolbar-actions">
            <div className="icon-segment" aria-label="Modo de preview">
              <button
                type="button"
                title="Desktop"
                aria-label="Preview desktop"
                aria-pressed={previewMode === 'desktop'}
                className={previewMode === 'desktop' ? 'active' : ''}
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor size={18} aria-hidden />
              </button>
              <button
                type="button"
                title="Tablet"
                aria-label="Preview tablet"
                aria-pressed={previewMode === 'tablet'}
                className={previewMode === 'tablet' ? 'active' : ''}
                onClick={() => setPreviewMode('tablet')}
              >
                <Tablet size={18} aria-hidden />
              </button>
              <button
                type="button"
                title="Móvil"
                aria-label="Preview móvil"
                aria-pressed={previewMode === 'mobile'}
                className={previewMode === 'mobile' ? 'active' : ''}
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone size={18} aria-hidden />
              </button>
            </div>
            <button type="button" className="command-button" onClick={copyHandoff}>
              <Copy size={17} aria-hidden />
              <span>Copy handoff</span>
            </button>
            <button type="button" className="command-button primary" onClick={exportHtml}>
              <Download size={17} aria-hidden />
              <span>Export HTML</span>
            </button>
          </div>
        </header>

        <section className={classNames('preview-stage', `mode-${previewMode}`)} aria-label="Vista previa">
          <div className="iframe-shell">
            <iframe
              title="Vista previa del diseño"
              srcDoc={output.html}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </section>

        <footer className="status-row" role="status" aria-live="polite">
          <span>{status}</span>
          {exportPath ? <code>{exportPath}</code> : <code>Sin API keys. Todo se genera localmente.</code>}
        </footer>
      </main>

      <aside className="right-panel">
        <nav className="tab-row" role="tablist" aria-label="Panel inspector">
          {sideTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                title={tab.label}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={sideTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                className={sideTab === tab.id ? 'active' : ''}
                onClick={() => setSideTab(tab.id)}
              >
                <Icon size={17} aria-hidden />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {sideTab === 'directions' ? (
          <section
            id="panel-directions"
            role="tabpanel"
            aria-labelledby="tab-directions"
            className="inspector-section"
          >
            <div className="section-heading">
              <Layers size={18} aria-hidden />
              <div>
                <strong>Design direction advisor</strong>
                <span>Tres rutas con intención distinta.</span>
              </div>
            </div>
            <div className="intent-card">
              <div>
                <span>Dominio</span>
                <strong>{domainLabels[output.intent.domain]}</strong>
              </div>
              <div>
                <span>Objetivo UX</span>
                <strong>{goalLabels[output.intent.goal]}</strong>
              </div>
              <p>{output.intent.userMentalModel}</p>
              <ul>
                {output.intent.modules.slice(0, 4).map((module) => (
                  <li key={module.id}>{module.label}</li>
                ))}
              </ul>
            </div>
            <div className="direction-list">
              {designDirections.map((direction) => {
                const theme = getThemeById(direction.themeId);
                return (
                  <button
                    key={direction.id}
                    type="button"
                    aria-pressed={directionId === direction.id}
                    className={classNames('direction-card', directionId === direction.id && 'is-selected')}
                    onClick={() => setDirectionId(direction.id)}
                  >
                    <span className="swatches" aria-hidden>
                      <i style={{ background: theme.color.accent }} />
                      <i style={{ background: theme.color.secondary }} />
                      <i style={{ background: theme.color.highlight }} />
                    </span>
                    <strong>{direction.name}</strong>
                    <small>{direction.school}</small>
                    <p>{direction.promise}</p>
                  </button>
                );
              })}
            </div>
            <div className="assumption-list">
              {output.assumptions.map((assumption) => (
                <div key={assumption}>
                  <CheckCircle2 size={16} aria-hidden />
                  <span>{assumption}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {sideTab === 'tweaks' ? (
          <section
            id="panel-tweaks"
            role="tabpanel"
            aria-labelledby="tab-tweaks"
            className="inspector-section"
          >
            <div className="section-heading">
              <SlidersHorizontal size={18} aria-hidden />
              <div>
                <strong>Tweak surface</strong>
                <span>Controles pequeños, decisiones reales.</span>
              </div>
            </div>

            <TweakSegment<Density>
              label="Density"
              value={tweaks.density}
              options={['calm', 'balanced', 'dense']}
              onChange={(density) => patchTweaks({ density })}
            />
            <TweakSegment<Tone>
              label="Tone"
              value={tweaks.tone}
              options={['light', 'contrast', 'ink']}
              onChange={(tone) => patchTweaks({ tone })}
            />
            <TweakSegment<Motion>
              label="Motion"
              value={tweaks.motion}
              options={['still', 'measured', 'expressive']}
              onChange={(motion) => patchTweaks({ motion })}
            />

            <label className="range-control">
              <span>Radius {tweaks.radius}px</span>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={tweaks.radius}
                onChange={(event) => patchTweaks({ radius: Number(event.target.value) })}
              />
            </label>

            <label className="check-control">
              <input
                type="checkbox"
                checked={tweaks.showDevice}
                onChange={(event) => patchTweaks({ showDevice: event.target.checked })}
              />
              <span>Show device frame for mobile prototypes</span>
            </label>

            <button type="button" className="command-button" onClick={() => setTweaks(defaultTweaks)}>
              <RotateCcw size={17} aria-hidden />
              <span>Reset tweaks</span>
            </button>
          </section>
        ) : null}

        {sideTab === 'critique' ? (
          <section
            id="panel-critique"
            role="tabpanel"
            aria-labelledby="tab-critique"
            className="inspector-section"
          >
            <div className="score-lockup">
              <ClipboardCheck size={22} aria-hidden />
              <strong>{output.critique.total}/10</strong>
              <span>Expert pass</span>
            </div>
            <div className="score-list">
              {output.critique.scores.map((score) => (
                <div key={score.label}>
                  <span>{score.label}</span>
                  <meter min="0" max="10" value={score.value} />
                  <strong>{score.value}</strong>
                </div>
              ))}
            </div>
            <div className="issue-summary">
              <strong>{output.critique.issues.length}</strong>
              <span>issues detectados por reglas locales</span>
              <button type="button" className="command-button" onClick={copyCritique}>
                <Copy size={16} aria-hidden />
                <span>Copiar crítica</span>
              </button>
            </div>
            <QualityIssueList issues={output.critique.issues} />
            <CritiqueBlock title="Keep" items={output.critique.keep} />
            <CritiqueBlock title="Fix" items={output.critique.fix} />
            <CritiqueBlock title="Quick wins" items={output.critique.quickWins} />
          </section>
        ) : null}

        {sideTab === 'handoff' ? (
          <section
            id="panel-handoff"
            role="tabpanel"
            aria-labelledby="tab-handoff"
            className="inspector-section handoff-section"
          >
            <div className="section-heading">
              <FileCode2 size={18} aria-hidden />
              <div>
                <strong>Agent handoff</strong>
                <span>Para Codex, Claude o cualquier agente que ya pagas.</span>
              </div>
            </div>
            <textarea readOnly value={output.handoffPrompt} />
            <div className="handoff-actions">
              <button type="button" className="command-button" onClick={copyHandoff}>
                <Copy size={17} aria-hidden />
                <span>Copy</span>
              </button>
              <button type="button" className="command-button" onClick={openExports}>
                <FolderOpen size={17} aria-hidden />
                <span>Exports</span>
              </button>
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

interface TweakSegmentProps<T extends string> {
  label: string;
  value: T;
  options: T[];
  onChange(value: T): void;
}

function TweakSegment<T extends string>({ label, value, options, onChange }: TweakSegmentProps<T>) {
  return (
    <div className="tweak-group">
      <span>{label}</span>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? 'active' : ''}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function CritiqueBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="critique-block">
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const severityLabels: Record<Severity, string> = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

function QualityIssueList({ issues }: { issues: QualityIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="issue-empty">
        <strong>No blocking issues</strong>
        <span>La pasada determinista no ha encontrado problemas de calidad.</span>
      </div>
    );
  }

  return (
    <div className="issue-list">
      {issues.slice(0, 8).map((issue) => (
        <article key={issue.id} className={`issue-card ${issue.severity}`}>
          <div>
            <span>{severityLabels[issue.severity]}</span>
            <small>{issue.category}</small>
          </div>
          <strong>{issue.title}</strong>
          <p>{issue.detail}</p>
          <em>{issue.suggestedFix}</em>
        </article>
      ))}
    </div>
  );
}
