import { describe, expect, it } from 'vitest';
import { buildCodexPrompt, extractHtmlFromCodexOutput } from '../../../src/providers/codexOutput';
import type { GenerateRequest } from '../../../src/providers/types';

function makeRequest(): GenerateRequest {
  return {
    prompt: 'Build a launch dashboard',
    artifactType: 'dashboard',
    directionId: 'systems',
    tweaks: {
      density: 'balanced',
      motion: 'measured',
      radius: 6,
      showDevice: true,
      tone: 'light',
    },
    signal: new AbortController().signal,
  };
}

describe('codex output helpers', () => {
  it('builds the Codex prompt with the request payload', () => {
    const prompt = buildCodexPrompt(makeRequest(), { designTokens: { color: 'oklch(60% 0.1 200)' } });

    expect(prompt).toContain('You are Codex generating UI artifacts');
    expect(prompt).toContain('"prompt": "Build a launch dashboard"');
    expect(prompt).toContain('"designTokens"');
  });

  it('extracts standalone HTML from fenced or raw Codex output', () => {
    const html = '<!doctype html><html><head><title>x</title></head><body></body></html>';

    expect(extractHtmlFromCodexOutput(`before\n\`\`\`html\n${html}\n\`\`\``)).toBe(html);
    expect(extractHtmlFromCodexOutput(`notes\n${html}\nmore`)).toBe(html);
    expect(extractHtmlFromCodexOutput('<div>no document</div>')).toBeNull();
  });
});
