import type { LucideIcon } from 'lucide-react';
import type { ArtifactType, BuildInput, DesignOutput, DesignTweaks, DirectionId } from '../engine/index';
import type { ChatTurn, Idea } from '../v2/state/types';

export type PreviewMode = 'desktop' | 'tablet' | 'mobile';
export type PreviewZoom = 'fit' | '50' | '75' | '100';
export type SideTab = 'directions' | 'tweaks' | 'references' | 'critique' | 'handoff';

export interface VersionSnapshot {
  id: string;
  at: string;
  name: string;
  prompt: string;
  artifactType: ArtifactType;
  directionId: DirectionId;
  tweaks: DesignTweaks;
  output?: DesignOutput;
}

export interface DesignSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  draft: BuildInput;
  output?: DesignOutput;
  chatTurns: ChatTurn[];
  ideas: Idea[];
  snapshots: VersionSnapshot[];
}

export interface RecentSessionItem {
  id: string;
  name: string;
  updatedAt: string;
  artifactType: ArtifactType;
  prompt: string;
}

export interface SideTabOption {
  id: SideTab;
  label: string;
  icon: LucideIcon;
}
