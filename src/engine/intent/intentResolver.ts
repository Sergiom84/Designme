import type { ArtifactType, DerivedBrief } from '../types';
import {
  detectDomain,
  detectGoal,
  mentalModelForDomain,
  riskNotesForDomain,
} from './domainRules';
import { planModules } from './modulePlanner';
import { primaryActionFor, secondaryActionFor } from './copyPlanner';
import type { ScreenState, UXIntent } from './types';

function requiredStatesFor(artifactType: ArtifactType): ScreenState[] {
  if (artifactType === 'web' || artifactType === 'infographic') return ['default', 'success'];
  if (artifactType === 'deck') return ['default', 'review'];
  return ['default', 'empty', 'loading', 'error', 'review'];
}

export function resolveIntent(brief: DerivedBrief, artifactType: ArtifactType): UXIntent {
  const domain = detectDomain(brief.rawPrompt);
  const goal = detectGoal(brief.rawPrompt, brief.objective);
  return {
    domain,
    goal,
    primaryAction: primaryActionFor(goal, artifactType),
    secondaryAction: secondaryActionFor(domain),
    userMentalModel: mentalModelForDomain(domain),
    modules: planModules(domain, goal, artifactType),
    requiredStates: requiredStatesFor(artifactType),
    riskNotes: riskNotesForDomain(domain),
  };
}

export function applyIntentToBrief(brief: DerivedBrief, intent: UXIntent): DerivedBrief {
  const featureSet = new Set([
    ...intent.modules.map((module) => module.label),
    ...brief.features,
  ]);
  return {
    ...brief,
    features: Array.from(featureSet).slice(0, 8),
  };
}
