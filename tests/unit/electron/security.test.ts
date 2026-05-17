import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { contentSecurityPolicy, shouldAllowRequest } = require('../../../electron/security.cjs') as {
  contentSecurityPolicy(isDev: boolean): string;
  shouldAllowRequest(
    url: string,
    state: { allowLocalProvider?: boolean } | undefined,
    isDev: boolean,
  ): boolean;
};

function connectSrc(csp: string): string {
  const directive = csp.split('; ').find((part) => part.startsWith('connect-src '));
  if (!directive) {
    throw new Error(`Missing connect-src in CSP: ${csp}`);
  }
  return directive;
}

describe('contentSecurityPolicy', () => {
  it('keeps the document-level connect-src wide enough for the local-openai gate', () => {
    // The document CSP cannot be updated after load, so it lists the local
    // hosts statically; the runtime network gate decides whether each request
    // is actually allowed.
    const prod = connectSrc(contentSecurityPolicy(false));
    expect(prod).toBe("connect-src 'self' http://127.0.0.1:* http://localhost:*");

    const dev = connectSrc(contentSecurityPolicy(true));
    expect(dev).toContain("'self'");
    expect(dev).toContain('http://127.0.0.1:5173');
    expect(dev).toContain('ws://127.0.0.1:5173');
    expect(dev).toContain('http://127.0.0.1:*');
    expect(dev).toContain('http://localhost:*');
  });
});

describe('shouldAllowRequest', () => {
  it('always allows requests to non-local hosts', () => {
    expect(shouldAllowRequest('https://example.com/api', { allowLocalProvider: false }, false)).toBe(true);
    expect(shouldAllowRequest('https://example.com/api', undefined, false)).toBe(true);
  });

  it('always allows the Vite dev server even when the local provider is gated', () => {
    expect(shouldAllowRequest('http://127.0.0.1:5173/index.html', { allowLocalProvider: false }, true)).toBe(true);
    expect(shouldAllowRequest('ws://127.0.0.1:5173/hmr', { allowLocalProvider: false }, true)).toBe(true);
  });

  it('blocks other 127.0.0.1 and localhost ports when allowLocalProvider is false', () => {
    expect(shouldAllowRequest('http://127.0.0.1:11434/v1/models', { allowLocalProvider: false }, false)).toBe(false);
    expect(shouldAllowRequest('http://localhost:1234/v1/chat/completions', undefined, false)).toBe(false);
    // In dev, only 5173 is exempt; other local ports must still respect the gate.
    expect(shouldAllowRequest('http://127.0.0.1:11434/v1/models', { allowLocalProvider: false }, true)).toBe(false);
  });

  it('lets every local host through once allowLocalProvider is true', () => {
    expect(shouldAllowRequest('http://127.0.0.1:11434/v1/models', { allowLocalProvider: true }, false)).toBe(true);
    expect(shouldAllowRequest('http://localhost:1234/v1/chat/completions', { allowLocalProvider: true }, false)).toBe(
      true,
    );
  });
});
