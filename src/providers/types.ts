import type {
  ArtifactType,
  DerivedBrief,
  DesignOutput,
  DesignTweaks,
  DirectionId,
  UXIntent,
} from '../engine/index';
import type { WorkspaceSnapshot } from '../v2/state/types';

export type ProviderId =
  | 'deterministic'
  | 'local-openai'
  | 'anthropic-api'
  | 'openai-api'
  | 'claude-code-cli'
  | 'codex-cli';

export type ProviderStatus = 'idle' | 'checking' | 'ready' | 'error';

export interface ProviderCapabilities {
  ask: boolean;
  multiIdea: boolean;
  streaming: boolean;
  toolCalls: boolean;
}

export interface GenerateRequest {
  prompt: string;
  artifactType: ArtifactType;
  directionId: DirectionId;
  tweaks: DesignTweaks;
  brief?: DerivedBrief;
  intent?: UXIntent;
  workspace?: WorkspaceSnapshot;
  signal: AbortSignal;
}

export type GenerateEvent =
  | { type: 'token'; text: string }
  | { type: 'tool-call'; name: string; args: unknown }
  | { type: 'tool-result'; name: string; result: unknown }
  | { type: 'final'; html: string; output?: DesignOutput; notes?: string }
  | { type: 'error'; message: string };

export interface AskRequest {
  prompt: string;
  workspace?: WorkspaceSnapshot;
  signal: AbortSignal;
}

export interface AskResponse {
  questions: Array<{
    id: string;
    text: string;
    kind: 'single' | 'multi' | 'text';
    options?: string[];
  }>;
}

export interface Provider {
  id: ProviderId;
  label: string;
  capabilities: ProviderCapabilities;
  status(): Promise<ProviderStatus>;
  generate(req: GenerateRequest): AsyncIterable<GenerateEvent>;
  ask?(req: AskRequest): Promise<AskResponse>;
}
