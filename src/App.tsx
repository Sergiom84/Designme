import { useEffect, useMemo, useState } from 'react';
import { AgentStream } from './components/AgentStream';
import { AppShell } from './components/AppShell';
import { CenterPanel } from './components/CenterPanel';
import { CritiqueInspector } from './components/CritiqueInspector';
import { DirectionInspector } from './components/DirectionInspector';
import { HandoffInspector } from './components/HandoffInspector';
import { InspectorPanel } from './components/InspectorPanel';
import { LeftPanel } from './components/LeftPanel';
import { LocalOpenAISettings } from './components/LocalOpenAISettings';
import { ProviderPicker, type ProviderPickerOption } from './components/ProviderPicker';
import { ReferenceInspector } from './components/ReferenceInspector';
import { TweakControls } from './components/TweakControls';
import { enhancePrompt } from './ai';
import {
  buildDesignProject,
  defaultTweaks,
  type ArtifactType,
  type BuildInput,
  type DesignTweaks,
  type DirectionId,
} from './engine/index';
import { buildExportBundle } from './export';
import { useGenerate } from './hooks/useGenerate';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { usePreviewZoom } from './hooks/usePreviewZoom';
import { getActiveProviderId, listProviders, setActiveProviderId, type ProviderId, type ProviderStatus } from './providers';
import {
  analyzeReferenceNotes,
  emptyReferenceState,
  parseReferenceState,
  type StoredReferenceState,
} from './references';
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
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
  const [referenceState, setReferenceState] = useLocalStorageState<StoredReferenceState>(
    'designme.references',
    emptyReferenceState,
    {
      deserialize: parseReferenceState,
    },
  );
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [sideTab, setSideTab] = useState<SideTab>('directions');
  const [status, setStatus] = useState('Listo');
  const [exportPath, setExportPath] = useState('');
  const [canvasOnly, setCanvasOnly] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState('');
  const [aiUsed, setAiUsed] = useState(false);
  const [activeProviderId, setActiveProviderIdState] = useState<ProviderId>(() => getActiveProviderId());
  const [agentStreamVisible, setAgentStreamVisible] = useState(() => getActiveProviderId() !== 'deterministic');
  const [providerStatuses, setProviderStatuses] = useState<Record<string, ProviderStatus>>({});
  const { previewZoom, setPreviewZoom, zoomScale, resetPreviewZoom } = usePreviewZoom();

  const referenceAnalysis = useMemo(() => analyzeReferenceNotes(referenceState.notes), [referenceState.notes]);
  const providerList = useMemo(() => listProviders(), []);
  const providerOptions = useMemo<ProviderPickerOption[]>(
    () =>
      providerList.map((provider) => ({
        id: provider.id,
        label: provider.label,
        status: providerStatuses[provider.id] ?? 'idle',
      })),
    [providerList, providerStatuses],
  );
  const activeProvider = providerList.find((provider) => provider.id === activeProviderId) ?? providerList[0];
  const generationInput = useMemo<BuildInput>(
    () => ({ prompt, artifactType, directionId, tweaks }),
    [artifactType, directionId, prompt, tweaks],
  );

  const { output, events: generationEvents, running: generationRunning, stop: stopGeneration } = useGenerate(
    generationInput,
    {
      providerId: activeProviderId,
    },
  );

  const compareSnapshot = versions.find((snapshot) => snapshot.id === compareVersionId);
  const compareOutput = useMemo(() => {
    if (!compareSnapshot) return undefined;
    if (compareSnapshot.output) return compareSnapshot.output;

    return buildDesignProject({
      prompt: compareSnapshot.prompt,
      artifactType: compareSnapshot.artifactType,
      directionId: compareSnapshot.directionId,
      tweaks: compareSnapshot.tweaks,
    });
  }, [compareSnapshot]);
  const generationError = [...generationEvents].reverse().find((event) => event.type === 'error');
  const showAgentStream = activeProviderId !== 'deterministic';
  const visibleStatus =
    generationError?.type === 'error'
      ? generationError.message
      : generationRunning
        ? `Generando con ${activeProvider?.label ?? activeProviderId}`
        : status;

  useEffect(() => {
    let cancelled = false;

    for (const provider of providerList) {
      void provider.status().then((providerStatus) => {
        if (cancelled) return;
        setProviderStatuses((current) => ({ ...current, [provider.id]: providerStatus }));
      });
    }

    return () => {
      cancelled = true;
    };
  }, [providerList, activeProviderId]);

  function patchTweaks(patch: Partial<DesignTweaks>) {
    setTweaks((current) => ({ ...current, ...patch }));
  }

  function changeReferenceNotes(notes: string) {
    setReferenceState((current) => ({ ...current, notes }));
  }

  function applyReferencePreferences() {
    if (referenceAnalysis.preferences.directionId) {
      setDirectionId(referenceAnalysis.preferences.directionId);
    }
    if (Object.keys(referenceAnalysis.preferences.tweaksPatch).length > 0) {
      patchTweaks(referenceAnalysis.preferences.tweaksPatch);
    }
    setReferenceState((current) => ({ ...current, lastAppliedAt: new Date().toISOString() }));
    setStatus('Preferencias de referencia aplicadas');
  }

  function changeProvider(providerId: string) {
    try {
      const nextProviderId = providerId as ProviderId;
      setActiveProviderId(nextProviderId);
      setActiveProviderIdState(nextProviderId);
      setAgentStreamVisible(nextProviderId !== 'deterministic');
      const nextProvider = providerList.find((provider) => provider.id === nextProviderId);
      setStatus(`Provider activo: ${nextProvider?.label ?? nextProviderId}`);
    } catch (error) {
      setStatus(`No se pudo activar el provider: ${errorMessage(error)}`);
    }
  }

  async function enhancePromptWithReferences() {
    const result = await enhancePrompt({ prompt, referenceAnalysis });
    if (result.applied.length === 0) {
      setStatus(result.disclosure);
      return;
    }
    setPrompt(result.prompt);
    setAiUsed(true);
    setReferenceState((current) => ({ ...current, lastAppliedAt: new Date().toISOString() }));
    setStatus('Brief mejorado localmente con referencias');
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
      output,
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
    try {
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
    } catch {
      return false;
    }
  }

  async function copyHandoff() {
    const copied = await writeClipboard(output.handoffPrompt);
    setStatus(copied ? 'Handoff copiado' : 'No se pudo acceder al portapapeles');
  }

  async function copyCritique() {
    const lines = [
      `Puntuación de calidad: ${output.critique.total}/10`,
      '',
      'Puntuaciones:',
      ...output.critique.scores.map((score) => `- ${score.label}: ${score.value}/10`),
      '',
      'Incidencias:',
      ...output.critique.issues.map((issue) => `- [${issue.severity}] ${issue.title}: ${issue.suggestedFix}`),
      '',
      'Corregir:',
      ...output.critique.fix.map((item) => `- ${item}`),
    ];
    const copied = await writeClipboard(lines.join('\n'));
    setStatus(copied ? 'Crítica copiada' : 'No se pudo acceder al portapapeles');
  }

  async function exportHtml() {
    try {
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
    } catch (error) {
      setStatus(`No se pudo exportar HTML: ${errorMessage(error)}`);
    }
  }

  async function exportBundle() {
    try {
      const bundle = buildExportBundle({
        output,
        input: {
          prompt,
          artifactType,
          directionId,
          tweaks,
          references: referenceAnalysis,
          ai: {
            providerId: activeProviderId,
            used: aiUsed || activeProviderId !== 'deterministic',
            localOnly: activeProviderId === 'deterministic' || activeProviderId === 'local-openai',
          },
        },
      });

      if (window.designme) {
        const result = await window.designme.exportBundle({
          name: bundle.name,
          files: bundle.files,
        });
        setExportPath(result.filePath);
        setStatus('Paquete exportado');
        return;
      }

      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bundle.name}-bundle.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('Paquete descargado como JSON');
    } catch (error) {
      setStatus(`No se pudo exportar el paquete: ${errorMessage(error)}`);
    }
  }

  async function openExports() {
    try {
      if (!window.designme) {
        setStatus('La carpeta de exportaciones está disponible en modo escritorio');
        return;
      }
      const result = await window.designme.openExports();
      setStatus(`Carpeta abierta: ${result.directory}`);
    } catch (error) {
      setStatus(`No se pudo abrir exports: ${errorMessage(error)}`);
    }
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
    ) : sideTab === 'references' ? (
      <ReferenceInspector
        referenceState={referenceState}
        analysis={referenceAnalysis}
        onNotesChange={changeReferenceNotes}
        onApplyPreferences={applyReferencePreferences}
        onEnhancePrompt={() => void enhancePromptWithReferences()}
      />
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
          status={visibleStatus}
          exportPath={exportPath}
          providerPicker={
            <>
              <ProviderPicker
                providers={providerOptions}
                activeProviderId={activeProviderId}
                running={generationRunning}
                onProviderChange={changeProvider}
                onStop={stopGeneration}
              />
              <LocalOpenAISettings disabled={generationRunning} />
            </>
          }
          agentStream={
            showAgentStream ? (
              <AgentStream
                events={generationEvents}
                running={generationRunning}
                provider={{ id: activeProviderId, label: activeProvider?.label ?? activeProviderId }}
                visible={agentStreamVisible}
                onToggleVisible={() => setAgentStreamVisible((current) => !current)}
              />
            ) : undefined
          }
          onPreviewModeChange={setPreviewMode}
          onPreviewZoomChange={setPreviewZoom}
          onToggleCanvasOnly={() => setCanvasOnly((current) => !current)}
          onClearCompare={() => setCompareVersionId('')}
          onResetView={resetView}
          onCopyHandoff={copyHandoff}
          onExportHtml={exportHtml}
          onExportBundle={exportBundle}
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
