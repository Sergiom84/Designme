import type { ReferenceAnalysis } from '../references';

export type AICapability = 'prompt-enhancement';

export interface PromptEnhancementInput {
  prompt: string;
  referenceAnalysis?: ReferenceAnalysis;
}

export interface PromptEnhancementResult {
  prompt: string;
  applied: string[];
  disclosure: string;
}

export interface OptionalAIProvider {
  id: string;
  label: string;
  localOnly: boolean;
  capabilities: AICapability[];
  enhancePrompt(input: PromptEnhancementInput): Promise<PromptEnhancementResult> | PromptEnhancementResult;
}
