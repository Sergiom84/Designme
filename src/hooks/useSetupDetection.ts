import { useCallback, useState } from 'react';

interface UseSetupDetectionResult {
  detection: DesignmeLocalSetupDetection | undefined;
  checking: boolean;
  dismissed: boolean;
  dismiss(): void;
  refresh(options?: { markChecking?: boolean }): Promise<void>;
}

/**
 * Encapsulates the desktop "detect local CLIs and Ollama" flow that the
 * provider hint banner consumes. Keeps the App component free of detection
 * loading state and exposes a stable `refresh()` that the picker buttons can
 * call to re-poll after the user installs a CLI or starts Ollama.
 */
export function useSetupDetection(): UseSetupDetectionResult {
  const [detection, setDetection] = useState<DesignmeLocalSetupDetection | undefined>();
  const [checking, setChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const refresh = useCallback(async (options: { markChecking?: boolean } = {}) => {
    if (!window.designme?.detectLocalSetup) return;
    if (options.markChecking ?? true) {
      setChecking(true);
    }
    try {
      const next = await window.designme.detectLocalSetup();
      setDetection(next);
      setDismissed(false);
    } catch {
      setDetection(undefined);
    } finally {
      setChecking(false);
    }
  }, []);

  const dismiss = useCallback(() => setDismissed(true), []);

  return { detection, checking, dismissed, dismiss, refresh };
}
