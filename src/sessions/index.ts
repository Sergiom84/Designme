import {
  defaultTweaks,
  type ArtifactType,
  type BuildInput,
  type DesignOutput,
  type DesignTweaks,
  type DirectionId,
} from '../engine/index';
import type { DesignSession, VersionSnapshot } from '../types/app';

export * from './legacyInput';

export const DESIGN_SESSION_STORAGE_KEY = 'designme.session';
export const DESIGN_SESSIONS_STORAGE_KEY = 'designme.sessions';
export const MAX_SESSION_SNAPSHOTS = 10;
export const MAX_DESIGN_SESSIONS = 50;
export const DESIGN_SESSION_SCHEMA_VERSION = 2;
export const MAX_SESSION_IDEAS = 12;

type Clock = () => string;
type IdFactory = () => string;

interface SessionOptions {
  now?: Clock;
  createId?: IdFactory;
}

export type VersionSnapshotDraft = Omit<VersionSnapshot, 'id' | 'at'> & Partial<Pick<VersionSnapshot, 'id' | 'at'>>;
export type DesignSessionDraftPatch = Partial<Omit<BuildInput, 'tweaks'>> & { tweaks?: Partial<DesignTweaks> };

export interface DesignSessionCollection {
  activeSessionId: string;
  sessions: DesignSession[];
}

const artifactTypes: ArtifactType[] = ['software', 'web', 'dashboard', 'mobile', 'deck', 'infographic'];
const directionIds: DirectionId[] = ['systems', 'editorial', 'kinetic'];
const densities: DesignTweaks['density'][] = ['calm', 'balanced', 'dense'];
const tones: DesignTweaks['tone'][] = ['light', 'contrast', 'ink'];
const motions: DesignTweaks['motion'][] = ['still', 'measured', 'expressive'];

function defaultNow(): string {
  return new Date().toISOString();
}

function defaultCreateId(): string {
  return crypto.randomUUID();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function parseArtifactType(value: unknown, fallback: ArtifactType): ArtifactType {
  return typeof value === 'string' && artifactTypes.includes(value as ArtifactType)
    ? (value as ArtifactType)
    : fallback;
}

function parseDirectionId(value: unknown, fallback: DirectionId): DirectionId {
  return typeof value === 'string' && directionIds.includes(value as DirectionId) ? (value as DirectionId) : fallback;
}

function parseTweaks(value: unknown, fallback: DesignTweaks): DesignTweaks {
  if (!isRecord(value)) return { ...fallback };

  const density = densities.includes(value.density as DesignTweaks['density'])
    ? (value.density as DesignTweaks['density'])
    : fallback.density;
  const tone = tones.includes(value.tone as DesignTweaks['tone'])
    ? (value.tone as DesignTweaks['tone'])
    : fallback.tone;
  const motion = motions.includes(value.motion as DesignTweaks['motion'])
    ? (value.motion as DesignTweaks['motion'])
    : fallback.motion;
  const radius = typeof value.radius === 'number' && Number.isFinite(value.radius) ? value.radius : fallback.radius;
  const showDevice = typeof value.showDevice === 'boolean' ? value.showDevice : fallback.showDevice;

  return { density, tone, motion, radius, showDevice };
}

function normalizeInput(value: unknown, fallback: BuildInput): BuildInput {
  if (!isRecord(value)) return cloneInput(fallback);

  return {
    prompt: stringValue(value.prompt) ?? fallback.prompt,
    artifactType: parseArtifactType(value.artifactType, fallback.artifactType),
    directionId: parseDirectionId(value.directionId, fallback.directionId),
    tweaks: parseTweaks(value.tweaks, fallback.tweaks),
  };
}

function isDesignOutput(value: unknown): value is DesignOutput {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.exportName === 'string' &&
    typeof value.briefSummary === 'string' &&
    typeof value.html === 'string' &&
    typeof value.handoffPrompt === 'string'
  );
}

function cloneInput(input: BuildInput): BuildInput {
  return {
    ...input,
    tweaks: { ...input.tweaks },
  };
}

function normalizeSnapshot(
  value: unknown,
  fallbackInput: BuildInput,
  options: Required<SessionOptions>,
): VersionSnapshot | undefined {
  if (!isRecord(value)) return undefined;

  const output = isDesignOutput(value.output) ? value.output : undefined;
  const draft = normalizeInput(value, fallbackInput);
  const name = stringValue(value.name) ?? output?.name ?? 'Version guardada';

  return {
    id: stringValue(value.id) ?? options.createId(),
    at: stringValue(value.at) ?? options.now(),
    name,
    ...draft,
    output,
  };
}

function normalizeSnapshots(
  values: unknown,
  fallbackInput: BuildInput,
  options: Required<SessionOptions>,
): VersionSnapshot[] {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => normalizeSnapshot(value, fallbackInput, options))
    .filter((snapshot): snapshot is VersionSnapshot => snapshot !== undefined)
    .slice(0, MAX_SESSION_SNAPSHOTS);
}

function sortSessionsByUpdatedAt(sessions: DesignSession[]): DesignSession[] {
  return [...sessions].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
}

function pruneSessions(sessions: DesignSession[]): DesignSession[] {
  return sortSessionsByUpdatedAt(sessions).slice(0, MAX_DESIGN_SESSIONS);
}

function resolveOptions(options: SessionOptions = {}): Required<SessionOptions> {
  return {
    now: options.now ?? defaultNow,
    createId: options.createId ?? defaultCreateId,
  };
}

export function createInitialDesignSession(
  currentInput: BuildInput,
  legacySnapshots: unknown = [],
  options: SessionOptions = {},
): DesignSession {
  const resolved = resolveOptions(options);
  const at = resolved.now();
  const draft = normalizeInput(currentInput, {
    ...currentInput,
    tweaks: { ...defaultTweaks, ...currentInput.tweaks },
  });

  return {
    id: resolved.createId(),
    createdAt: at,
    updatedAt: at,
    draft,
    chatTurns: [],
    ideas: [],
    snapshots: normalizeSnapshots(legacySnapshots, draft, resolved),
  };
}

export function parseStoredDesignSession(
  value: string,
  currentInput: BuildInput,
  legacySnapshots: unknown = [],
  options: SessionOptions = {},
): DesignSession {
  const resolved = resolveOptions(options);

  try {
    return migrateDesignSessionValue(JSON.parse(value) as unknown, currentInput, legacySnapshots, resolved);
  } catch {
    return createInitialDesignSession(currentInput, legacySnapshots, resolved);
  }
}

export function migrateDesignSessionValue(
  value: unknown,
  currentInput: BuildInput,
  legacySnapshots: unknown = [],
  options: SessionOptions = {},
): DesignSession {
  const resolved = resolveOptions(options);

  if (Array.isArray(value)) {
    return createInitialDesignSession(currentInput, value, resolved);
  }

  if (!isRecord(value)) {
    return createInitialDesignSession(currentInput, legacySnapshots, resolved);
  }

  const base = createInitialDesignSession(currentInput, legacySnapshots, resolved);
  const draft = normalizeInput(value.draft, base.draft);
  const createdAt = stringValue(value.createdAt) ?? base.createdAt;
  const updatedAt = stringValue(value.updatedAt) ?? stringValue(value.createdAt) ?? base.updatedAt;
  const storedSnapshots = normalizeSnapshots(value.snapshots, draft, resolved);
  const snapshots = storedSnapshots.length > 0 ? storedSnapshots : base.snapshots;

  return {
    id: stringValue(value.id) ?? base.id,
    createdAt,
    updatedAt,
    draft,
    output: isDesignOutput(value.output) ? value.output : undefined,
    chatTurns: Array.isArray(value.chatTurns) ? value.chatTurns : [],
    ideas: Array.isArray(value.ideas) ? value.ideas.slice(0, MAX_SESSION_IDEAS) : [],
    snapshots,
  };
}

export function createDesignSessionFromDraft(
  draft: BuildInput,
  options: SessionOptions = {},
  output?: DesignOutput,
): DesignSession {
  const session = createInitialDesignSession(draft, [], options);

  return output ? { ...session, output } : session;
}

export function upsertDesignSession(collection: DesignSessionCollection, session: DesignSession): DesignSessionCollection {
  const otherSessions = collection.sessions.filter((item) => item.id !== session.id);
  const sessions = pruneSessions([session, ...otherSessions]);
  const activeSessionId = sessions.some((item) => item.id === session.id) ? session.id : sessions[0]?.id;

  return {
    activeSessionId: activeSessionId ?? collection.activeSessionId,
    sessions,
  };
}

export function updateDesignSessionInCollection(
  collection: DesignSessionCollection,
  sessionId: string,
  update: (session: DesignSession) => DesignSession,
): DesignSessionCollection {
  const session = collection.sessions.find((item) => item.id === sessionId);
  if (!session) return collection;

  return upsertDesignSession(collection, update(session));
}

export function listRecentDesignSessions(
  collection: DesignSessionCollection,
  limit: number = MAX_DESIGN_SESSIONS,
): DesignSession[] {
  return sortSessionsByUpdatedAt(collection.sessions).slice(0, Math.max(0, limit));
}

export function ensureActiveDesignSession(
  collection: DesignSessionCollection,
  currentInput: BuildInput,
  options: SessionOptions = {},
): DesignSessionCollection {
  const sessions = pruneSessions(collection.sessions);
  const activeSession = sessions.find((session) => session.id === collection.activeSessionId) ?? sessions[0];

  if (activeSession) {
    return {
      activeSessionId: activeSession.id,
      sessions,
    };
  }

  const session = createInitialDesignSession(currentInput, [], options);
  return {
    activeSessionId: session.id,
    sessions: [session],
  };
}

export function migrateDesignSessionCollectionValue(
  value: unknown,
  currentInput: BuildInput,
  legacySnapshots: unknown = [],
  options: SessionOptions = {},
): DesignSessionCollection {
  const resolved = resolveOptions(options);

  if (isRecord(value) && Array.isArray(value.sessions)) {
    const sessions = pruneSessions(
      value.sessions.map((session) => migrateDesignSessionValue(session, currentInput, [], resolved)),
    );

    return ensureActiveDesignSession(
      {
        activeSessionId: stringValue(value.activeSessionId) ?? sessions[0]?.id ?? '',
        sessions,
      },
      currentInput,
      resolved,
    );
  }

  const session = migrateDesignSessionValue(value, currentInput, legacySnapshots, resolved);
  return {
    activeSessionId: session.id,
    sessions: [session],
  };
}

export function parseStoredDesignSessionCollection(
  value: string,
  currentInput: BuildInput,
  legacySnapshots: unknown = [],
  options: SessionOptions = {},
): DesignSessionCollection {
  const resolved = resolveOptions(options);

  try {
    return migrateDesignSessionCollectionValue(JSON.parse(value) as unknown, currentInput, legacySnapshots, resolved);
  } catch {
    const session = createInitialDesignSession(currentInput, legacySnapshots, resolved);
    return {
      activeSessionId: session.id,
      sessions: [session],
    };
  }
}

export function updateDesignSessionDraft(
  session: DesignSession,
  patch: DesignSessionDraftPatch,
  options: SessionOptions = {},
): DesignSession {
  const resolved = resolveOptions(options);
  const draft = normalizeInput(
    {
      ...session.draft,
      ...patch,
      tweaks: patch.tweaks ? { ...session.draft.tweaks, ...patch.tweaks } : session.draft.tweaks,
    },
    session.draft,
  );

  return {
    ...session,
    updatedAt: resolved.now(),
    draft,
  };
}

export function updateDesignSessionOutput(
  session: DesignSession,
  output: DesignOutput | undefined,
  options: SessionOptions = {},
): DesignSession {
  return {
    ...session,
    updatedAt: resolveOptions(options).now(),
    output,
  };
}

export function appendDesignSessionSnapshot(
  session: DesignSession,
  snapshot: VersionSnapshotDraft,
  options: SessionOptions = {},
): DesignSession {
  const resolved = resolveOptions(options);
  const normalized = normalizeSnapshot(snapshot, session.draft, resolved);
  if (!normalized) return session;

  return {
    ...session,
    updatedAt: resolved.now(),
    snapshots: [normalized, ...session.snapshots].slice(0, MAX_SESSION_SNAPSHOTS),
  };
}
