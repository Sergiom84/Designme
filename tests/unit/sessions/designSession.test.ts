import { describe, expect, it } from 'vitest';
import { defaultTweaks, type BuildInput, type DesignOutput } from '../../../src/engine';
import {
  DESIGN_SESSIONS_STORAGE_KEY,
  MAX_DESIGN_SESSIONS,
  MAX_SESSION_SNAPSHOTS,
  appendDesignSessionSnapshot,
  createDesignSessionFromDraft,
  createInitialDesignSession,
  ensureActiveDesignSession,
  listRecentDesignSessions,
  migrateDesignSessionCollectionValue,
  parseStoredDesignSession,
  parseStoredDesignSessionCollection,
  updateDesignSessionDraft,
  updateDesignSessionInCollection,
  updateDesignSessionOutput,
  upsertDesignSession,
} from '../../../src/sessions';
import type { DesignSession, VersionSnapshot } from '../../../src/types/app';

const currentInput: BuildInput = {
  prompt: 'Dashboard CRM para ventas',
  artifactType: 'dashboard',
  directionId: 'systems',
  tweaks: defaultTweaks,
};

function fixedOptions() {
  let id = 0;

  return {
    now: () => '2026-05-17T10:00:00.000Z',
    createId: () => `id-${++id}`,
  };
}

function snapshot(index: number): VersionSnapshot {
  return {
    id: `snap-${index}`,
    at: `2026-05-17T10:0${index}:00.000Z`,
    name: `Snapshot ${index}`,
    prompt: `Prompt ${index}`,
    artifactType: 'web',
    directionId: 'editorial',
    tweaks: { ...defaultTweaks, radius: index },
  };
}

function session(index: number): DesignSession {
  return {
    id: `session-${index}`,
    createdAt: `2026-05-17T09:${String(index).padStart(2, '0')}:00.000Z`,
    updatedAt: `2026-05-17T10:${String(index).padStart(2, '0')}:00.000Z`,
    draft: {
      ...currentInput,
      prompt: `Session ${index}`,
      tweaks: { ...defaultTweaks, radius: index },
    },
    snapshots: [],
  };
}

const output = {
  name: 'CRM Board',
  exportName: 'crm-board-dashboard',
  briefSummary: 'Resumen',
  html: '<main>CRM</main>',
  handoffPrompt: 'Build CRM',
} as DesignOutput;

describe('design sessions', () => {
  it('exposes a separate storage key for the persistent session collection', () => {
    expect(DESIGN_SESSIONS_STORAGE_KEY).toBe('designme.sessions');
  });

  it('creates an initial session from the current input and legacy snapshots', () => {
    const session = createInitialDesignSession(currentInput, [snapshot(1), snapshot(2)], fixedOptions());

    expect(session).toMatchObject({
      id: 'id-1',
      createdAt: '2026-05-17T10:00:00.000Z',
      updatedAt: '2026-05-17T10:00:00.000Z',
      draft: currentInput,
    });
    expect(session.snapshots.map((item) => item.id)).toEqual(['snap-1', 'snap-2']);
    expect(session.draft).not.toBe(currentInput);
    expect(session.draft.tweaks).not.toBe(currentInput.tweaks);
  });

  it('defensively migrates stored session JSON and normalizes unsafe draft values', () => {
    const stored = JSON.stringify({
      id: 'stored-session',
      createdAt: '2026-05-16T12:00:00.000Z',
      draft: {
        prompt: '  Keep exact prompt  ',
        artifactType: 'unknown',
        directionId: 'kinetic',
        tweaks: { density: 'dense', tone: 'neon', motion: 'still', radius: Number.NaN, showDevice: false },
      },
      snapshots: [snapshot(1)],
      output,
    });

    const session = parseStoredDesignSession(stored, currentInput, [], fixedOptions());

    expect(session.id).toBe('stored-session');
    expect(session.createdAt).toBe('2026-05-16T12:00:00.000Z');
    expect(session.updatedAt).toBe('2026-05-16T12:00:00.000Z');
    expect(session.draft).toEqual({
      prompt: '  Keep exact prompt  ',
      artifactType: 'dashboard',
      directionId: 'kinetic',
      tweaks: { ...defaultTweaks, density: 'dense', motion: 'still', showDevice: false },
    });
    expect(session.snapshots).toHaveLength(1);
    expect(session.output).toEqual(output);
  });

  it('falls back to current input and legacy snapshots for invalid localStorage JSON', () => {
    const session = parseStoredDesignSession('{bad json', currentInput, [snapshot(1)], fixedOptions());

    expect(session.draft).toEqual(currentInput);
    expect(session.snapshots.map((item) => item.id)).toEqual(['snap-1']);
  });

  it('migrates a legacy snapshot array as the session snapshot history', () => {
    const session = parseStoredDesignSession(
      JSON.stringify([snapshot(1), snapshot(2)]),
      currentInput,
      [],
      fixedOptions(),
    );

    expect(session.draft).toEqual(currentInput);
    expect(session.snapshots.map((item) => item.id)).toEqual(['snap-1', 'snap-2']);
  });

  it('updates draft and output without mutating the original session', () => {
    const session = createInitialDesignSession(currentInput, [], fixedOptions());
    const draftUpdated = updateDesignSessionDraft(
      session,
      { prompt: 'Nuevo brief', tweaks: { radius: 12 } },
      { now: () => '2026-05-17T11:00:00.000Z', createId: () => 'unused' },
    );
    const outputUpdated = updateDesignSessionOutput(draftUpdated, output, {
      now: () => '2026-05-17T12:00:00.000Z',
      createId: () => 'unused',
    });

    expect(session.draft.prompt).toBe(currentInput.prompt);
    expect(draftUpdated.draft).toMatchObject({ prompt: 'Nuevo brief', tweaks: { radius: 12 } });
    expect(draftUpdated.draft.tweaks.density).toBe(defaultTweaks.density);
    expect(outputUpdated.output).toBe(output);
    expect(outputUpdated.updatedAt).toBe('2026-05-17T12:00:00.000Z');
  });

  it('appends snapshots newest first and keeps only ten', () => {
    const session = createInitialDesignSession(
      currentInput,
      Array.from({ length: MAX_SESSION_SNAPSHOTS }, (_, index) => snapshot(index)),
      fixedOptions(),
    );

    const updated = appendDesignSessionSnapshot(
      session,
      {
        name: 'Newest',
        prompt: 'Newest prompt',
        artifactType: 'software',
        directionId: 'systems',
        tweaks: defaultTweaks,
        output,
      },
      { now: () => '2026-05-17T13:00:00.000Z', createId: () => 'new-snap' },
    );

    expect(updated.snapshots).toHaveLength(MAX_SESSION_SNAPSHOTS);
    expect(updated.snapshots[0]).toMatchObject({ id: 'new-snap', name: 'Newest', output });
    expect(updated.snapshots.at(-1)?.id).toBe('snap-8');
    expect(session.snapshots[0].id).toBe('snap-0');
  });

  it('creates a standalone session from a draft', () => {
    const draft = { ...currentInput, prompt: 'Nueva app', tweaks: { ...defaultTweaks, radius: 18 } };
    const created = createDesignSessionFromDraft(draft, fixedOptions(), output);

    expect(created).toMatchObject({
      id: 'id-1',
      createdAt: '2026-05-17T10:00:00.000Z',
      updatedAt: '2026-05-17T10:00:00.000Z',
      draft,
      output,
      snapshots: [],
    });
    expect(created.draft).not.toBe(draft);
    expect(created.draft.tweaks).not.toBe(draft.tweaks);
  });

  it('migrates a legacy stored single session into a collection', () => {
    const stored = JSON.stringify({
      id: 'legacy-active',
      createdAt: '2026-05-16T12:00:00.000Z',
      updatedAt: '2026-05-16T13:00:00.000Z',
      draft: { ...currentInput, prompt: 'Legacy prompt' },
      snapshots: [snapshot(1)],
    });

    const collection = parseStoredDesignSessionCollection(stored, currentInput, [], fixedOptions());

    expect(collection.activeSessionId).toBe('legacy-active');
    expect(collection.sessions).toHaveLength(1);
    expect(collection.sessions[0]).toMatchObject({
      id: 'legacy-active',
      updatedAt: '2026-05-16T13:00:00.000Z',
      draft: { prompt: 'Legacy prompt' },
    });
  });

  it('migrates a legacy snapshot array into the active session collection', () => {
    const collection = parseStoredDesignSessionCollection(
      JSON.stringify([snapshot(1), snapshot(2)]),
      currentInput,
      [],
      fixedOptions(),
    );

    expect(collection.activeSessionId).toBe('id-1');
    expect(collection.sessions).toHaveLength(1);
    expect(collection.sessions[0].snapshots.map((item) => item.id)).toEqual(['snap-1', 'snap-2']);
  });

  it('parses a stored collection, preserves the active session, sorts by updatedAt, and prunes to fifty', () => {
    const sessions = Array.from({ length: MAX_DESIGN_SESSIONS + 2 }, (_, index) => session(index));
    const collection = migrateDesignSessionCollectionValue(
      {
        activeSessionId: 'session-49',
        sessions,
      },
      currentInput,
      [],
      fixedOptions(),
    );

    expect(collection.sessions).toHaveLength(MAX_DESIGN_SESSIONS);
    expect(collection.activeSessionId).toBe('session-49');
    expect(collection.sessions[0].id).toBe('session-51');
    expect(collection.sessions.at(-1)?.id).toBe('session-2');
    expect(collection.sessions.some((item) => item.id === 'session-0')).toBe(false);
  });

  it('ensures a valid active session and creates one when the collection is empty', () => {
    const fallbackActive = ensureActiveDesignSession(
      { activeSessionId: 'missing', sessions: [session(1), session(2)] },
      currentInput,
      fixedOptions(),
    );
    const created = ensureActiveDesignSession({ activeSessionId: '', sessions: [] }, currentInput, fixedOptions());

    expect(fallbackActive.activeSessionId).toBe('session-2');
    expect(fallbackActive.sessions.map((item) => item.id)).toEqual(['session-2', 'session-1']);
    expect(created.activeSessionId).toBe('id-1');
    expect(created.sessions[0].draft).toEqual(currentInput);
  });

  it('upserts sessions, reorders by updatedAt, and makes the upserted session active', () => {
    const collection = {
      activeSessionId: 'session-1',
      sessions: [session(1), session(2)],
    };
    const updated = upsertDesignSession(collection, {
      ...session(1),
      updatedAt: '2026-05-17T11:00:00.000Z',
      draft: { ...session(1).draft, prompt: 'Updated' },
    });
    const inserted = upsertDesignSession(updated, {
      ...session(3),
      updatedAt: '2026-05-17T12:00:00.000Z',
    });

    expect(updated.activeSessionId).toBe('session-1');
    expect(updated.sessions.map((item) => item.id)).toEqual(['session-1', 'session-2']);
    expect(updated.sessions[0].draft.prompt).toBe('Updated');
    expect(inserted.activeSessionId).toBe('session-3');
    expect(inserted.sessions.map((item) => item.id)).toEqual(['session-3', 'session-1', 'session-2']);
  });

  it('updates one session in a collection and leaves missing sessions untouched', () => {
    const collection = {
      activeSessionId: 'session-1',
      sessions: [session(1), session(2)],
    };
    const updated = updateDesignSessionInCollection(collection, 'session-2', (item) => ({
      ...item,
      updatedAt: '2026-05-17T12:00:00.000Z',
      draft: { ...item.draft, prompt: 'Changed' },
    }));
    const missing = updateDesignSessionInCollection(collection, 'missing', (item) => ({
      ...item,
      updatedAt: '2026-05-17T12:00:00.000Z',
    }));

    expect(updated.activeSessionId).toBe('session-2');
    expect(updated.sessions[0].id).toBe('session-2');
    expect(updated.sessions[0].draft.prompt).toBe('Changed');
    expect(missing).toBe(collection);
  });

  it('lists recent sessions with a limit without mutating the collection', () => {
    const collection = {
      activeSessionId: 'session-1',
      sessions: [session(1), session(3), session(2)],
    };
    const recent = listRecentDesignSessions(collection, 2);

    expect(recent.map((item) => item.id)).toEqual(['session-3', 'session-2']);
    expect(collection.sessions.map((item) => item.id)).toEqual(['session-1', 'session-3', 'session-2']);
  });
});
