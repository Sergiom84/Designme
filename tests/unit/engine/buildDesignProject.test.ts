import { describe, expect, it } from 'vitest';
import {
  artifactOptions,
  buildDesignProject,
  designDirections,
  defaultTweaks,
  type ArtifactType,
  type BuildInput,
  type DirectionId,
} from '../../../src/engine';
import { escapeHtml, slugify } from '../../../src/engine/utils';

const crmPrompt = 'Dashboard para un CRM de ventas B2B con pipeline, riesgos, deals bloqueados y siguientes acciones.';

function build(overrides: Partial<BuildInput> = {}) {
  return buildDesignProject({
    prompt: crmPrompt,
    artifactType: 'dashboard',
    directionId: 'systems',
    tweaks: defaultTweaks,
    ...overrides,
  });
}

describe('buildDesignProject', () => {
  it('returns the core design artifacts needed by the app and export flow', () => {
    const output = build();

    expect(output.name).toBeTruthy();
    expect(output.exportName).toMatch(/^[a-z0-9_-]+$/);
    expect(output.html).toMatch(/^<!doctype html>/);
    expect(output.html).toContain('data-ux-domain="crm"');
    expect(output.handoffPrompt).toContain(output.name);
    expect(output.critique.total).toBeGreaterThanOrEqual(0);
    expect(output.critique.scores.length).toBeGreaterThan(0);
  });

  it.each(artifactOptions.map((option) => option.id))('generates non-empty standalone HTML for %s artifacts', (artifactType) => {
    const output = build({ artifactType: artifactType as ArtifactType });

    expect(output.html).toContain('<html');
    expect(output.html).toContain('<body');
    expect(output.html.length).toBeGreaterThan(3_000);
    expect(output.handoffPrompt.length).toBeGreaterThan(500);
  });

  it.each(
    artifactOptions.flatMap((artifact) =>
      designDirections.map((direction) => ({
        artifactType: artifact.id,
        directionId: direction.id,
      })),
    ),
  )('generates non-empty HTML for $artifactType artifacts in $directionId direction', ({ artifactType, directionId }) => {
    const output = build({
      artifactType: artifactType as ArtifactType,
      directionId: directionId as DirectionId,
    });

    expect(output.html).toMatch(/^<!doctype html>/);
    expect(output.html).toContain('<main');
    expect(output.html.length).toBeGreaterThan(3_000);
  });

  it('keeps CRM intent and modules available after prompt parsing', () => {
    const output = build();

    expect(output.intent.domain).toBe('crm');
    expect(output.intent.modules.map((module) => module.label)).toEqual(
      expect.arrayContaining(['Pipeline por etapa', 'Deals bloqueados']),
    );
    expect(output.features).toEqual(expect.arrayContaining(['Pipeline por etapa', 'Deals bloqueados']));
  });

  it('surfaces deterministic critique issues for generic generated copy', () => {
    const output = build();

    expect(output.critique.issues.map((issue) => issue.id)).toContain('copy-generic-phrases');
  });
});

describe('engine utils', () => {
  it('escapes basic HTML injection characters', () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;',
    );
  });

  it('slugifies export names into filesystem-safe lowercase names', () => {
    expect(slugify('Señal CRM: Deals bloqueados / Q2')).toBe('senal-crm-deals-bloqueados-q2');
  });
});
