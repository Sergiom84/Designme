import { localPromptEnhancer } from './providers/local';
import type { OptionalAIProvider, PromptEnhancementInput, PromptEnhancementResult } from './types';

export async function enhancePrompt(
  input: PromptEnhancementInput,
  provider: OptionalAIProvider = localPromptEnhancer,
): Promise<PromptEnhancementResult> {
  return provider.enhancePrompt(input);
}
