import type { ArtifactType, DerivedBrief, DesignDirection, DesignTweaks } from '../engine/types';
import type { UXIntent } from '../engine/intent/types';

export type QualityCategory =
  | 'accessibility'
  | 'contrast'
  | 'hierarchy'
  | 'layout'
  | 'copy'
  | 'interaction'
  | 'export';

export type Severity = 'info' | 'warning' | 'error';

export interface QualityIssue {
  id: string;
  category: QualityCategory;
  severity: Severity;
  title: string;
  detail: string;
  suggestedFix: string;
  selector?: string;
}

export interface QualityScore {
  label: string;
  value: number;
}

export interface QualityReport {
  total: number;
  scores: QualityScore[];
  issues: QualityIssue[];
  keep: string[];
  fix: string[];
  quickWins: string[];
}

export interface QualityContext {
  html: string;
  brief: DerivedBrief;
  artifactType: ArtifactType;
  direction: DesignDirection;
  tweaks: DesignTweaks;
  intent: UXIntent;
}
