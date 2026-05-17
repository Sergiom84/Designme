import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { extractStandaloneHtmlDocument } = require('../../../../electron/providers/htmlExtraction.cjs') as {
  extractStandaloneHtmlDocument(text: unknown): string | null;
};

describe('extractStandaloneHtmlDocument (electron)', () => {
  it('returns null when no document envelope is found', () => {
    expect(extractStandaloneHtmlDocument('')).toBeNull();
    expect(extractStandaloneHtmlDocument('Just prose, no HTML.')).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(extractStandaloneHtmlDocument(undefined as any)).toBeNull();
  });

  it('extracts the document from a single fenced block', () => {
    const text = '```html\n<!doctype html><html><body>Hi</body></html>\n```';
    expect(extractStandaloneHtmlDocument(text)).toBe('<!doctype html><html><body>Hi</body></html>');
  });

  it('rejects truncated documents missing structural tags', () => {
    const truncated = '<!doctype html><html><head></head></html>';
    expect(extractStandaloneHtmlDocument(truncated)).toBeNull();
  });

  it('picks the longest valid document across multiple fenced blocks', () => {
    const text = [
      '```html',
      '<!doctype html><html><body>Draft</body></html>',
      '```',
      '```html',
      '<!doctype html><html><head><title>Final</title></head><body><main>Long final document here</main></body></html>',
      '```',
    ].join('\n');

    const result = extractStandaloneHtmlDocument(text);
    expect(result).toContain('Long final document here');
    expect(result).not.toContain('Draft</body>');
  });
});
