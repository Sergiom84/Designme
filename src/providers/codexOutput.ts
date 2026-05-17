import codexPromptTemplate from './prompts/codex.md?raw';
import type { GenerateRequest } from './types';

export interface CodexPromptOptions {
  designTokens?: unknown;
}

type CodexPromptPayload = Omit<GenerateRequest, 'signal'> & {
  designTokens?: unknown;
};

function toPromptPayload(req: GenerateRequest, options: CodexPromptOptions = {}): CodexPromptPayload {
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

export function buildCodexPrompt(req: GenerateRequest, options: CodexPromptOptions = {}): string {
  const payload = JSON.stringify(toPromptPayload(req, options), null, 2);
  return codexPromptTemplate.replace('{{REQUEST_JSON}}', payload);
}

function extractStandaloneDocument(text: string): string | null {
  const rawDocument = text.match(/<!doctype\s+html[\s\S]*?<\/html>/i);
  return rawDocument?.[0]?.trim() ?? null;
}

export function extractHtmlFromCodexOutput(text: string): string | null {
  const htmlFence = text.match(/```html\s*([\s\S]*?)```/i);
  if (htmlFence?.[1]) {
    return extractStandaloneDocument(htmlFence[1]);
  }

  return extractStandaloneDocument(text);
}
