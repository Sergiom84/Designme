import { analyzeDesignOutput } from '../quality';
import { domainLabels, goalLabels } from './intent/domainRules';
import type { UXIntent } from './intent/types';
import type { ArtifactType, Critique, DerivedBrief, DesignDirection, DesignTweaks } from './types';

export function buildCritique(
  brief: DerivedBrief,
  artifactType: ArtifactType,
  direction: DesignDirection,
  tweaks: DesignTweaks,
  intent: UXIntent,
  html: string,
): Critique {
  return analyzeDesignOutput({ html, brief, artifactType, direction, tweaks, intent });
}

export function buildAssumptions(
  brief: DerivedBrief,
  direction: DesignDirection,
  intent: UXIntent,
): string[] {
  return [
    `Audiencia: ${brief.audience}.`,
    `Objetivo: ${brief.objective}.`,
    `Intención: ${domainLabels[intent.domain]} / ${goalLabels[intent.goal]}.`,
    `Acción primaria: ${intent.primaryAction}.`,
    `Dirección: ${direction.name}, porque encaja con ${direction.bestFor.toLowerCase()}.`,
    'No requiere API key; esta pasada es determinista y local.',
  ];
}
