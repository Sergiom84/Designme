import { describe, expect, it } from 'vitest';
import { generateIdeas } from '../../../src/providers/shared/multiIdea';

describe('multiIdea', () => {
  it('generates requested variants with isolated idea records', async () => {
    const ideas = await generateIdeas({
      sessionId: 'session-1',
      providerId: 'deterministic',
      count: 3,
      signal: new AbortController().signal,
      buildInput: {
        prompt: 'Analytics dashboard for product teams',
        artifactType: 'dashboard',
        directionId: 'systems',
        tweaks: {
          density: 'balanced',
          tone: 'contrast',
          motion: 'measured',
          radius: 8,
          showDevice: false,
        },
      },
    });

    expect(ideas).toHaveLength(3);
    expect(ideas.every((idea) => idea.status === 'ready')).toBe(true);
    expect(new Set(ideas.map((idea) => idea.id)).size).toBe(3);
  });

  it('returns no jobs when aborted before generation starts', async () => {
    const controller = new AbortController();
    controller.abort();

    const ideas = await generateIdeas({
      sessionId: 'session-1',
      providerId: 'deterministic',
      count: 3,
      signal: controller.signal,
      buildInput: {
        prompt: 'Analytics dashboard for product teams',
        artifactType: 'dashboard',
        directionId: 'systems',
        tweaks: {
          density: 'balanced',
          tone: 'contrast',
          motion: 'measured',
          radius: 8,
          showDevice: false,
        },
      },
    });

    expect(ideas).toEqual([]);
  });
});
