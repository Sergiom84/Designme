import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { contentSecurityPolicy } = require('../../../electron/security.cjs') as {
  contentSecurityPolicy(isDev: boolean, opts?: { allowLocalProvider?: boolean }): string;
};

function connectSrc(csp: string): string {
  const directive = csp.split('; ').find((part) => part.startsWith('connect-src '));
  if (!directive) {
    throw new Error(`Missing connect-src in CSP: ${csp}`);
  }
  return directive;
}

describe('contentSecurityPolicy', () => {
  it('keeps local provider hosts out of production CSP by default', () => {
    const directive = connectSrc(contentSecurityPolicy(false));

    expect(directive).toBe("connect-src 'self'");
    expect(directive).not.toContain('http://127.0.0.1:*');
    expect(directive).not.toContain('http://localhost:*');
  });

  it('keeps the dev CSP unchanged by default', () => {
    const directive = connectSrc(contentSecurityPolicy(true));

    expect(directive).toBe("connect-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173");
    expect(directive).not.toContain('http://localhost:*');
  });

  it('allows local provider hosts only when explicitly enabled', () => {
    const directive = connectSrc(contentSecurityPolicy(false, { allowLocalProvider: true }));

    expect(directive).toBe("connect-src 'self' http://127.0.0.1:* http://localhost:*");
  });
});
