import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildDesignProject, type BuildInput, type DesignOutput } from '../engine/index';
import { getProvider, type GenerateEvent, type ProviderId } from '../providers';

interface UseGenerateOptions {
  providerId: ProviderId;
  initialOutput?: DesignOutput;
  resetKey?: string;
  autoGenerate?: boolean;
  runKey?: number;
  onFinalOutput?(output: DesignOutput): void;
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

export function useGenerate(
  input: BuildInput,
  { providerId, initialOutput, resetKey, autoGenerate = true, runKey = 0, onFinalOutput }: UseGenerateOptions,
): UseGenerateResult {
  const fallbackOutput = useMemo(() => buildDesignProject(input), [input]);
  const inputKey = useMemo(() => JSON.stringify({ input, resetKey }), [input, resetKey]);
  const [output, setOutput] = useState<DesignOutput>(() => initialOutput ?? fallbackOutput);
  const [events, setEvents] = useState<GenerateEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [generatedInputKey, setGeneratedInputKey] = useState(autoGenerate ? inputKey : '');
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const manualRunKeyRef = useRef(0);
  const initialOutputRef = useRef<DesignOutput | undefined>(initialOutput);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRunning(false);
  }, []);

  useEffect(() => {
    initialOutputRef.current = initialOutput;
  }, [initialOutput, resetKey]);

  useEffect(() => {
    if (!autoGenerate) {
      if (runKey <= 0 || manualRunKeyRef.current === runKey) {
        return undefined;
      }
      manualRunKeyRef.current = runKey;
    }

    const provider = getProvider(providerId);
    const controller = new AbortController();
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    abortRef.current?.abort();
    abortRef.current = controller;

    const start = window.setTimeout(
      () => {
        setGeneratedInputKey(inputKey);
        setEvents([]);
        setOutput(initialOutputRef.current ?? fallbackOutput);
        setRunning(true);

        void (async () => {
          try {
            for await (const event of provider.generate({ ...input, signal: controller.signal })) {
              if (controller.signal.aborted || runIdRef.current !== runId) return;
              setEvents((current) => [...current, event]);
              if (event.type === 'final') {
                const nextOutput = eventOutput(event, fallbackOutput);
                setOutput(nextOutput);
                onFinalOutput?.(nextOutput);
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
  }, [autoGenerate, fallbackOutput, input, inputKey, onFinalOutput, providerId, resetKey, runKey]);

  const hasCurrentOutput = autoGenerate || generatedInputKey === inputKey;

  return {
    output: hasCurrentOutput ? output : (initialOutput ?? fallbackOutput),
    events: hasCurrentOutput ? events : [],
    running,
    stop,
  };
}
