import { describe, expect, it } from 'vitest';
import { defaultTweaks } from '../../../src/engine/index';
import { analyzeReferenceNotes, buildReferenceContext, referenceFromNotes } from '../../../src/references';

describe('style references', () => {
  it('turns local notes into deterministic preferences', () => {
    const analysis = analyzeReferenceNotes('Dashboard CRM denso, sobrio, con alto contraste y tablas enterprise.');

    expect(analysis.summary).toContain('Referencia detectada');
    expect(analysis.keywords).toEqual(expect.arrayContaining(['sistemas', 'contraste', 'enterprise']));
    expect(analysis.preferences.directionId).toBe('systems');
    expect(analysis.preferences.tweaksPatch).toMatchObject({
      density: 'balanced',
      tone: 'contrast',
      motion: 'measured',
    });
  });

  it('does not mutate default tweaks when deriving patches', () => {
    const before = { ...defaultTweaks };
    const analysis = analyzeReferenceNotes('Interfaz minimal, limpia, redondeada y sin movimiento.');

    expect(analysis.preferences.tweaksPatch).toMatchObject({ density: 'calm', motion: 'still', radius: 10 });
    expect(defaultTweaks).toEqual(before);
  });

  it('builds safe prompt context without a reference when notes are blank', () => {
    expect(referenceFromNotes('   ')).toBeUndefined();
    expect(buildReferenceContext(analyzeReferenceNotes(''))).toBe('');
  });
});
