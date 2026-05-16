import type { DesignTweaks, DirectionId } from '../engine/index';

export type ReferenceKind = 'text' | 'visual-notes';

export interface DesignReference {
  id: string;
  kind: ReferenceKind;
  title: string;
  content: string;
  createdAt: string;
}

export interface ReferencePreferences {
  directionId?: DirectionId;
  tweaksPatch: Partial<DesignTweaks>;
  promptHints: string[];
  visualNotes: string[];
  riskNotes: string[];
}

export interface ReferenceAnalysis {
  references: DesignReference[];
  summary: string;
  keywords: string[];
  preferences: ReferencePreferences;
}

export interface StoredReferenceState {
  notes: string;
  lastAppliedAt?: string;
}
