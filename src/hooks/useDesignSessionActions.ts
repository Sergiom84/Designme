import { useCallback, useMemo } from 'react';
import {
  defaultTweaks,
  type ArtifactType,
  type DesignOutput,
  type DesignTweaks,
  type DirectionId,
} from '../engine/index';
import {
  appendDesignSessionSnapshot,
  createDesignSessionFromDraft,
  LEGACY_INITIAL_PROMPT,
  updateDesignSessionDraft,
  updateDesignSessionInCollection,
  upsertDesignSession,
  type DesignSessionCollection,
} from '../sessions';
import type { DesignSession, VersionSnapshot } from '../types/app';

interface UseDesignSessionActionsOptions {
  sessionCollection: DesignSessionCollection;
  setSessionCollection: (
    update: DesignSessionCollection | ((current: DesignSessionCollection) => DesignSessionCollection),
  ) => void;
  designSession: DesignSession;
  /** Lazy accessor so the hook resolves the latest output at call time, breaking the chicken-and-egg with `useGenerate`. */
  getOutput(): DesignOutput;
  onStatus(message: string): void;
}

interface UseDesignSessionActionsResult {
  patchTweaks(patch: Partial<DesignTweaks>): void;
  changePrompt(nextPrompt: string): void;
  changeArtifactType(nextArtifactType: ArtifactType): void;
  changeDirection(nextDirectionId: DirectionId): void;
  resetTweaks(nextTweaks: DesignTweaks): void;
  saveVersion(): VersionSnapshot;
  restoreVersion(snapshot: VersionSnapshot): void;
  createSession(): void;
  selectSession(sessionId: string): void;
}

/**
 * Owns every mutation against the active design session and routes them
 * through `updateDesignSessionInCollection` so the persisted session list, its
 * `updatedAt` timestamp, and the recent-sessions panel all stay consistent.
 * The hook returns thin imperative helpers — App keeps render state (compare
 * id, status string) so the hook can stay free of UI concerns.
 */
export function useDesignSessionActions({
  sessionCollection,
  setSessionCollection,
  designSession,
  getOutput,
  onStatus,
}: UseDesignSessionActionsOptions): UseDesignSessionActionsResult {
  const updateActiveSession = useCallback(
    (update: (session: DesignSession) => DesignSession) => {
      setSessionCollection((current) =>
        updateDesignSessionInCollection(current, current.activeSessionId, update),
      );
    },
    [setSessionCollection],
  );

  const patchTweaks = useCallback(
    (patch: Partial<DesignTweaks>) => {
      updateActiveSession((session) => updateDesignSessionDraft(session, { tweaks: patch }));
    },
    [updateActiveSession],
  );

  const changePrompt = useCallback(
    (nextPrompt: string) => {
      updateActiveSession((session) => updateDesignSessionDraft(session, { prompt: nextPrompt }));
    },
    [updateActiveSession],
  );

  const changeArtifactType = useCallback(
    (nextArtifactType: ArtifactType) => {
      updateActiveSession((session) => updateDesignSessionDraft(session, { artifactType: nextArtifactType }));
    },
    [updateActiveSession],
  );

  const changeDirection = useCallback(
    (nextDirectionId: DirectionId) => {
      updateActiveSession((session) => updateDesignSessionDraft(session, { directionId: nextDirectionId }));
    },
    [updateActiveSession],
  );

  const resetTweaks = useCallback(
    (nextTweaks: DesignTweaks) => {
      updateActiveSession((session) => updateDesignSessionDraft(session, { tweaks: nextTweaks }));
    },
    [updateActiveSession],
  );

  const saveVersion = useCallback((): VersionSnapshot => {
    const output = getOutput();
    const snapshot: VersionSnapshot = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      name: output.name,
      prompt: designSession.draft.prompt,
      artifactType: designSession.draft.artifactType,
      directionId: designSession.draft.directionId,
      tweaks: designSession.draft.tweaks,
      output,
    };
    updateActiveSession((session) => appendDesignSessionSnapshot(session, snapshot));
    onStatus(`Versión guardada: ${output.name}`);
    return snapshot;
  }, [designSession.draft, getOutput, onStatus, updateActiveSession]);

  const restoreVersion = useCallback(
    (snapshot: VersionSnapshot) => {
      updateActiveSession((session) =>
        updateDesignSessionDraft(session, {
          prompt: snapshot.prompt,
          artifactType: snapshot.artifactType,
          directionId: snapshot.directionId,
          tweaks: snapshot.tweaks,
        }),
      );
      onStatus(`Versión restaurada: ${snapshot.name}`);
    },
    [onStatus, updateActiveSession],
  );

  const createSession = useCallback(() => {
    const session = createDesignSessionFromDraft({
      prompt: LEGACY_INITIAL_PROMPT,
      artifactType: 'software',
      directionId: 'systems',
      tweaks: defaultTweaks,
    });
    setSessionCollection((current) => upsertDesignSession(current, session));
    onStatus('Nueva sesión creada');
  }, [onStatus, setSessionCollection]);

  const selectSession = useCallback(
    (sessionId: string) => {
      const session = sessionCollection.sessions.find((item) => item.id === sessionId);
      if (!session) {
        onStatus('No se pudo abrir la sesión');
        return;
      }
      setSessionCollection((current) => ({ ...current, activeSessionId: sessionId }));
      onStatus(`Sesión activa: ${session.output?.name ?? session.draft.prompt}`);
    },
    [onStatus, sessionCollection.sessions, setSessionCollection],
  );

  return useMemo(
    () => ({
      patchTweaks,
      changePrompt,
      changeArtifactType,
      changeDirection,
      resetTweaks,
      saveVersion,
      restoreVersion,
      createSession,
      selectSession,
    }),
    [
      changeArtifactType,
      changeDirection,
      changePrompt,
      createSession,
      patchTweaks,
      resetTweaks,
      restoreVersion,
      saveVersion,
      selectSession,
    ],
  );
}
