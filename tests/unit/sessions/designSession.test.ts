import { describe, expect, it } from 'vitest';
import { defaultTweaks, type BuildInput, type DesignOutput } from '../../../src/engine';
import {
  MAX_SESSION_SNAPSHOTS,
  appendDesignSessionSnapshot,
  createInitialDesignSession,
  parseStoredDesignSession,
  updateDesignSessionDraft,
  updateDesignSessionOutput,
} from '../../../src/sessions';
import type { VersionSnapshot } from '../../../src/types/app';

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

const output = {
  name: 'CRM Board',
  exportName: 'crm-board-dashboard',
  briefSummary: 'Resumen',
  html: '<main>CRM</main>',
  handoffPrompt: 'Build CRM',
} as DesignOutput;

describe('design sessions', () => {
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
});
