import { describe, expect, it } from 'vitest';
import { buildDesignProject, defaultTweaks } from '../../../src/engine/index';
import { buildExportBundle } from '../../../src/export/buildExportBundle';

describe('buildExportBundle', () => {
  it('writes a schema-versioned designme.json manifest', () => {
    const input = {
      prompt: 'Dashboard para un CRM de ventas B2B con pipeline, riesgos y siguientes acciones.',
      artifactType: 'dashboard' as const,
      directionId: 'systems' as const,
      tweaks: defaultTweaks,
    };
    const output = buildDesignProject(input);
    const bundle = buildExportBundle({
      output,
      input,
      createdAt: '2026-05-17T00:00:00.000Z',
    });

    const designmeJson = JSON.parse(bundle.files['designme.json']);

    expect(designmeJson).toMatchObject({
      schemaVersion: 1,
      version: '0.2.0',
      createdAt: '2026-05-17T00:00:00.000Z',
      artifactType: 'dashboard',
      directionId: 'systems',
    });
    expect(designmeJson).toEqual(bundle.manifest);
  });
});
