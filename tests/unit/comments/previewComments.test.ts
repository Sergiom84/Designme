import { describe, expect, it } from 'vitest';
import {
  PREVIEW_COMMENTS_STORAGE_KEY,
  appendPreviewCommentsToPrompt,
  buildPreviewCommentsPromptContext,
  createPreviewComment,
  migratePreviewCommentsValue,
  parseStoredPreviewComments,
  removePreviewComment,
  resolvePreviewComment,
  updatePreviewComment,
  type PreviewComment,
} from '../../../src/comments';

function fixedOptions() {
  let id = 0;

  return {
    now: () => '2026-05-17T10:00:00.000Z',
    createId: () => `comment-${++id}`,
  };
}

function comment(index: number, patch: Partial<PreviewComment> = {}): PreviewComment {
  return {
    id: `comment-${index}`,
    sessionId: 'session-1',
    target: {
      selector: `[data-preview-id="hero-${index}"]`,
      label: `Hero ${index}`,
      textSnippet: `Headline ${index}`,
      rect: { x: 10 * index, y: 20, width: 300, height: 120 },
    },
    note: `Make hero ${index} clearer`,
    createdAt: `2026-05-17T10:0${index}:00.000Z`,
    ...patch,
  };
}

describe('preview comments', () => {
  it('exposes the preview comments storage key', () => {
    expect(PREVIEW_COMMENTS_STORAGE_KEY).toBe('designme.previewComments');
  });

  it('creates a normalized comment with deterministic id and timestamps', () => {
    const created = createPreviewComment(
      {
        sessionId: 'session-1',
        target: {
          selector: '  main .hero  ',
          label: '  Hero area  ',
          xRatio: 1.4,
          yRatio: -0.2,
          rect: { x: 12, y: 24, width: 320, height: 160 },
        },
        note: '  Raise contrast on the CTA  ',
      },
      fixedOptions(),
    );

    expect(created).toEqual({
      id: 'comment-1',
      sessionId: 'session-1',
      target: {
        selector: 'main .hero',
        domPath: undefined,
        label: 'Hero area',
        textSnippet: undefined,
        xRatio: 1,
        yRatio: 0,
        rect: { x: 12, y: 24, width: 320, height: 160 },
      },
      note: 'Raise contrast on the CTA',
      createdAt: '2026-05-17T10:00:00.000Z',
      resolvedAt: undefined,
    });
  });

  it('supports position-only targets with normalized ratios and optional rect metadata', () => {
    const created = createPreviewComment(
      {
        sessionId: 'session-1',
        target: {
          xRatio: -0.5,
          yRatio: 2,
          rect: { x: 10, y: 20, width: -30, height: 40 },
        },
        note: '  Move this click target closer to the visual center  ',
      },
      fixedOptions(),
    );

    expect(created.target).toEqual({
      selector: undefined,
      domPath: undefined,
      label: undefined,
      textSnippet: undefined,
      xRatio: 0,
      yRatio: 1,
      rect: undefined,
    });
    expect(buildPreviewCommentsPromptContext([created], 'session-1')).toBe(
      [
        'Preview comments to address in the next generation:',
        '1. Target: position 0%,100%. Note: Move this click target closer to the visual center',
      ].join('\n'),
    );
  });

  it('updates a comment target to normalized pointer coordinates', () => {
    const updated = updatePreviewComment([comment(1)], 'comment-1', {
      target: {
        xRatio: 0.336,
        yRatio: 0.664,
      },
    });

    expect(updated[0].target).toMatchObject({
      xRatio: 0.336,
      yRatio: 0.664,
      rect: undefined,
    });
    expect(buildPreviewCommentsPromptContext(updated, 'session-1')).toContain('Target: position 34%,66%.');
  });

  it('updates, resolves, and removes comments without mutating the original list', () => {
    const original = [comment(1), comment(2)];

    const updated = updatePreviewComment(original, 'comment-1', {
      note: '  Use a tighter headline  ',
      target: { selector: '.headline', textSnippet: 'Current hero copy' },
    });
    const resolved = resolvePreviewComment(updated, 'comment-1', {
      now: () => '2026-05-17T12:00:00.000Z',
      createId: () => 'unused',
    });
    const removed = removePreviewComment(resolved, 'comment-2');

    expect(updated[0]).toMatchObject({
      note: 'Use a tighter headline',
      target: { selector: '.headline', textSnippet: 'Current hero copy' },
    });
    expect(resolved[0].resolvedAt).toBe('2026-05-17T12:00:00.000Z');
    expect(removed.map((item) => item.id)).toEqual(['comment-1']);
    expect(original[0].note).toBe('Make hero 1 clearer');
    expect(original[0].resolvedAt).toBeUndefined();
  });

  it('builds prompt context for unresolved comments in creation order', () => {
    const promptContext = buildPreviewCommentsPromptContext(
      [
        comment(2),
        comment(1),
        comment(3, { sessionId: 'session-2' }),
        comment(4, { resolvedAt: '2026-05-17T12:00:00.000Z' }),
      ],
      'session-1',
    );

    expect(promptContext).toBe(
      [
        'Preview comments to address in the next generation:',
        '1. Target: selector "[data-preview-id="hero-1"]"; label "Hero 1"; text "Headline 1"; rect 10,20,300x120. Note: Make hero 1 clearer',
        '2. Target: selector "[data-preview-id="hero-2"]"; label "Hero 2"; text "Headline 2"; rect 20,20,300x120. Note: Make hero 2 clearer',
      ].join('\n'),
    );
  });

  it('appends prompt context to a generation prompt and keeps comment notes single-line', () => {
    const prompt = appendPreviewCommentsToPrompt('Build a landing page\n', [
      comment(1, { note: 'Increase contrast\non the primary CTA' }),
    ]);

    expect(prompt).toBe(
      [
        'Build a landing page',
        '',
        'Preview comments to address in the next generation:',
        '1. Target: selector "[data-preview-id="hero-1"]"; label "Hero 1"; text "Headline 1"; rect 10,20,300x120. Note: Increase contrast on the primary CTA',
      ].join('\n'),
    );
  });

  it('returns no prompt context when there are no open comments', () => {
    expect(buildPreviewCommentsPromptContext([comment(1, { resolvedAt: '2026-05-17T12:00:00.000Z' })])).toBe('');
  });

  it('defensively migrates stored values and drops unsafe comments', () => {
    const collection = migratePreviewCommentsValue(
      {
        comments: [
          {
            id: 'stored',
            sessionId: 'session-1',
            target: { selector: '.card', rect: { x: 1, y: 2, width: 0, height: 10 } },
            note: '  Fix card spacing  ',
            createdAt: '2026-05-17T09:00:00.000Z',
          },
          {
            id: 'missing-note',
            sessionId: 'session-1',
            target: { selector: '.empty' },
            note: '',
          },
          {
            id: 'missing-target',
            sessionId: 'session-1',
            target: {},
            note: 'Cannot anchor this',
          },
          {
            id: 'position-only',
            sessionId: 'session-1',
            target: { xRatio: 0.25, yRatio: 1.25 },
            note: 'Anchor from pointer only',
          },
          {
            id: 'partial-position',
            sessionId: 'session-1',
            target: { xRatio: 0.25 },
            note: 'Cannot anchor with one coordinate',
          },
        ],
      },
      fixedOptions(),
    );

    expect(collection.comments).toHaveLength(2);
    expect(collection.comments[0]).toMatchObject({
      id: 'stored',
      sessionId: 'session-1',
      target: { selector: '.card', rect: undefined },
      note: 'Fix card spacing',
      createdAt: '2026-05-17T09:00:00.000Z',
    });
    expect(collection.comments[1]).toMatchObject({
      id: 'position-only',
      sessionId: 'session-1',
      target: { xRatio: 0.25, yRatio: 1 },
      note: 'Anchor from pointer only',
    });
  });

  it('parses legacy array storage and falls back for empty or invalid storage', () => {
    const stored = JSON.stringify([
      {
        sessionId: 'session-1',
        target: { domPath: 'body > main > section:nth-child(2)' },
        note: 'Simplify this block',
      },
    ]);

    const parsed = parseStoredPreviewComments(stored, fixedOptions());

    expect(parsed.comments[0]).toMatchObject({
      id: 'comment-1',
      createdAt: '2026-05-17T10:00:00.000Z',
      target: { domPath: 'body > main > section:nth-child(2)' },
      note: 'Simplify this block',
    });
    expect(parseStoredPreviewComments('{bad json')).toEqual({ comments: [] });
    expect(parseStoredPreviewComments(null)).toEqual({ comments: [] });
    expect(parseStoredPreviewComments(undefined)).toEqual({ comments: [] });
  });
});
