type Clock = () => string;
type IdFactory = () => string;

export interface PreviewCommentTargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PreviewCommentTarget {
  selector?: string;
  domPath?: string;
  label?: string;
  textSnippet?: string;
  xRatio?: number;
  yRatio?: number;
  rect?: PreviewCommentTargetRect;
}

export interface PreviewComment {
  id: string;
  sessionId: string;
  target: PreviewCommentTarget;
  note: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface PreviewCommentCollection {
  comments: PreviewComment[];
}

export type PreviewCommentDraft = Pick<PreviewComment, 'sessionId' | 'target' | 'note'> &
  Partial<Pick<PreviewComment, 'id' | 'createdAt' | 'resolvedAt'>>;

export interface PreviewCommentPatch {
  target?: PreviewCommentTarget;
  note?: string;
}

interface CommentOptions {
  now?: Clock;
  createId?: IdFactory;
}

const MAX_NOTE_LENGTH = 2000;
const MAX_TARGET_TEXT_LENGTH = 240;
export const PREVIEW_COMMENTS_STORAGE_KEY = 'designme.previewComments';

function defaultNow(): string {
  return new Date().toISOString();
}

function defaultCreateId(): string {
  return crypto.randomUUID();
}

function resolveOptions(options: CommentOptions = {}): Required<CommentOptions> {
  return {
    now: options.now ?? defaultNow,
    createId: options.createId ?? defaultCreateId,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function optionalString(value: unknown, maxLength = MAX_TARGET_TEXT_LENGTH): string | undefined {
  const text = stringValue(value)?.trim();
  if (!text) return undefined;

  return text.slice(0, maxLength);
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeNote(value: unknown): string {
  return (stringValue(value) ?? '').trim().slice(0, MAX_NOTE_LENGTH);
}

function normalizeRect(value: unknown): PreviewCommentTargetRect | undefined {
  if (!isRecord(value)) return undefined;

  const x = finiteNumber(value.x);
  const y = finiteNumber(value.y);
  const width = finiteNumber(value.width);
  const height = finiteNumber(value.height);

  if (x === undefined || y === undefined || width === undefined || height === undefined) return undefined;
  if (width <= 0 || height <= 0) return undefined;

  return { x, y, width, height };
}

function ratioValue(value: unknown): number | undefined {
  const nextValue = finiteNumber(value);
  if (nextValue === undefined) return undefined;

  return Math.min(1, Math.max(0, nextValue));
}

function normalizeTarget(value: unknown): PreviewCommentTarget {
  if (!isRecord(value)) return {};

  return {
    selector: optionalString(value.selector),
    domPath: optionalString(value.domPath),
    label: optionalString(value.label),
    textSnippet: optionalString(value.textSnippet),
    xRatio: ratioValue(value.xRatio),
    yRatio: ratioValue(value.yRatio),
    rect: normalizeRect(value.rect),
  };
}

function hasTargetMetadata(target: PreviewCommentTarget): boolean {
  return Boolean(
    target.selector ||
    target.domPath ||
    target.label ||
    target.textSnippet ||
    target.rect ||
    (target.xRatio !== undefined && target.yRatio !== undefined),
  );
}

function normalizeComment(value: unknown, options: Required<CommentOptions>): PreviewComment | undefined {
  if (!isRecord(value)) return undefined;

  const sessionId = optionalString(value.sessionId);
  const note = normalizeNote(value.note);
  const target = normalizeTarget(value.target);

  if (!sessionId || !note || !hasTargetMetadata(target)) return undefined;

  return {
    id: optionalString(value.id) ?? options.createId(),
    sessionId,
    target,
    note,
    createdAt: stringValue(value.createdAt) ?? options.now(),
    resolvedAt: stringValue(value.resolvedAt),
  };
}

function compactTarget(target: PreviewCommentTarget): string {
  const parts = [
    target.selector ? `selector "${oneLine(target.selector)}"` : undefined,
    target.domPath ? `path "${oneLine(target.domPath)}"` : undefined,
    target.label ? `label "${oneLine(target.label)}"` : undefined,
    target.textSnippet ? `text "${oneLine(target.textSnippet)}"` : undefined,
    target.xRatio !== undefined && target.yRatio !== undefined
      ? `position ${Math.round(target.xRatio * 100)}%,${Math.round(target.yRatio * 100)}%`
      : undefined,
    target.rect
      ? `rect ${Math.round(target.rect.x)},${Math.round(target.rect.y)},${Math.round(target.rect.width)}x${Math.round(
          target.rect.height,
        )}`
      : undefined,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join('; ') : 'preview element';
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function createPreviewComment(draft: PreviewCommentDraft, options: CommentOptions = {}): PreviewComment {
  const resolved = resolveOptions(options);
  const createdAt = draft.createdAt ?? resolved.now();

  return {
    id: draft.id ?? resolved.createId(),
    sessionId: draft.sessionId,
    target: normalizeTarget(draft.target),
    note: normalizeNote(draft.note),
    createdAt,
    resolvedAt: draft.resolvedAt,
  };
}

export function updatePreviewComment(
  comments: PreviewComment[],
  commentId: string,
  patch: PreviewCommentPatch,
): PreviewComment[] {
  return comments.map((comment) =>
    comment.id === commentId
      ? {
          ...comment,
          target: patch.target ? normalizeTarget(patch.target) : comment.target,
          note: patch.note === undefined ? comment.note : normalizeNote(patch.note),
        }
      : comment,
  );
}

export function resolvePreviewComment(
  comments: PreviewComment[],
  commentId: string,
  options: CommentOptions = {},
): PreviewComment[] {
  const resolved = resolveOptions(options);

  return comments.map((comment) =>
    comment.id === commentId
      ? {
          ...comment,
          resolvedAt: comment.resolvedAt ?? resolved.now(),
        }
      : comment,
  );
}

export function removePreviewComment(comments: PreviewComment[], commentId: string): PreviewComment[] {
  return comments.filter((comment) => comment.id !== commentId);
}

export function buildPreviewCommentsPromptContext(comments: PreviewComment[], sessionId?: string): string {
  const openComments = comments
    .filter((comment) => !comment.resolvedAt && (!sessionId || comment.sessionId === sessionId))
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));

  if (openComments.length === 0) return '';

  const lines = openComments.map(
    (comment, index) => `${index + 1}. Target: ${compactTarget(comment.target)}. Note: ${oneLine(comment.note)}`,
  );

  return ['Preview comments to address in the next generation:', ...lines].join('\n');
}

export function appendPreviewCommentsToPrompt(prompt: string, comments: PreviewComment[], sessionId?: string): string {
  const context = buildPreviewCommentsPromptContext(comments, sessionId);
  if (!context) return prompt;

  return `${prompt.trimEnd()}\n\n${context}`;
}

export function migratePreviewCommentsValue(value: unknown, options: CommentOptions = {}): PreviewCommentCollection {
  const resolved = resolveOptions(options);
  const rawComments = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.comments)
      ? value.comments
      : [];

  return {
    comments: rawComments
      .map((comment) => normalizeComment(comment, resolved))
      .filter((comment): comment is PreviewComment => comment !== undefined),
  };
}

export function parseStoredPreviewComments(
  value: string | null | undefined,
  options: CommentOptions = {},
): PreviewCommentCollection {
  if (value === null || value === undefined) return { comments: [] };

  try {
    return migratePreviewCommentsValue(JSON.parse(value) as unknown, options);
  } catch {
    return { comments: [] };
  }
}
