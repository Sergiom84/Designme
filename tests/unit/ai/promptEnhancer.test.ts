import { describe, expect, it } from 'vitest';
import { enhancePrompt, localPromptEnhancer } from '../../../src/ai';
import { analyzeReferenceNotes } from '../../../src/references';

describe('local prompt enhancer', () => {
  it('enhances prompts locally from reference analysis', async () => {
    const result = await enhancePrompt({
      prompt: 'Dashboard para un CRM de ventas.',
      referenceAnalysis: analyzeReferenceNotes('Backoffice denso con alto contraste y foco en responsables.'),
    });

    expect(result.disclosure).toContain('sin llamadas externas');
    expect(result.applied.length).toBeGreaterThan(0);
    expect(result.prompt).toContain('Dirección de referencia');
    expect(result.prompt).toContain('Dashboard para un CRM de ventas.');
  });

  it('falls back without changing the prompt when no hints are available', async () => {
    const result = await localPromptEnhancer.enhancePrompt({
      prompt: 'Web para producto nuevo.',
      referenceAnalysis: analyzeReferenceNotes('   '),
    });

    expect(result.applied).toEqual([]);
    expect(result.prompt).toBe('Web para producto nuevo.');
  });
});
