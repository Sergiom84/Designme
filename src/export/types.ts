import type { ArtifactType, Critique, DesignDirection, DesignOutput, DesignTweaks, DirectionId } from '../engine';
import type { UXIntent } from '../engine/intent/types';

export interface ExportBuildInput {
  prompt: string;
  artifactType: ArtifactType;
  directionId: DirectionId;
  tweaks: DesignTweaks;
}

export interface ExportManifest {
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
