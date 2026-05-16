import type {
  ArtifactType,
  DerivedBrief,
  DesignOutput,
  DesignTweaks,
  DirectionId,
  UXIntent,
} from '../engine/index';

export type ProviderId = 'deterministic' | 'local-openai' | 'claude-code' | 'codex';

export type ProviderStatus = 'idle' | 'checking' | 'ready' | 'error';

export interface GenerateRequest {
  prompt: string;
  artifactType: ArtifactType;
  directionId: DirectionId;
  tweaks: DesignTweaks;
  brief?: DerivedBrief;
  intent?: UXIntent;
  signal: AbortSignal;
}

export type GenerateEvent =
  | { type: 'token'; text: string }
  | { type: 'tool-call'; name: string; args: unknown }
  | { type: 'tool-result'; name: string; result: unknown }
  | { type: 'final'; html: string; output?: DesignOutput; notes?: string }
  | { type: 'error'; message: string };

export interface Provider {
  id: ProviderId;
  label: string;
  status(): Promise<ProviderStatus>;
  generate(req: GenerateRequest): AsyncIterable<GenerateEvent>;
}
