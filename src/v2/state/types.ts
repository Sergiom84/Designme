import type { ArtifactType, BuildInput, DesignOutput, DesignTweaks, DirectionId } from '../../engine';
import type { ProviderId } from '../../providers';

export type ThemeMode = 'dark' | 'light';
export type RunState = 'idle' | 'asking' | 'generating' | 'ready' | 'error';

export interface ProviderCapabilities {
  ask: boolean;
  multiIdea: boolean;
  streaming: boolean;
  toolCalls: boolean;
}

export interface Question {
  id: string;
  text: string;
  kind: 'single' | 'multi' | 'text';
  options?: string[];
}

export type Attachment =
  | { kind: 'file'; path: string; size: number; mime?: string }
  | { kind: 'folder'; path: string; fileCount: number; bytes: number }
  | { kind: 'image'; dataUrl: string };

export interface ToolCall {
  id: string;
  name: string;
  args?: unknown;
  result?: unknown;
}

export type ChatTurn =
  | {
      id: string;
      role: 'user';
      text: string;
      attachments?: Attachment[];
      ts: string;
    }
  | {
      id: string;
      role: 'assistant';
      text: string;
      toolCalls?: ToolCall[];
      askQuestions?: Question[];
      ideas?: string[];
      ts: string;
    }
  | {
      id: string;
      role: 'system';
      text: string;
      ts: string;
    };

export interface IdeaComment {
  id: string;
  x: number;
  y: number;
  note: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Idea {
  id: string;
  sessionId: string;
  variantIndex: number;
  title: string;
  html?: string;
  designOutput?: DesignOutput;
  thumbnail?: string;
  status: 'pending' | 'streaming' | 'ready' | 'error';
  error?: string;
  createdAt: string;
  providerId: ProviderId;
  promptDigest: string;
  comments?: IdeaComment[];
}

export interface WorkspaceFile {
  path: string;
  size: number;
  mime?: string;
  sha1?: string;
}

export interface WorkspaceAnalysis {
  framework: 'next' | 'vite-react' | 'sveltekit' | 'unknown';
  styling: 'tailwind' | 'css-modules' | 'styled-components' | 'plain';
  designSystemFound: boolean;
  tokens?: { colors: Record<string, string>; fonts: string[] };
  componentCount: number;
  topComponents: string[];
  hasDesignMd: boolean;
}

export interface WorkspaceSnapshot {
  rootPath?: string;
  files: WorkspaceFile[];
  stats: {
    fileCount: number;
    bytes: number;
    capped?: boolean;
  };
  analysis?: WorkspaceAnalysis;
  summary?: string;
}

export interface ProjectState {
  id: string;
  title: string;
  draft: BuildInput;
  designMd: string;
}

export interface V2State {
  theme: ThemeMode;
  project: ProjectState;
  activeProviderId: ProviderId;
  providerStatuses: Partial<Record<ProviderId, 'idle' | 'checking' | 'ready' | 'error'>>;
  chatTurns: ChatTurn[];
  ideas: Idea[];
  activeIdeaId?: string;
  compareIdeaIds: string[];
  workspace?: WorkspaceSnapshot;
  runState: RunState;
  statusText: string;
  setTheme(theme: ThemeMode): void;
  patchDraft(patch: Partial<Omit<BuildInput, 'tweaks'>> & { tweaks?: Partial<DesignTweaks> }): void;
  setDesignMd(value: string): void;
  setProvider(providerId: ProviderId): void;
  setProviderStatus(providerId: ProviderId, status: 'idle' | 'checking' | 'ready' | 'error'): void;
  addTurn(turn: ChatTurn): void;
  setTurns(turns: ChatTurn[]): void;
  upsertIdea(idea: Idea): void;
  setIdeas(ideas: Idea[]): void;
  setActiveIdea(id?: string): void;
  toggleCompareIdea(id: string): void;
  setWorkspace(workspace?: WorkspaceSnapshot): void;
  setRunState(state: RunState, statusText?: string): void;
}

export const DEFAULT_DRAFT: BuildInput = {
  prompt: 'Dashboard SaaS para equipos de producto con métricas, roadmap y señales de calidad.',
  artifactType: 'dashboard' as ArtifactType,
  directionId: 'systems' as DirectionId,
  tweaks: {
    density: 'balanced',
    tone: 'contrast',
    motion: 'measured',
    radius: 10,
    showDevice: false,
  },
};
