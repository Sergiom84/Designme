import { describe, expect, it } from 'vitest';
import { buildDesignProject, defaultTweaks } from '../../../src/engine/index';
import { createManifest } from '../../../src/export/createManifest';
import { analyzeReferenceNotes } from '../../../src/references';

describe('createManifest', () => {
  it('captures prompt, visual direction, intent and quality metadata', () => {
    const input = {
      prompt: 'Dashboard para un CRM de ventas B2B con pipeline, riesgos y siguientes acciones.',
      artifactType: 'dashboard' as const,
      directionId: 'systems' as const,
      tweaks: defaultTweaks,
    };
    const output = buildDesignProject(input);
    const manifest = createManifest({
      output,
      input,
      createdAt: '2026-05-16T00:00:00.000Z',
    });

    expect(manifest).toMatchObject({
      schemaVersion: 1,
      version: '0.2.0',
      createdAt: '2026-05-16T00:00:00.000Z',
      artifactType: 'dashboard',
      directionId: 'systems',
      themeId: 'systems',
      intent: {
        domain: 'crm',
      },
    });
    expect(manifest.brief.prompt).toBe(input.prompt);
    expect(manifest.brief.sections.length).toBeGreaterThan(0);
    expect(manifest.quality.total).toBe(output.critique.total);
    expect(manifest.quality.issues).toEqual(output.critique.issues);
  });

  it('stores reference and optional AI metadata without embedding raw assets', () => {
    const input = {
      prompt: 'Dashboard para un CRM de ventas B2B con pipeline.',
      artifactType: 'dashboard' as const,
      directionId: 'systems' as const,
      tweaks: defaultTweaks,
      references: analyzeReferenceNotes('Referencia: dashboard denso con alto contraste.'),
      ai: {
        providerId: 'local',
        used: true,
        localOnly: true,
      },
    };
    const output = buildDesignProject(input);
    const manifest = createManifest({ output, input, createdAt: '2026-05-17T00:00:00.000Z' });

    expect(manifest.references).toMatchObject({
      used: true,
      count: 1,
      keywords: expect.arrayContaining(['sistemas', 'contraste']),
    });
    expect(manifest.ai).toEqual({ providerId: 'local', used: true, localOnly: true });
    expect(JSON.stringify(manifest.references)).not.toContain('data:image');
  });
});
