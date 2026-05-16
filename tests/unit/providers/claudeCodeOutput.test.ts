import { describe, expect, it } from 'vitest';
import {
  buildClaudeCodePrompt,
  extractHtmlFromClaudeCodeOutput,
} from '../../../src/providers/claudeCodeOutput';
import type { GenerateRequest } from '../../../src/providers';

function makeRequest(): GenerateRequest {
  return {
    prompt: 'Build a dense operations dashboard',
    artifactType: 'dashboard',
    directionId: 'systems',
    tweaks: {
      density: 'dense',
      tone: 'light',
      motion: 'measured',
      radius: 6,
      showDevice: false,
    },
    signal: new AbortController().signal,
  };
}

describe('claudeCodeOutput', () => {
  it('builds the Claude Code prompt with the request payload and design tokens', () => {
    const prompt = buildClaudeCodePrompt(makeRequest(), {
      designTokens: { color: { accent: '#2563eb' } },
    });

    expect(prompt).toContain('Return exactly one complete, standalone HTML document.');
    expect(prompt).toContain('Do not load external scripts');
    expect(prompt).toContain('"prompt": "Build a dense operations dashboard"');
    expect(prompt).toContain('"designTokens": {');
    expect(prompt).toContain('"accent": "#2563eb"');
    expect(prompt).not.toContain('{{REQUEST_JSON}}');
    expect(prompt).not.toContain('"signal"');
  });

  it('extracts HTML from an html fenced block', () => {
    const output = [
      'Here is the artifact:',
      '```html',
      '<!doctype html>',
      '<html><body><main>Ready</main></body></html>',
      '```',
    ].join('\n');

    expect(extractHtmlFromClaudeCodeOutput(output)).toBe(
      '<!doctype html>\n<html><body><main>Ready</main></body></html>',
    );
  });

  it('extracts raw doctype documents from surrounding stream text', () => {
    const output =
      'thinking...\n<!doctype html><html><body><main>Raw</main></body></html>\ndone';

    expect(extractHtmlFromClaudeCodeOutput(output)).toBe(
      '<!doctype html><html><body><main>Raw</main></body></html>',
    );
  });

  it('returns null when no complete standalone document is present', () => {
    expect(extractHtmlFromClaudeCodeOutput('partial <div>not enough</div>')).toBeNull();
    expect(extractHtmlFromClaudeCodeOutput('```html\n<div>Fragment</div>\n```')).toBeNull();
  });
});
