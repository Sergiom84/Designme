import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildDesignProject,
  rebuildDesignOutputWithHtml,
  type BuildInput,
  type DesignOutput,
} from '../engine/index';
import { getProvider, type GenerateEvent, type ProviderId } from '../providers';
// Import the constant from the leaf module rather than the barrel so test
// suites that mock `../providers` still see the real retry-signal string.
import { INVALID_HTML_ERROR_MESSAGE } from '../providers/htmlExtraction';

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

const HTML_RETRY_HINT =
  '\n\nLa respuesta anterior no era un documento HTML válido. Devuelve EXCLUSIVAMENTE un único documento HTML standalone que comience por <!doctype html> y termine en </html>. Sin texto adicional ni bloques markdown.';

function eventOutput(event: GenerateEvent, fallback: DesignOutput, input: BuildInput): DesignOutput {
  if (event.type !== 'final') return fallback;
  // Provider already returned a fully-built DesignOutput (deterministic case).
  if (event.output) return event.output;
  // External provider returned HTML only — re-run the engine's quality pass on
  // the real HTML so the critique panel reflects the actual artifact instead of
  // the deterministic fallback HTML.
  return rebuildDesignOutputWithHtml(input, event.html);
}

function isInvalidHtmlError(event: GenerateEvent): boolean {
  return event.type === 'error' && event.message === INVALID_HTML_ERROR_MESSAGE;
}

export function useGenerate(
  input: BuildInput,
  { providerId, initialOutput, resetKey, autoGenerate = true, runKey = 0, onFinalOutput }: UseGenerateOptions,
): UseGenerateResult {
  // Only rebuild the deterministic fallback when we actually need it:
  //  - active provider is deterministic (it is the source of truth), or
  //  - no initialOutput is cached for the current session yet.
  // Otherwise reuse the cached output and skip the full engine pass on every
  // keystroke when the user is generating via an external LLM provider.
  const needsFallback = providerId === 'deterministic' || !initialOutput;
  const fallbackOutput = useMemo(
    () => (needsFallback ? buildDesignProject(input) : (initialOutput as DesignOutput)),
    [input, initialOutput, needsFallback],
  );
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

    // External LLM providers occasionally return prose or partial HTML instead
    // of a standalone document on the first try. When the provider emits the
    // shared INVALID_HTML_ERROR_MESSAGE we retry exactly once with a stricter
    // format hint appended to the prompt. The deterministic provider never
    // needs this because it always produces valid HTML.
    async function runProvider(currentInput: BuildInput, attempt: number): Promise<boolean> {
      let sawInvalidHtmlError = false;
      try {
        for await (const event of provider.generate({ ...currentInput, signal: controller.signal })) {
          if (controller.signal.aborted || runIdRef.current !== runId) return false;
          const isRetryError = providerId !== 'deterministic' && attempt === 0 && isInvalidHtmlError(event);
          if (isRetryError) {
            sawInvalidHtmlError = true;
            // Skip emitting the first-attempt error: a retry is incoming.
            continue;
          }
          setEvents((current) => [...current, event]);
          if (event.type === 'final') {
            const nextOutput = eventOutput(event, fallbackOutput, currentInput);
            setOutput(nextOutput);
            onFinalOutput?.(nextOutput);
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = error instanceof Error ? error.message : 'Error desconocido';
          setEvents((current) => [...current, { type: 'error', message }]);
        }
        return false;
      }
      return sawInvalidHtmlError;
    }

    const start = window.setTimeout(
      () => {
        setGeneratedInputKey(inputKey);
        setEvents([]);
        setOutput(initialOutputRef.current ?? fallbackOutput);
        setRunning(true);

        void (async () => {
          try {
            const shouldRetry = await runProvider(input, 0);
            if (shouldRetry && !controller.signal.aborted && runIdRef.current === runId) {
              const retryInput: BuildInput = { ...input, prompt: `${input.prompt}${HTML_RETRY_HINT}` };
              await runProvider(retryInput, 1);
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
