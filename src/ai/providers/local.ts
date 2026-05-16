import type { OptionalAIProvider, PromptEnhancementInput, PromptEnhancementResult } from '../types';

function appendReferenceHints(input: PromptEnhancementInput): PromptEnhancementResult {
  const { prompt } = input;
  const hints = input.referenceAnalysis?.preferences.promptHints ?? [];
  const notes = input.referenceAnalysis?.preferences.visualNotes ?? [];
  const riskNotes = input.referenceAnalysis?.preferences.riskNotes ?? [];
  const additions = [
    hints.length > 0 ? `Dirección de referencia: ${hints.join('; ')}.` : '',
    notes.length > 0 ? `Notas visuales: ${notes.join(' ')}` : '',
    riskNotes.length > 0 ? `Riesgos a revisar: ${riskNotes.join(' ')}` : '',
  ].filter(Boolean);

  if (additions.length === 0) {
    return {
      prompt,
      applied: [],
      disclosure: 'Proveedor local: no se detectaron pistas suficientes para mejorar el brief.',
    };
  }

  return {
    prompt: `${prompt.trim()}\n\n${additions.join('\n')}`,
    applied: additions,
    disclosure: 'Proveedor local: mejora determinista sin llamadas externas.',
  };
}

export const localPromptEnhancer: OptionalAIProvider = {
  id: 'local',
  label: 'Mejora local determinista',
  localOnly: true,
  capabilities: ['prompt-enhancement'],
  enhancePrompt: appendReferenceHints,
};
