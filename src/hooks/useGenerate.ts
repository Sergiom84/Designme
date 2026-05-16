import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildDesignProject, type BuildInput, type DesignOutput } from '../engine/index';
import {
  getProvider,
  type GenerateEvent,
  type ProviderId,
} from '../providers';

interface UseGenerateOptions {
  providerId: ProviderId;
}

interface UseGenerateResult {
  output: DesignOutput;
  events: GenerateEvent[];
  running: boolean;
  stop(): void;
}

function eventOutput(event: GenerateEvent, fallback: DesignOutput): DesignOutput {
  if (event.type !== 'final') return fallback;
  return event.output ?? { ...fallback, html: event.html };
}

export function useGenerate(input: BuildInput, { providerId }: UseGenerateOptions): UseGenerateResult {
  const fallbackOutput = useMemo(() => buildDesignProject(input), [input]);
  const [output, setOutput] = useState<DesignOutput>(fallbackOutput);
  const [events, setEvents] = useState<GenerateEvent[]>([]);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRunning(false);
  }, []);

  useEffect(() => {
    const provider = getProvider(providerId);
    const controller = new AbortController();
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    abortRef.current?.abort();
    abortRef.current = controller;

    const start = window.setTimeout(
      () => {
        setEvents([]);
        setRunning(true);

        void (async () => {
          try {
            for await (const event of provider.generate({ ...input, signal: controller.signal })) {
              if (controller.signal.aborted || runIdRef.current !== runId) return;
              setEvents((current) => [...current, event]);
              if (event.type === 'final') {
                setOutput(eventOutput(event, fallbackOutput));
              }
            }
          } catch (error) {
            if (!controller.signal.aborted) {
              const message = error instanceof Error ? error.message : 'Error desconocido';
              setEvents((current) => [...current, { type: 'error', message }]);
            }
          } finally {
            if (runIdRef.current === runId) {
              setRunning(false);
              abortRef.current = null;
            }
          }
        })();
      },
      providerId === 'deterministic' ? 250 : 0,
    );

    return () => {
      window.clearTimeout(start);
      controller.abort();
    };
  }, [fallbackOutput, input, providerId]);

  return { output, events, running, stop };
}
