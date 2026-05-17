/// <reference types="vite/client" />

interface DesignmeExportResult {
  filePath: string;
  directory: string;
}

interface DesignmeExportBundlePayload {
  name: string;
  files: {
    'index.html': string;
    'styles.css': string;
    'script.js': string;
    'designme.json': string;
    'handoff.md': string;
    'README.md': string;
  };
}

type DesignmeProviderId = 'deterministic' | 'local-openai' | 'claude-code' | 'codex';
type DesignmeProviderStatus = 'idle' | 'checking' | 'ready' | 'error';

interface DesignmeProviderStartPayload {
  providerId: DesignmeProviderId;
  prompt: string;
  artifactType: string;
  directionId: string;
  tweaks: Record<string, unknown>;
  brief?: Record<string, unknown>;
  intent?: Record<string, unknown>;
}

interface DesignmeProviderStatusResult {
  providerId: DesignmeProviderId;
  status: DesignmeProviderStatus;
  version?: string;
  detail?: string;
}

interface DesignmeLocalSetupProvider {
  id: Extract<DesignmeProviderId, 'claude-code' | 'codex'>;
  label: string;
  detected: boolean;
  ready: boolean;
  configFound: boolean;
  cliFound: boolean;
  authFound?: boolean;
  version?: string;
  detail?: string;
}

interface DesignmeLocalOpenAISetup {
  id: 'ollama';
  label: string;
  detected: boolean;
  ready: boolean;
  configFound: boolean;
  baseUrl: string;
  model?: string;
  detail?: string;
}

interface DesignmeLocalSetupDetection {
  generatedAt?: string;
  providers: DesignmeLocalSetupProvider[];
  localOpenAI: DesignmeLocalOpenAISetup;
}

type DesignmeProviderEvent =
  | { runId: string; type: 'started' }
  | { runId: string; type: 'token'; text: string }
  | { runId: string; type: 'tool-call'; name: string; args?: unknown }
  | { runId: string; type: 'tool-result'; name: string; result?: unknown }
  | { runId: string; type: 'final'; html: string; output?: unknown; notes?: string }
  | { runId: string; type: 'error'; message: string }
  | { runId: string; type: 'stopped' };

interface Window {
  designme?: {
    exportBundle(payload: DesignmeExportBundlePayload): Promise<DesignmeExportResult>;
    exportHtml(payload: { name: string; html: string }): Promise<DesignmeExportResult>;
    openExports(): Promise<{ directory: string }>;
    copyText(text: string): Promise<void>;
    providerStart(payload: DesignmeProviderStartPayload): Promise<{ runId: string }>;
    providerStop(payload: { runId: string }): Promise<{ stopped: boolean }>;
    providerStatus(payload: { providerId: DesignmeProviderId }): Promise<DesignmeProviderStatusResult>;
    detectLocalSetup(): Promise<DesignmeLocalSetupDetection>;
    onProviderEvent(listener: (event: DesignmeProviderEvent) => void): () => void;
  };
}
