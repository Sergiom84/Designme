import { buildClaudeCodePrompt } from './claudeCodeOutput';
import type { GenerateEvent, GenerateRequest, Provider } from './types';

type QueuedEvent = GenerateEvent | { type: 'stopped' };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asOptionalRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function bridgeEventToGenerateEvent(event: DesignmeProviderEvent): QueuedEvent | undefined {
  if (event.type === 'started') {
    return undefined;
  }

  if (event.type === 'token') {
    return { type: 'token', text: event.text };
  }

  if (event.type === 'tool-call') {
    return { type: 'tool-call', name: event.name, args: event.args ?? {} };
  }

  if (event.type === 'tool-result') {
    return { type: 'tool-result', name: event.name, result: event.result ?? null };
  }

  if (event.type === 'final') {
    return { type: 'final', html: event.html, notes: event.notes };
  }

  if (event.type === 'error') {
    return { type: 'error', message: event.message };
  }

  return { type: 'stopped' };
}

function createEventQueue() {
  const events: QueuedEvent[] = [];
  const waiters: Array<() => void> = [];
  let closed = false;

  return {
    push(event: QueuedEvent) {
      events.push(event);
      waiters.shift()?.();
    },
    close() {
      closed = true;
      waiters.splice(0).forEach((wake) => wake());
    },
    async next(): Promise<QueuedEvent | undefined> {
      while (events.length === 0 && !closed) {
        await new Promise<void>((resolve) => waiters.push(resolve));
      }
      return events.shift();
    },
  };
}

function isTerminalEvent(event: DesignmeProviderEvent): boolean {
  return event.type === 'final' || event.type === 'error' || event.type === 'stopped';
}

async function* generate(req: GenerateRequest): AsyncIterable<GenerateEvent> {
  if (!window.designme?.providerStart || !window.designme?.onProviderEvent || !window.designme?.providerStop) {
    yield { type: 'error', message: 'Claude Code está disponible solo en la app de escritorio.' };
    return;
  }

  const queue = createEventQueue();
  const pendingEvents = new Map<string, DesignmeProviderEvent[]>();
  let runId = '';

  function enqueueBridgeEvent(event: DesignmeProviderEvent) {
    const queuedEvent = bridgeEventToGenerateEvent(event);
    if (queuedEvent) {
      queue.push(queuedEvent);
    }
    if (isTerminalEvent(event)) {
      queue.close();
    }
  }

  const unsubscribe = window.designme.onProviderEvent((event) => {
    if (!runId) {
      pendingEvents.set(event.runId, [...(pendingEvents.get(event.runId) ?? []), event]);
      return;
    }

    if (event.runId === runId) {
      enqueueBridgeEvent(event);
    }
  });

  try {
    const response = await window.designme.providerStart({
      providerId: 'claude-code',
      prompt: buildClaudeCodePrompt(req),
      artifactType: req.artifactType,
      directionId: req.directionId,
      tweaks: asRecord(req.tweaks),
      brief: asOptionalRecord(req.brief),
      intent: asOptionalRecord(req.intent),
    });
    runId = response.runId;
    for (const event of pendingEvents.get(runId) ?? []) {
      enqueueBridgeEvent(event);
    }
    pendingEvents.clear();

    const stop = () => {
      if (runId) {
        void window.designme?.providerStop?.({ runId });
      }
      queue.close();
    };

    if (req.signal.aborted) {
      stop();
    } else {
      req.signal.addEventListener('abort', stop, { once: true });
    }

    while (!req.signal.aborted) {
      const event = await queue.next();
      if (!event) break;
      if (event.type === 'stopped') break;
      yield event;
      if (event.type === 'final' || event.type === 'error') break;
    }
  } catch (error) {
    if (!req.signal.aborted) {
      yield { type: 'error', message: error instanceof Error ? error.message : 'Claude Code provider failed.' };
    }
  } finally {
    unsubscribe();
  }
}

export const claudeCodeProvider: Provider = {
  id: 'claude-code',
  label: 'Claude Code',
  async status() {
    if (!window.designme?.providerStatus) {
      return 'error';
    }

    try {
      const result = await window.designme.providerStatus({ providerId: 'claude-code' });
      return result.status;
    } catch {
      return 'error';
    }
  },
  generate,
};
