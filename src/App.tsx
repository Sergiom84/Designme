import { useCallback, useEffect, useMemo, useState } from 'react';
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
  PREVIEW_COMMENTS_STORAGE_KEY,
  appendPreviewCommentsToPrompt,
  createPreviewComment,
  parseStoredPreviewComments,
  resolvePreviewComment,
  type PreviewCommentCollection,
  type PreviewCommentTarget,
} from './comments';
import {
  buildDesignProject,
  defaultTweaks,
  type ArtifactType,
  type BuildInput,
  type DesignOutput,
  type DesignTweaks,
  type DirectionId,
} from './engine/index';
import { buildExportBundle } from './export';
import { useGenerate } from './hooks/useGenerate';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { usePreviewZoom } from './hooks/usePreviewZoom';
import {
  getActiveProviderId,
  listProviders,
  setActiveProviderId,
  type ProviderId,
  type ProviderStatus,
} from './providers';
import {
  analyzeReferenceNotes,
  emptyReferenceState,
  parseReferenceState,
  type StoredReferenceState,
} from './references';
import {
  DESIGN_SESSIONS_STORAGE_KEY,
  appendDesignSessionSnapshot,
  createDesignSessionFromDraft,
  ensureActiveDesignSession,
  listRecentDesignSessions,
  parseStoredDesignSessionCollection,
  updateDesignSessionDraft,
  updateDesignSessionInCollection,
  updateDesignSessionOutput,
  upsertDesignSession,
  type DesignSessionCollection,
} from './sessions';
import type { DesignSession, PreviewMode, RecentSessionItem, SideTab, VersionSnapshot } from './types/app';

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

function readLocalStorageValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readLegacyInput(): BuildInput {
  return {
    prompt: readLocalStorageValue('designme.prompt') ?? initialPrompt,
    artifactType: parseArtifactType(readLocalStorageValue('designme.artifactType') ?? 'software'),
    directionId: parseDirectionId(readLocalStorageValue('designme.directionId') ?? 'systems'),
    tweaks: parseTweaks(readLocalStorageValue('designme.tweaks') ?? ''),
  };
}

function readLegacyVersions(): VersionSnapshot[] {
  const stored = readLocalStorageValue('designme.versions');
  return stored ? parseVersions(stored) : [];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
}

export default function App() {
  const [sessionCollection, setSessionCollection] = useLocalStorageState<DesignSessionCollection>(
    DESIGN_SESSIONS_STORAGE_KEY,
    () =>
      parseStoredDesignSessionCollection(
        readLocalStorageValue('designme.session') ?? '',
        readLegacyInput(),
        readLegacyVersions(),
      ),
    {
      deserialize: (value) => parseStoredDesignSessionCollection(value, readLegacyInput(), readLegacyVersions()),
    },
  );
  const [referenceState, setReferenceState] = useLocalStorageState<StoredReferenceState>(
    'designme.references',
    emptyReferenceState,
    {
      deserialize: parseReferenceState,
    },
  );
  const [previewComments, setPreviewComments] = useLocalStorageState<PreviewCommentCollection>(
    PREVIEW_COMMENTS_STORAGE_KEY,
    { comments: [] },
    {
      deserialize: parseStoredPreviewComments,
    },
  );
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [sideTab, setSideTab] = useState<SideTab>('directions');
  const [status, setStatus] = useState('Listo');
  const [exportPath, setExportPath] = useState('');
  const [canvasOnly, setCanvasOnly] = useState(false);
  const [commentMode, setCommentMode] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState('');
  const [aiUsed, setAiUsed] = useState(false);
  const [activeProviderId, setActiveProviderIdState] = useState<ProviderId>(() => getActiveProviderId());
  const [agentStreamVisible, setAgentStreamVisible] = useState(() => getActiveProviderId() !== 'deterministic');
  const [providerStatuses, setProviderStatuses] = useState<Record<string, ProviderStatus>>({});
  const { previewZoom, setPreviewZoom, zoomScale, resetPreviewZoom } = usePreviewZoom();

  const designSession = useMemo<DesignSession>(() => {
    const ensured = ensureActiveDesignSession(sessionCollection, readLegacyInput());
    return ensured.sessions.find((session) => session.id === ensured.activeSessionId) ?? ensured.sessions[0];
  }, [sessionCollection]);
  const { artifactType, directionId, prompt, tweaks } = designSession.draft;
  const versions = designSession.snapshots;
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
  const recentSessions = useMemo<RecentSessionItem[]>(
    () =>
      listRecentDesignSessions(sessionCollection).map((session) => ({
        id: session.id,
        name: session.output?.name ?? session.snapshots[0]?.name ?? session.draft.prompt,
        updatedAt: session.updatedAt,
        artifactType: session.draft.artifactType,
        prompt: session.draft.prompt,
      })),
    [sessionCollection],
  );
  const activePreviewComments = useMemo(
    () => previewComments.comments.filter((comment) => comment.sessionId === designSession.id && !comment.resolvedAt),
    [designSession.id, previewComments.comments],
  );
  const generationPrompt = useMemo(
    () => appendPreviewCommentsToPrompt(prompt, activePreviewComments),
    [activePreviewComments, prompt],
  );
  const generationInput = useMemo<BuildInput>(
    () => ({ prompt: generationPrompt, artifactType, directionId, tweaks }),
    [artifactType, directionId, generationPrompt, tweaks],
  );
  const persistGeneratedOutput = useCallback(
    (nextOutput: DesignOutput) => {
      setSessionCollection((current) =>
        updateDesignSessionInCollection(current, current.activeSessionId, (session) =>
          updateDesignSessionOutput(session, nextOutput),
        ),
      );
    },
    [setSessionCollection],
  );

  const {
    output,
    events: generationEvents,
    running: generationRunning,
    stop: stopGeneration,
  } = useGenerate(generationInput, {
    providerId: activeProviderId,
    initialOutput: designSession.output,
    resetKey: designSession.id,
    onFinalOutput: persistGeneratedOutput,
  });

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

  function updateActiveSession(update: (session: DesignSession) => DesignSession) {
    setSessionCollection((current) => updateDesignSessionInCollection(current, current.activeSessionId, update));
  }

  function patchTweaks(patch: Partial<DesignTweaks>) {
    updateActiveSession((session) => updateDesignSessionDraft(session, { tweaks: patch }));
  }

  function changePrompt(nextPrompt: string) {
    updateActiveSession((session) => updateDesignSessionDraft(session, { prompt: nextPrompt }));
  }

  function changeArtifactType(nextArtifactType: ArtifactType) {
    updateActiveSession((session) => updateDesignSessionDraft(session, { artifactType: nextArtifactType }));
  }

  function changeDirection(nextDirectionId: DirectionId) {
    updateActiveSession((session) => updateDesignSessionDraft(session, { directionId: nextDirectionId }));
  }

  function resetTweaks(nextTweaks: DesignTweaks) {
    updateActiveSession((session) => updateDesignSessionDraft(session, { tweaks: nextTweaks }));
  }

  function changeReferenceNotes(notes: string) {
    setReferenceState((current) => ({ ...current, notes }));
  }

  function applyReferencePreferences() {
    if (referenceAnalysis.preferences.directionId) {
      changeDirection(referenceAnalysis.preferences.directionId);
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

  function addPreviewComment(target: PreviewCommentTarget, note: string) {
    if (!note.trim()) return;

    setPreviewComments((current) => ({
      comments: [
        createPreviewComment({
          sessionId: designSession.id,
          target,
          note,
        }),
        ...current.comments,
      ],
    }));
    setStatus('Comentario añadido al siguiente run');
  }

  function resolvePreviewCommentById(commentId: string) {
    setPreviewComments((current) => ({
      comments: resolvePreviewComment(current.comments, commentId),
    }));
    setStatus('Comentario resuelto');
  }

  function createSession() {
    const session = createDesignSessionFromDraft({
      prompt: initialPrompt,
      artifactType: 'software',
      directionId: 'systems',
      tweaks: defaultTweaks,
    });

    setSessionCollection((current) => upsertDesignSession(current, session));
    setCompareVersionId('');
    setStatus('Nueva sesión creada');
  }

  function selectSession(sessionId: string) {
    const session = sessionCollection.sessions.find((item) => item.id === sessionId);
    if (!session) {
      setStatus('No se pudo abrir la sesión');
      return;
    }

    setSessionCollection((current) => ({ ...current, activeSessionId: sessionId }));
    setCompareVersionId('');
    setStatus(`Sesión activa: ${session.output?.name ?? session.draft.prompt}`);
  }

  async function enhancePromptWithReferences() {
    const result = await enhancePrompt({ prompt, referenceAnalysis });
    if (result.applied.length === 0) {
      setStatus(result.disclosure);
      return;
    }
    changePrompt(result.prompt);
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
    updateActiveSession((session) => appendDesignSessionSnapshot(session, snapshot));
    setStatus(`Versión guardada: ${output.name}`);
  }

  function restoreVersion(snapshot: VersionSnapshot) {
    updateActiveSession((session) =>
      updateDesignSessionDraft(session, {
        prompt: snapshot.prompt,
        artifactType: snapshot.artifactType,
        directionId: snapshot.directionId,
        tweaks: snapshot.tweaks,
      }),
    );
    setCompareVersionId('');
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
      <DirectionInspector output={output} directionId={directionId} onDirectionChange={changeDirection} />
    ) : sideTab === 'tweaks' ? (
      <TweakControls tweaks={tweaks} onPatch={patchTweaks} onReset={resetTweaks} />
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
          activeSessionId={sessionCollection.activeSessionId}
          recentSessions={recentSessions}
          versions={versions}
          compareVersionId={compareVersionId}
          onCreateSession={createSession}
          onSelectSession={selectSession}
          onPromptChange={changePrompt}
          onArtifactTypeChange={changeArtifactType}
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
          commentMode={commentMode}
          commentCount={activePreviewComments.length}
          comments={activePreviewComments}
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
          onToggleCommentMode={() => setCommentMode((current) => !current)}
          onCreatePreviewComment={addPreviewComment}
          onResolvePreviewComment={resolvePreviewCommentById}
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
