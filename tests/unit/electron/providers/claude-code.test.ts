import { PassThrough } from 'node:stream';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { detectClaudeCode, normalizeClaudeEvent, startClaudeCodeRun } =
  require('../../../../electron/providers/claude-code.cjs') as {
    detectClaudeCode(options?: Record<string, unknown>): Promise<Record<string, unknown>>;
    normalizeClaudeEvent(event: unknown): Array<Record<string, unknown>>;
    startClaudeCodeRun(
      request: { prompt: string; signal?: AbortSignal },
      callbacks?: Record<string, unknown>,
      options?: Record<string, unknown>,
    ): { args: string[]; child: FakeChild; done: Promise<Record<string, unknown>>; stop: () => void };
  };

class FakeChild extends EventEmitter {
  stdin = new PassThrough();
  stdout = new PassThrough();
  stderr = new PassThrough();
  killed = false;
  kill = vi.fn((signal = 'SIGTERM') => {
    this.killed = true;
    queueMicrotask(() => this.emit('close', null, signal));
    return true;
  });
}

describe('electron Claude Code provider', () => {
  it('detects claude with where on Windows and reads --version', async () => {
    const spawn = vi.fn((command: string, args: string[]) => {
      const child = new FakeChild();
      queueMicrotask(() => {
        if (command === 'where' && args[0] === 'claude') {
          child.stdout.end('C:\\Tools\\claude.exe\r\n');
        } else {
          child.stdout.end('claude 1.2.3\n');
        }
        child.stderr.end();
        child.emit('close', 0, null);
      });
      return child;
    });

    await expect(detectClaudeCode({ platform: 'win32', spawn })).resolves.toMatchObject({
      available: true,
      command: 'C:\\Tools\\claude.exe',
      version: 'claude 1.2.3',
    });
    expect(spawn).toHaveBeenNthCalledWith(
      1,
      'where',
      ['claude'],
      expect.objectContaining({ shell: false, stdio: ['ignore', 'pipe', 'pipe'] }),
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      'C:\\Tools\\claude.exe',
      ['--version'],
      expect.objectContaining({ shell: false }),
    );
  });

  it('returns unavailable when detection fails', async () => {
    const spawn = vi.fn(() => {
      const child = new FakeChild();
      queueMicrotask(() => {
        child.stderr.end('not found\n');
        child.emit('close', 1, null);
      });
      return child;
    });

    await expect(detectClaudeCode({ platform: 'linux', spawn })).resolves.toMatchObject({
      available: false,
      command: 'claude',
    });
  });

  it('normalizes assistant text, tool_use, tool_result, and result events', () => {
    expect(
      normalizeClaudeEvent({
        type: 'assistant',
        message: {
          content: [
            { type: 'text', text: 'hello' },
            { type: 'tool_use', id: 'toolu_1', name: 'Read', input: { file: 'a.ts' } },
          ],
        },
      }),
    ).toMatchObject([
      { type: 'token', text: 'hello' },
      { type: 'tool-call', name: 'Read', args: { file: 'a.ts' } },
    ]);

    expect(
      normalizeClaudeEvent({
        type: 'user',
        message: { content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: 'ok' }] },
      }),
    ).toMatchObject([{ type: 'tool-result', name: 'toolu_1', result: 'ok' }]);

    expect(normalizeClaudeEvent({ type: 'result', result: '<html></html>' })).toMatchObject([
      { type: 'final', text: '<html></html>' },
    ]);
  });

  it('starts claude in print mode with safe flags, writes the prompt to stdin, and maps callbacks', async () => {
    const stdout = [
      JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'Hi' }] } }),
      JSON.stringify({
        type: 'assistant',
        message: { content: [{ type: 'tool_use', name: 'Write', input: { file: 'index.html' } }] },
      }),
      JSON.stringify({ type: 'result', result: '<html>Hi</html>' }),
      '',
    ].join('\n');
    let stdin = '';
    const spawn = vi.fn((_command: string, _args: string[]) => {
      const child = new FakeChild();
      child.stdin.on('data', (chunk) => {
        stdin += chunk.toString();
      });
      queueMicrotask(() => {
        child.stdout.end(stdout);
        child.stderr.end();
        child.emit('close', 0, null);
      });
      return child;
    });
    const events: Array<Record<string, unknown>> = [];
    const rawEvents: Array<Record<string, unknown>> = [];
    const tokens: string[] = [];
    const toolCalls: Array<Record<string, unknown>> = [];
    const finals: Array<Record<string, unknown>> = [];
    const exits: Array<Record<string, unknown>> = [];

    const run = startClaudeCodeRun(
      { prompt: 'Build a page' },
      {
        onEvent: (event: Record<string, unknown>) => events.push(event),
        onRaw: (event: Record<string, unknown>) => rawEvents.push(event),
        onToken: (text: string) => tokens.push(text),
        onToolCall: (event: Record<string, unknown>) => toolCalls.push(event),
        onFinal: (event: Record<string, unknown>) => finals.push(event),
        onExit: (event: Record<string, unknown>) => exits.push(event),
      },
      { spawn, command: 'claude' },
    );

    await expect(run.done).resolves.toMatchObject({ code: 0, finalText: '<html>Hi</html>' });
    expect(run.args).toEqual([
      '-p',
      '--output-format',
      'stream-json',
      '--input-format',
      'text',
      '--permission-mode',
      'bypassPermissions',
      '--disallowedTools',
      'Bash',
      'Edit',
      'MultiEdit',
      'NotebookEdit',
      'Write',
      'WebFetch',
      'WebSearch',
    ]);
    expect(run.args).not.toContain('Build a page');
    expect(spawn).toHaveBeenCalledWith(
      'claude',
      [
        '-p',
        '--output-format',
        'stream-json',
        '--input-format',
        'text',
        '--permission-mode',
        'bypassPermissions',
        '--disallowedTools',
        'Bash',
        'Edit',
        'MultiEdit',
        'NotebookEdit',
        'Write',
        'WebFetch',
        'WebSearch',
      ],
      expect.objectContaining({ shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }),
    );
    expect(stdin).toBe('Build a page');
    expect(tokens).toEqual(['Hi']);
    expect(toolCalls).toMatchObject([{ type: 'tool-call', name: 'Write', args: { file: 'index.html' } }]);
    expect(finals).toMatchObject([{ type: 'final', text: '<html>Hi</html>' }]);
    expect(rawEvents).toHaveLength(3);
    expect(exits).toMatchObject([{ code: 0, signal: null }]);
    expect(events).toMatchObject([
      { type: 'token', text: 'Hi' },
      { type: 'tool-call', name: 'Write', args: { file: 'index.html' } },
      { type: 'final', text: '<html>Hi</html>' },
    ]);
  });

  it('kills the child with SIGTERM when stopped', async () => {
    const child = new FakeChild();
    const spawn = vi.fn(() => child);
    const run = startClaudeCodeRun({ prompt: 'Build a page' }, {}, { spawn });

    run.stop();

    await expect(run.done).resolves.toMatchObject({ signal: 'SIGTERM' });
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('kills the child with SIGTERM when the request is aborted', async () => {
    const child = new FakeChild();
    const spawn = vi.fn(() => child);
    const controller = new AbortController();
    const run = startClaudeCodeRun({ prompt: 'Build a page', signal: controller.signal }, {}, { spawn });

    controller.abort();

    await expect(run.done).resolves.toMatchObject({ signal: 'SIGTERM' });
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
  });
});
