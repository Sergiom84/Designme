import type { ArtifactType, Critique, DesignDirection, DesignOutput, DesignTweaks, DirectionId } from '../engine/index';
import type { UXIntent } from '../engine/intent/types';
import type { ReferenceAnalysis } from '../references';

export interface ExportBuildInput {
  prompt: string;
  artifactType: ArtifactType;
  directionId: DirectionId;
  tweaks: DesignTweaks;
  references?: ReferenceAnalysis;
  ai?: {
    providerId: string;
    used: boolean;
    localOnly: boolean;
  };
}

export interface ExportManifest {
  schemaVersion: 1;
  version: string;
  createdAt: string;
  name: string;
  artifactType: ArtifactType;
  directionId: DirectionId;
  themeId: DesignDirection['themeId'];
  tweaks: DesignTweaks;
  brief: {
    prompt: string;
    summary: string;
    audience: string;
    objective: string;
    sections: string[];
    features: string[];
  };
  intent: UXIntent;
  quality: Pick<Critique, 'total' | 'scores' | 'issues'>;
  references?: {
    used: boolean;
    count: number;
    summary: string;
    keywords: string[];
    preferences: ReferenceAnalysis['preferences'];
  };
  ai?: {
    providerId: string;
    used: boolean;
    localOnly: boolean;
  };
}

export interface ExportBundleFileMap {
  'index.html': string;
  'styles.css': string;
  'script.js': string;
  'designme.json': string;
  'handoff.md': string;
  'README.md': string;
}

export interface ExportBundle {
  name: string;
  manifest: ExportManifest;
  files: ExportBundleFileMap;
}

export interface ExportBundleBuildInput {
  output: DesignOutput;
  input: ExportBuildInput;
  createdAt?: string;
}
