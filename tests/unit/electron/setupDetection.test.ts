import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { detectLocalSetup, firstModelName } = require('../../../electron/setupDetection.cjs') as {
  detectLocalSetup(options?: Record<string, unknown>): Promise<Record<string, unknown>>;
  firstModelName(value: unknown): string | undefined;
};

function accessFor(paths: string[]) {
  return vi.fn((filePath: string) =>
    paths.includes(filePath) ? Promise.resolve() : Promise.reject(new Error('missing')),
  );
}

describe('local setup detection', () => {
  it('extracts the first Ollama model name from /api/tags payloads', () => {
    expect(firstModelName({ models: [{ name: 'llama3.2:latest' }] })).toBe('llama3.2:latest');
    expect(firstModelName({ models: [{ name: '' }, { name: 'qwen2.5:7b' }] })).toBe('qwen2.5:7b');
    expect(firstModelName({})).toBeUndefined();
  });

  it('detects Claude, Codex, and Ollama signals without returning secrets', async () => {
    const homeDir = 'C:\\Users\\sergi';
    const claudeConfigPath = path.join(homeDir, '.claude', 'config.json');
    const codexAuthPath = path.join(homeDir, '.codex', 'auth.json');
    const ollamaConfigPath = path.join(homeDir, '.config', 'ollama');
    const detection = await detectLocalSetup({
      homeDir,
      access: accessFor([claudeConfigPath, codexAuthPath, ollamaConfigPath]),
      detectClaudeCode: vi.fn(async () => ({
        available: true,
        version: 'claude 1.2.3',
        status: 'Logged in',
      })),
      detectCodex: vi.fn(async () => ({
        available: true,
        version: 'codex 0.91.0',
        status: 'Logged in',
      })),
      fetch: vi.fn(async () => ({
        ok: true,
        json: async () => ({ models: [{ name: 'llama3.2:latest' }] }),
      })),
    });

    expect(detection).toMatchObject({
      providers: [
        {
          id: 'claude-code-cli',
          detected: true,
          ready: true,
          configFound: true,
          cliFound: true,
          version: 'claude 1.2.3',
        },
        {
          id: 'codex-cli',
          detected: true,
          ready: true,
          configFound: true,
          cliFound: true,
          authFound: true,
          version: 'codex 0.91.0',
        },
      ],
      localOpenAI: {
        id: 'ollama',
        detected: true,
        ready: true,
        baseUrl: 'http://127.0.0.1:11434/v1',
        model: 'llama3.2:latest',
      },
    });
    expect(JSON.stringify(detection)).not.toContain('auth.json');
    expect(JSON.stringify(detection)).not.toContain('config.json');
  });

  it('reports unavailable setups when configs, CLIs, and endpoints are absent', async () => {
    const detection = await detectLocalSetup({
      homeDir: 'C:\\Users\\sergi',
      access: accessFor([]),
      detectClaudeCode: vi.fn(async () => ({ available: false, error: 'not found' })),
      detectCodex: vi.fn(async () => ({ available: false, error: 'not found' })),
      fetch: vi.fn(async () => {
        throw new Error('connection refused');
      }),
    });

    expect(detection).toMatchObject({
      providers: [
        { id: 'claude-code-cli', detected: false, ready: false },
        { id: 'codex-cli', detected: false, ready: false },
      ],
      localOpenAI: { id: 'ollama', detected: false, ready: false },
    });
  });
});
