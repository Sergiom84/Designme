import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import { PassThrough } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const {
  detectCodex,
  normalizeCodexEvent,
  pickCodexCommand,
  startCodexRun,
} = require('../../../../electron/providers/codex.cjs') as {
  detectCodex(options?: Record<string, unknown>): Promise<Record<string, unknown>>;
  normalizeCodexEvent(event: unknown): Array<Record<string, unknown>>;
  pickCodexCommand(stdout: string): string;
  startCodexRun(
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
  stdinText = '';
  kill = vi.fn((signal = 'SIGTERM') => {
    this.killed = true;
    queueMicrotask(() => this.emit('close', null, signal));
    return true;
  });

  constructor() {
    super();
    this.stdin.on('data', (chunk) => {
      this.stdinText += String(chunk);
    });
  }
}

function spawnSuccess(stdout: string) {
  return vi.fn((_command: string, _args: string[]) => {
    const child = new FakeChild();
    queueMicrotask(() => {
      child.stdout.end(stdout);
      child.stderr.end();
      child.emit('close', 0, null);
    });
    return child;
  });
}

describe('electron Codex provider', () => {
  it('prefers the Windows exe candidate from where.exe output', () => {
    expect(
      pickCodexCommand(
        [
          'C:\\Users\\sergi\\AppData\\Roaming\\npm\\codex.cmd',
          'C:\\Program Files\\WindowsApps\\OpenAI.Codex\\codex.exe',
        ].join('\n'),
      ),
    ).toBe('C:\\Program Files\\WindowsApps\\OpenAI.Codex\\codex.exe');
  });

  it('detects codex with where.exe on Windows and reads --version', async () => {
    const spawn = vi.fn((command: string, args: string[]) => {
      const child = new FakeChild();
      queueMicrotask(() => {
        if (command === 'where.exe' && args[0] === 'codex') {
          child.stdout.end('C:\\Tools\\codex.exe\r\n');
        } else {
          child.stdout.end('codex-cli 0.91.0\n');
        }
        child.stderr.end();
        child.emit('close', 0, null);
      });
      return child;
    });

    await expect(detectCodex({ platform: 'win32', spawn })).resolves.toMatchObject({
      available: true,
      command: 'C:\\Tools\\codex.exe',
      version: 'codex-cli 0.91.0',
    });
    expect(spawn).toHaveBeenNthCalledWith(
      1,
      'where.exe',
      ['codex'],
      expect.objectContaining({ shell: false, stdio: ['ignore', 'pipe', 'pipe'] }),
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      'C:\\Tools\\codex.exe',
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

    await expect(detectCodex({ platform: 'linux', spawn })).resolves.toMatchObject({
      available: false,
      command: 'codex',
    });
  });

  it('normalizes token, tool call, tool result, and final events', () => {
    expect(normalizeCodexEvent({ type: 'agent_message_delta', delta: 'hello' })).toMatchObject([
      { type: 'token', text: 'hello' },
    ]);

    expect(
      normalizeCodexEvent({
        type: 'item.started',
        item: { type: 'function_call', name: 'Read', arguments: { file: 'a.ts' } },
      }),
    ).toMatchObject([{ type: 'tool-call', name: 'Read', args: { file: 'a.ts' } }]);

    expect(
      normalizeCodexEvent({
        type: 'item.completed',
        item: { type: 'function_call_output', call_id: 'call_1', output: 'ok' },
      }),
    ).toMatchObject([{ type: 'tool-result', name: 'call_1', result: 'ok' }]);

    expect(normalizeCodexEvent({ type: 'result', result: '<html></html>' })).toMatchObject([
      { type: 'final', text: '<html></html>' },
    ]);
  });

  it('starts codex exec with JSONL output, read-only sandbox, and prompt over stdin', async () => {
    const stdout = [
      JSON.stringify({ type: 'agent_message_delta', delta: '<!doctype html><html>' }),
      JSON.stringify({ type: 'agent_message_delta', delta: '<body>Hi</body></html>' }),
      '',
    ].join('\n');
    const spawn = spawnSuccess(stdout);
    const events: Array<Record<string, unknown>> = [];

    const run = startCodexRun(
      { prompt: 'Build a page' },
      { onEvent: (event: Record<string, unknown>) => events.push(event) },
      { spawn, command: 'codex-cli', cwd: 'C:\\tmp\\designme-codex' },
    );

    await expect(run.done).resolves.toMatchObject({
      code: 0,
      finalText: '<!doctype html><html><body>Hi</body></html>',
    });
    expect(run.args).toEqual([
      '--ask-for-approval',
      'never',
      'exec',
      '--json',
      '--sandbox',
      'read-only',
      '--skip-git-repo-check',
      '-C',
      'C:\\tmp\\designme-codex',
      '-',
    ]);
    expect(spawn).toHaveBeenCalledWith(
      'codex-cli',
      run.args,
      expect.objectContaining({ shell: false, stdio: ['pipe', 'pipe', 'pipe'] }),
    );
    expect(run.child.stdinText).toBe('Build a page');
    expect(events).toMatchObject([
      { type: 'token', text: '<!doctype html><html>' },
      { type: 'token', text: '<body>Hi</body></html>' },
    ]);
  });

  it('kills the child with SIGTERM when stopped', async () => {
    const child = new FakeChild();
    const spawn = vi.fn(() => child);
    const run = startCodexRun({ prompt: 'Build a page' }, {}, { spawn });

    run.stop();

    await expect(run.done).resolves.toMatchObject({ signal: 'SIGTERM' });
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
  });
});
