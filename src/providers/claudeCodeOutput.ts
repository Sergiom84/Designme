import claudeCodePromptTemplate from './prompts/claude-code.md?raw';
import type { GenerateRequest } from './types';

export interface ClaudeCodePromptOptions {
  designTokens?: unknown;
}

type ClaudeCodePromptPayload = Omit<GenerateRequest, 'signal'> & {
  designTokens?: unknown;
};

function toPromptPayload(
  req: GenerateRequest,
  options: ClaudeCodePromptOptions = {},
): ClaudeCodePromptPayload {
  return {
    prompt: req.prompt,
    artifactType: req.artifactType,
    directionId: req.directionId,
    tweaks: req.tweaks,
    brief: req.brief,
    intent: req.intent,
    ...(options.designTokens === undefined ? {} : { designTokens: options.designTokens }),
  };
}

export function buildClaudeCodePrompt(
  req: GenerateRequest,
  options: ClaudeCodePromptOptions = {},
): string {
  const payload = JSON.stringify(toPromptPayload(req, options), null, 2);
  return claudeCodePromptTemplate.replace('{{REQUEST_JSON}}', payload);
}

function extractStandaloneDocument(text: string): string | null {
  const rawDocument = text.match(/<!doctype\s+html[\s\S]*?<\/html>/i);
  return rawDocument?.[0]?.trim() ?? null;
}

export function extractHtmlFromClaudeCodeOutput(text: string): string | null {
  const htmlFence = text.match(/```html\s*([\s\S]*?)```/i);
  if (htmlFence?.[1]) {
    return extractStandaloneDocument(htmlFence[1]);
  }

  return extractStandaloneDocument(text);
}
