import { describe, expect, it } from 'vitest';
import {
  INVALID_HTML_ERROR_MESSAGE,
  extractStandaloneHtmlDocument,
} from '../../../src/providers/htmlExtraction';

describe('extractStandaloneHtmlDocument', () => {
  it('returns an empty string when no doctype envelope is present', () => {
    expect(extractStandaloneHtmlDocument('Sure, here is some plain text.')).toBe('');
    expect(extractStandaloneHtmlDocument('')).toBe('');
  });

  it('extracts the document from a single fenced ```html block', () => {
    const text = '```html\n<!doctype html><html><body>Hi</body></html>\n```';
    expect(extractStandaloneHtmlDocument(text)).toBe('<!doctype html><html><body>Hi</body></html>');
  });

  it('falls back to scanning raw text when no fence is provided', () => {
    const text = 'Here is the output:\n<!doctype html><html><body>Hi</body></html>';
    expect(extractStandaloneHtmlDocument(text)).toBe('<!doctype html><html><body>Hi</body></html>');
  });

  it('picks the longest valid document when multiple ```html blocks are returned', () => {
    const text = [
      'First sketch:',
      '```html',
      '<!doctype html><html><body>Draft</body></html>',
      '```',
      'Final version with full markup:',
      '```html',
      '<!doctype html><html><head><title>Final</title></head><body><main>Detailed final document</main></body></html>',
      '```',
    ].join('\n');

    expect(extractStandaloneHtmlDocument(text)).toContain('Detailed final document');
    expect(extractStandaloneHtmlDocument(text)).not.toContain('Draft</body>');
  });

  it('rejects truncated documents that lack required structural tags', () => {
    const truncated = '<!doctype html><html><head><title>oops</title></head></html>';
    expect(extractStandaloneHtmlDocument(truncated)).toBe('');
  });

  it('exposes the shared invalid-HTML error message constant', () => {
    expect(INVALID_HTML_ERROR_MESSAGE).toMatch(/standalone HTML document/i);
  });
});
