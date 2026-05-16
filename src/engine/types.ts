import type { ThemeId } from '../design-system/tokens/types';
import type { UXIntent } from './intent/types';

export type ArtifactType = 'web' | 'software' | 'dashboard' | 'mobile' | 'deck' | 'infographic';
export type DirectionId = 'systems' | 'editorial' | 'kinetic';
export type Density = 'calm' | 'balanced' | 'dense';
export type Motion = 'still' | 'measured' | 'expressive';
export type Tone = 'light' | 'contrast' | 'ink';

export interface ArtifactOption {
  id: ArtifactType;
  label: string;
  hint: string;
}

export interface DesignDirection {
  id: DirectionId;
  name: string;
  school: string;
  promise: string;
  bestFor: string;
  themeId: ThemeId;
}

export interface DesignTweaks {
  density: Density;
  tone: Tone;
  motion: Motion;
  radius: number;
  showDevice: boolean;
}

export interface BuildInput {
  prompt: string;
  artifactType: ArtifactType;
  directionId: DirectionId;
  tweaks: DesignTweaks;
}

export interface Critique {
  total: number;
  scores: Array<{ label: string; value: number }>;
  keep: string[];
  fix: string[];
  quickWins: string[];
}

export interface DesignOutput {
  name: string;
  exportName: string;
  briefSummary: string;
  assumptions: string[];
  sections: string[];
  features: string[];
  html: string;
  handoffPrompt: string;
  critique: Critique;
  direction: DesignDirection;
  intent: UXIntent;
}

export interface DerivedBrief {
  rawPrompt: string;
  name: string;
  topic: string;
  audience: string;
  objective: string;
  sections: string[];
  features: string[];
}
