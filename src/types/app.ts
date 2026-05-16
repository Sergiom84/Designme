import type { LucideIcon } from 'lucide-react';
import type { ArtifactType, DesignTweaks, DirectionId } from '../engine';

export type PreviewMode = 'desktop' | 'tablet' | 'mobile';
export type PreviewZoom = 'fit' | '50' | '75' | '100';
export type SideTab = 'directions' | 'tweaks' | 'critique' | 'handoff';

export interface VersionSnapshot {
  id: string;
  at: string;
  name: string;
  prompt: string;
  artifactType: ArtifactType;
  directionId: DirectionId;
  tweaks: DesignTweaks;
}

export interface SideTabOption {
  id: SideTab;
  label: string;
  icon: LucideIcon;
}
