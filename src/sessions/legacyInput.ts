import { defaultTweaks, type ArtifactType, type BuildInput, type DesignTweaks, type DirectionId } from '../engine/index';
import type { VersionSnapshot } from '../types/app';

export const LEGACY_INITIAL_PROMPT =
  'Crea un diseñador de apps, software y webs local-first: prompt a prototipo, con variaciones visuales, tweaks, crítica y export HTML.';

export const LEGACY_PROMPT_PRESETS = [
  'Dashboard para un CRM de ventas B2B con pipeline, riesgos y siguientes acciones.',
  'App móvil de hábitos para fundadores ocupados, con foco diario y progreso semanal.',
  'Web de producto para una herramienta de IA que convierte reuniones en tareas verificables.',
  'Deck de lanzamiento para explicar una plataforma local-first de diseño con agentes.',
];

export function parseArtifactType(value: string): ArtifactType {
  return ['software', 'web', 'dashboard', 'mobile', 'deck', 'infographic'].includes(value)
    ? (value as ArtifactType)
    : 'software';
}

export function parseDirectionId(value: string): DirectionId {
  return ['systems', 'editorial', 'kinetic'].includes(value) ? (value as DirectionId) : 'systems';
}

export function parseTweaks(value: string): DesignTweaks {
  try {
    return { ...defaultTweaks, ...(JSON.parse(value) as Partial<DesignTweaks>) };
  } catch {
    return defaultTweaks;
  }
}

export function parseVersions(value: string): VersionSnapshot[] {
  try {
    const parsed = JSON.parse(value) as VersionSnapshot[];
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function readLocalStorageValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Reconstructs the pre-session-collection `BuildInput` from the legacy
 * `designme.*` localStorage keys so users who upgrade from 0.1 keep their last
 * prompt/artifact/direction/tweaks instead of getting reset to defaults.
 */
export function readLegacyInput(): BuildInput {
  return {
    prompt: readLocalStorageValue('designme.prompt') ?? LEGACY_INITIAL_PROMPT,
    artifactType: parseArtifactType(readLocalStorageValue('designme.artifactType') ?? 'software'),
    directionId: parseDirectionId(readLocalStorageValue('designme.directionId') ?? 'systems'),
    tweaks: parseTweaks(readLocalStorageValue('designme.tweaks') ?? ''),
  };
}

export function readLegacyVersions(): VersionSnapshot[] {
  const stored = readLocalStorageValue('designme.versions');
  return stored ? parseVersions(stored) : [];
}
