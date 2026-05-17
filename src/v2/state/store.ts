import { create } from 'zustand';
import { getActiveProviderId, type ProviderId } from '../../providers';
import { DEFAULT_DRAFT, type ChatTurn, type Idea, type ThemeMode, type V2State, type WorkspaceSnapshot } from './types';

const THEME_STORAGE_KEY = 'designme:theme';

function createId(prefix: string): string {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now().toString(36);
  return `${prefix}-${id}`;
}

function readTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

function writeTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export const useV2Store = create<V2State>((set) => ({
  theme: readTheme(),
  project: {
    id: createId('project'),
    title: 'Designme workspace',
    draft: DEFAULT_DRAFT,
    designMd: '# Design baton\n\n- Objetivo: generar variantes comparables.\n- Tono: claro, visual, exportable.\n',
  },
  activeProviderId: getActiveProviderId(),
  providerStatuses: {},
  chatTurns: [
    {
      id: createId('turn'),
      role: 'system',
      text: 'Nuevo rediseño activo: chat, variantes, inspector y workspace en una sola mesa.',
      ts: new Date().toISOString(),
    },
  ],
  ideas: [],
  compareIdeaIds: [],
  runState: 'idle',
  statusText: 'Listo',
  setTheme(theme) {
    writeTheme(theme);
    set({ theme });
  },
  patchDraft(patch) {
    set((state) => ({
      project: {
        ...state.project,
        draft: {
          ...state.project.draft,
          ...patch,
          tweaks: patch.tweaks ? { ...state.project.draft.tweaks, ...patch.tweaks } : state.project.draft.tweaks,
        },
      },
    }));
  },
  setDesignMd(value) {
    set((state) => ({ project: { ...state.project, designMd: value } }));
  },
  setProvider(providerId: ProviderId) {
    set({ activeProviderId: providerId });
  },
  setProviderStatus(providerId, status) {
    set((state) => ({
      providerStatuses: {
        ...state.providerStatuses,
        [providerId]: status,
      },
    }));
  },
  addTurn(turn: ChatTurn) {
    set((state) => ({ chatTurns: [...state.chatTurns, turn] }));
  },
  setTurns(turns) {
    set({ chatTurns: turns });
  },
  upsertIdea(idea: Idea) {
    set((state) => {
      const ideas = state.ideas.some((item) => item.id === idea.id)
        ? state.ideas.map((item) => (item.id === idea.id ? idea : item))
        : [idea, ...state.ideas].slice(0, 12);
      return { ideas, activeIdeaId: state.activeIdeaId ?? idea.id };
    });
  },
  setIdeas(ideas) {
    set({ ideas: ideas.slice(0, 12) });
  },
  setActiveIdea(id) {
    set({ activeIdeaId: id });
  },
  toggleCompareIdea(id) {
    set((state) => {
      const exists = state.compareIdeaIds.includes(id);
      const compareIdeaIds = exists
        ? state.compareIdeaIds.filter((item) => item !== id)
        : [...state.compareIdeaIds, id].slice(-2);
      return { compareIdeaIds };
    });
  },
  setWorkspace(workspace?: WorkspaceSnapshot) {
    set({ workspace });
  },
  setRunState(runState, statusText) {
    set((state) => ({ runState, statusText: statusText ?? state.statusText }));
  },
}));

export function createChatTurn(role: ChatTurn['role'], text: string, extra: Partial<ChatTurn> = {}): ChatTurn {
  return {
    id: createId('turn'),
    role,
    text,
    ts: new Date().toISOString(),
    ...extra,
  } as ChatTurn;
}

export function createIdeaDraft(input: {
  sessionId: string;
  variantIndex: number;
  title: string;
  providerId: ProviderId;
  promptDigest: string;
}): Idea {
  return {
    id: createId('idea'),
    createdAt: new Date().toISOString(),
    status: 'pending',
    ...input,
  };
}
