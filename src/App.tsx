import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ProviderSetupHints } from './components/ProviderSetupHints';
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
  type BuildInput,
  type DesignOutput,
} from './engine/index';
import { useDesignSessionActions } from './hooks/useDesignSessionActions';
import { useExportActions } from './hooks/useExportActions';
import { useGenerate } from './hooks/useGenerate';
import { useIdbPersistedState } from './hooks/useIdbPersistedState';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { usePreviewZoom } from './hooks/usePreviewZoom';
import { useProviderRuntime } from './hooks/useProviderRuntime';
import { useSetupDetection } from './hooks/useSetupDetection';
import { getActiveProviderId, type ProviderId } from './providers';
import {
  analyzeReferenceNotes,
  emptyReferenceState,
  parseReferenceState,
  type StoredReferenceState,
} from './references';
import {
  applyLocalOpenAISettingsPatch,
  readLocalOpenAISettings,
  type LocalOpenAISettings as LocalOpenAISettingsValue,
} from './settings';
import {
  DESIGN_SESSIONS_STORAGE_KEY,
  LEGACY_PROMPT_PRESETS,
  ensureActiveDesignSession,
  listRecentDesignSessions,
  parseStoredDesignSessionCollection,
  readLegacyInput,
  readLegacyVersions,
  readLocalStorageValue,
  updateDesignSessionInCollection,
  updateDesignSessionOutput,
  type DesignSessionCollection,
} from './sessions';
import type { DesignSession, PreviewMode, RecentSessionItem, SideTab, VersionSnapshot } from './types/app';

export default function App() {
  // Sessions can grow large once each saved version embeds a full HTML
  // artifact, so they live in IndexedDB with localStorage as the warm cache.
  // The other persisted state (references, comments) stays on the smaller
  // synchronous localStorage path.
  const [sessionCollection, setSessionCollection] = useIdbPersistedState<DesignSessionCollection>(
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
  const [canvasOnly, setCanvasOnly] = useState(false);
  const [commentMode, setCommentMode] = useState(false);
  const [generationRunKey, setGenerationRunKey] = useState(0);
  const [compareVersionId, setCompareVersionId] = useState('');
  const [aiUsed, setAiUsed] = useState(false);
  const [agentStreamVisible, setAgentStreamVisible] = useState(() => getActiveProviderId() !== 'deterministic');
  const { providerList, activeProviderId, providerStatuses, changeProvider: changeProviderRuntime } =
    useProviderRuntime({ onStatus: setStatus });
  const [localOpenAISettings, setLocalOpenAISettings] = useState<LocalOpenAISettingsValue>(() =>
    readLocalOpenAISettings(),
  );
  const {
    detection: setupDetection,
    checking: setupChecking,
    dismissed: setupDismissed,
    dismiss: dismissSetup,
    refresh: refreshLocalSetups,
  } = useSetupDetection();
  const { previewZoom, setPreviewZoom, zoomScale, resetPreviewZoom } = usePreviewZoom();

  const designSession = useMemo<DesignSession>(() => {
    const ensured = ensureActiveDesignSession(sessionCollection, readLegacyInput());
    return ensured.sessions.find((session) => session.id === ensured.activeSessionId) ?? ensured.sessions[0];
  }, [sessionCollection]);
  const { artifactType, directionId, prompt, tweaks } = designSession.draft;
  const versions = designSession.snapshots;
  const referenceAnalysis = useMemo(() => analyzeReferenceNotes(referenceState.notes), [referenceState.notes]);
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
    autoGenerate: activeProviderId === 'deterministic',
    runKey: generationRunKey,
    onFinalOutput: persistGeneratedOutput,
  });

  // Keep `outputRef` synced so `useDesignSessionActions.saveVersion` can read
  // the latest output without needing the hook to depend on the generation
  // pipeline directly.
  useEffect(() => {
    outputRef.current = output;
  }, [output]);

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

  const outputRef = useRef<DesignOutput | undefined>(designSession.output);
  const sessionActions = useDesignSessionActions({
    sessionCollection,
    setSessionCollection,
    designSession,
    getOutput: () => outputRef.current ?? designSession.output ?? ({} as DesignOutput),
    onStatus: setStatus,
  });
  const {
    patchTweaks,
    changePrompt,
    changeArtifactType,
    changeDirection,
    resetTweaks,
  } = sessionActions;

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
    const nextProviderId = providerId as ProviderId;
    setAgentStreamVisible(nextProviderId !== 'deterministic');
    changeProviderRuntime(providerId);
  }

  function runActiveProvider() {
    setGenerationRunKey((current) => current + 1);
    setStatus(`Generando con ${activeProvider?.label ?? activeProviderId}`);
  }

  function updateLocalOpenAISettings(nextSettings: LocalOpenAISettingsValue) {
    setLocalOpenAISettings(nextSettings);
  }

  function useOllama(settings: Partial<LocalOpenAISettingsValue>) {
    const nextSettings = applyLocalOpenAISettingsPatch(localOpenAISettings, settings);
    setLocalOpenAISettings(nextSettings);
    changeProvider('local-openai');
    dismissSetup();
    setStatus('Ollama aplicado como provider local');
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
    sessionActions.createSession();
    setCompareVersionId('');
  }

  function selectSession(sessionId: string) {
    sessionActions.selectSession(sessionId);
    setCompareVersionId('');
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

  const saveVersion = sessionActions.saveVersion;

  function restoreVersion(snapshot: VersionSnapshot) {
    sessionActions.restoreVersion(snapshot);
    setCompareVersionId('');
  }

  function compareVersion(snapshot: VersionSnapshot) {
    setCompareVersionId((current) => (current === snapshot.id ? '' : snapshot.id));
    setStatus(`Comparativa ${compareVersionId === snapshot.id ? 'cerrada' : `activa: ${snapshot.name}`}`);
  }

  const { exportPath, copyHandoff, copyCritique, exportHtml, exportBundle, openExports } = useExportActions({
    getOutput: () => output,
    getBundleInput: () => ({
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
    }),
    onStatus: setStatus,
  });

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
          promptPresets={LEGACY_PROMPT_PRESETS}
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
                canGenerate={activeProviderId !== 'deterministic'}
                running={generationRunning}
                onProviderChange={changeProvider}
                onGenerate={runActiveProvider}
                onStop={stopGeneration}
              />
              <ProviderSetupHints
                detection={setupDetection}
                activeProviderId={activeProviderId}
                localOpenAISettings={localOpenAISettings}
                dismissed={setupDismissed}
                checking={setupChecking}
                disabled={generationRunning}
                onActivateProvider={(providerId) => {
                  changeProvider(providerId);
                  dismissSetup();
                }}
                onUseOllama={useOllama}
                onRefresh={() => void refreshLocalSetups({ markChecking: true })}
                onDismiss={() => dismissSetup()}
              />
              <LocalOpenAISettings
                disabled={generationRunning}
                settings={localOpenAISettings}
                onSettingsChange={updateLocalOpenAISettings}
              />
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
