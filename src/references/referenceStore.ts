import type { StoredReferenceState } from './types';

export const emptyReferenceState: StoredReferenceState = {
  notes: '',
};

export function parseReferenceState(value: string): StoredReferenceState {
  try {
    const parsed = JSON.parse(value) as Partial<StoredReferenceState>;
    return {
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      lastAppliedAt: typeof parsed.lastAppliedAt === 'string' ? parsed.lastAppliedAt : undefined,
    };
  } catch {
    return emptyReferenceState;
  }
}
