import { useMemo, useState } from 'react';
import { AppShell } from './components/AppShell';
import { CenterPanel } from './components/CenterPanel';
import { CritiqueInspector } from './components/CritiqueInspector';
import { DirectionInspector } from './components/DirectionInspector';
import { HandoffInspector } from './components/HandoffInspector';
import { InspectorPanel } from './components/InspectorPanel';
import { LeftPanel } from './components/LeftPanel';
import { TweakControls } from './components/TweakControls';
import {
  buildDesignProject,
  defaultTweaks,
  type ArtifactType,
  type DesignTweaks,
  type DirectionId,
} from './engine';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { usePreviewZoom } from './hooks/usePreviewZoom';
import type { PreviewMode, SideTab, VersionSnapshot } from './types/app';

const initialPrompt =
  'Crea un diseñador de apps, software y webs local-first: prompt a prototipo, con variaciones visuales, tweaks, crítica y export HTML.';

const promptPresets = [
  'Dashboard para un CRM de ventas B2B con pipeline, riesgos y siguientes acciones.',
  'App móvil de hábitos para fundadores ocupados, con foco diario y progreso semanal.',
  'Web de producto para una herramienta de IA que convierte reuniones en tareas verificables.',
  'Deck de lanzamiento para explicar una plataforma local-first de diseño con agentes.',
];

function parseArtifactType(value: string): ArtifactType {
  return ['software', 'web', 'dashboard', 'mobile', 'deck', 'infographic'].includes(value)
    ? (value as ArtifactType)
    : 'software';
}

function parseDirectionId(value: string): DirectionId {
  return ['systems', 'editorial', 'kinetic'].includes(value) ? (value as DirectionId) : 'systems';
}

function parseTweaks(value: string): DesignTweaks {
  try {
    return { ...defaultTweaks, ...(JSON.parse(value) as Partial<DesignTweaks>) };
  } catch {
    return defaultTweaks;
  }
}

function parseVersions(value: string): VersionSnapshot[] {
  try {
    const parsed = JSON.parse(value) as VersionSnapshot[];
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [prompt, setPrompt] = useLocalStorageState('designme.prompt', initialPrompt, {
    serialize: (value) => value,
    deserialize: (value) => value,
  });
  const [artifactType, setArtifactType] = useLocalStorageState<ArtifactType>('designme.artifactType', 'software', {
    serialize: (value) => value,
    deserialize: parseArtifactType,
  });
  const [directionId, setDirectionId] = useLocalStorageState<DirectionId>('designme.directionId', 'systems', {
    serialize: (value) => value,
    deserialize: parseDirectionId,
  });
  const [tweaks, setTweaks] = useLocalStorageState<DesignTweaks>('designme.tweaks', defaultTweaks, {
    deserialize: parseTweaks,
  });
  const [versions, setVersions] = useLocalStorageState<VersionSnapshot[]>('designme.versions', [], {
    deserialize: parseVersions,
  });
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [sideTab, setSideTab] = useState<SideTab>('directions');
  const [status, setStatus] = useState('Listo');
  const [exportPath, setExportPath] = useState('');
  const [canvasOnly, setCanvasOnly] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState('');
  const { previewZoom, setPreviewZoom, zoomScale, resetPreviewZoom } = usePreviewZoom();

  const output = useMemo(
    () => buildDesignProject({ prompt, artifactType, directionId, tweaks }),
    [artifactType, directionId, prompt, tweaks],
  );

  const compareSnapshot = versions.find((snapshot) => snapshot.id === compareVersionId);
  const compareOutput = useMemo(
    () =>
      compareSnapshot
        ? buildDesignProject({
            prompt: compareSnapshot.prompt,
            artifactType: compareSnapshot.artifactType,
            directionId: compareSnapshot.directionId,
            tweaks: compareSnapshot.tweaks,
          })
        : undefined,
    [compareSnapshot],
  );

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

  function compareVersion(snapshot: VersionSnapshot) {
    setCompareVersionId((current) => (current === snapshot.id ? '' : snapshot.id));
    setStatus(`Comparativa ${compareVersionId === snapshot.id ? 'cerrada' : `activa: ${snapshot.name}`}`);
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

  function resetView() {
    setPreviewMode('desktop');
    resetPreviewZoom();
    setCompareVersionId('');
    setCanvasOnly(false);
    setStatus('Vista restablecida');
  }

  useKeyboardShortcuts({
    onSave: saveVersion,
    onExport: () => void exportHtml(),
    onCanvasOnly: () => setCanvasOnly((current) => !current),
    onResetPreview: resetView,
  });

  const inspectorContent =
    sideTab === 'directions' ? (
      <DirectionInspector output={output} directionId={directionId} onDirectionChange={setDirectionId} />
    ) : sideTab === 'tweaks' ? (
      <TweakControls tweaks={tweaks} onPatch={patchTweaks} onReset={setTweaks} />
    ) : sideTab === 'critique' ? (
      <CritiqueInspector critique={output.critique} onCopyCritique={copyCritique} />
    ) : (
      <HandoffInspector handoffPrompt={output.handoffPrompt} onCopyHandoff={copyHandoff} onOpenExports={openExports} />
    );

  return (
    <AppShell
      canvasOnly={canvasOnly}
      left={
        <LeftPanel
          prompt={prompt}
          promptPresets={promptPresets}
          artifactType={artifactType}
          versions={versions}
          compareVersionId={compareVersionId}
          onPromptChange={setPrompt}
          onArtifactTypeChange={setArtifactType}
          onSaveVersion={saveVersion}
          onRestoreVersion={restoreVersion}
          onCompareVersion={compareVersion}
        />
      }
      center={
        <CenterPanel
          output={output}
          compareOutput={compareOutput}
          previewMode={previewMode}
          previewZoom={previewZoom}
          zoomScale={zoomScale}
          canvasOnly={canvasOnly}
          status={status}
          exportPath={exportPath}
          onPreviewModeChange={setPreviewMode}
          onPreviewZoomChange={setPreviewZoom}
          onToggleCanvasOnly={() => setCanvasOnly((current) => !current)}
          onClearCompare={() => setCompareVersionId('')}
          onResetView={resetView}
          onCopyHandoff={copyHandoff}
          onExportHtml={exportHtml}
        />
      }
      right={
        <InspectorPanel sideTab={sideTab} onSideTabChange={setSideTab}>
          {inspectorContent}
        </InspectorPanel>
      }
    />
  );
}
