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
    `Audience: ${brief.audience}.`,
    `Goal: ${brief.objective}.`,
    `Intent: ${domainLabels[intent.domain]} / ${goalLabels[intent.goal]}.`,
    `Primary action: ${intent.primaryAction}.`,
    `Direction: ${direction.name}, because it fits ${direction.bestFor.toLowerCase()}.`,
    'No API key is required; this pass is deterministic and local.',
  ];
}
