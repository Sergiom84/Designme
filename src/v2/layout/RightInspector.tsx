import { useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { DesignOutput, DesignTweaks } from '../../engine';
import type { Idea, WorkspaceSnapshot } from '../state/types';

type InspectorTab = 'tweaks' | 'design' | 'critique' | 'workspace' | 'references';

interface RightInspectorProps {
  activeIdea?: Idea;
  output?: DesignOutput;
  tweaks: DesignTweaks;
  designMd: string;
  workspace?: WorkspaceSnapshot;
  onPatchTweaks(patch: Partial<DesignTweaks>): void;
  onDesignMdChange(value: string): void;
  onImportWorkspace(): void;
  onRescanWorkspace(): void;
}

const tabs: Array<{ id: InspectorTab; label: string }> = [
  { id: 'tweaks', label: 'Tweaks' },
  { id: 'design', label: 'Design.md' },
  { id: 'critique', label: 'Critique' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'references', label: 'Refs' },
];

export function RightInspector({
  activeIdea,
  output,
  tweaks,
  designMd,
  workspace,
  onPatchTweaks,
  onDesignMdChange,
  onImportWorkspace,
  onRescanWorkspace,
}: RightInspectorProps) {
  const [tab, setTab] = useState<InspectorTab>('tweaks');
  const renderedDesignMd = useMemo(
    () => ({ __html: DOMPurify.sanitize(marked.parse(designMd, { async: false }) as string) }),
    [designMd],
  );

  return (
    <div className="v2-inspector">
      <div className="v2-tabs" role="tablist" aria-label="Inspector tabs">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'tweaks' ? (
        <section className="v2-panel">
          <label>
            Density
            <select value={tweaks.density} onChange={(event) => onPatchTweaks({ density: event.target.value as DesignTweaks['density'] })}>
              <option value="calm">Calm</option>
              <option value="balanced">Balanced</option>
              <option value="dense">Dense</option>
            </select>
          </label>
          <label>
            Tone
            <select value={tweaks.tone} onChange={(event) => onPatchTweaks({ tone: event.target.value as DesignTweaks['tone'] })}>
              <option value="light">Light</option>
              <option value="contrast">Contrast</option>
              <option value="ink">Ink</option>
            </select>
          </label>
          <label>
            Radius
            <input
              max={20}
              min={0}
              type="range"
              value={tweaks.radius}
              onChange={(event) => onPatchTweaks({ radius: Number(event.target.value) })}
            />
          </label>
          <label className="v2-checkbox">
            <input
              checked={tweaks.showDevice}
              type="checkbox"
              onChange={(event) => onPatchTweaks({ showDevice: event.target.checked })}
            />
            Device frame
          </label>
        </section>
      ) : null}

      {tab === 'design' ? (
        <section className="v2-panel v2-design-md">
          <textarea value={designMd} onChange={(event) => onDesignMdChange(event.target.value)} />
          <div className="v2-markdown" dangerouslySetInnerHTML={renderedDesignMd} />
        </section>
      ) : null}

      {tab === 'critique' ? (
        <section className="v2-panel">
          <h3>{activeIdea?.title ?? output?.name ?? 'Sin idea activa'}</h3>
          <p>{output?.briefSummary ?? 'Genera o selecciona una idea para ver critique.'}</p>
          <ul>
            {(output?.critique?.issues ?? []).slice(0, 6).map((issue) => (
              <li key={`${issue.title}-${issue.severity}`}>
                <strong>{issue.severity}</strong> {issue.title}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'workspace' ? (
        <section className="v2-panel">
          {workspace ? (
            <>
              <h3>{workspace.rootPath ?? 'Workspace local'}</h3>
              <p>
                {workspace.stats.fileCount} files · {Math.round(workspace.stats.bytes / 1024)} KB
              </p>
              <pre>{workspace.summary ?? JSON.stringify(workspace.analysis, null, 2)}</pre>
              <button className="v2-secondary-button" type="button" onClick={onRescanWorkspace}>
                Re-scan
              </button>
            </>
          ) : (
            <button className="v2-primary-button" type="button" onClick={onImportWorkspace}>
              Import folder...
            </button>
          )}
        </section>
      ) : null}

      {tab === 'references' ? (
        <section className="v2-panel">
          <p>Referencias viven aquí en v2. Próximo paso: migrar notas y snapshots legacy.</p>
        </section>
      ) : null}
    </div>
  );
}
