import { deriveBrief } from './brief';
import { buildAssumptions, buildCritique } from './critique';
import { buildHandoffPrompt } from './handoff';
import { applyIntentToBrief, resolveIntent } from './intent';
import { directionById } from './options';
import { buildHtml } from './render/htmlDocument';
import type { BuildInput, DesignOutput } from './types';
import { slugify } from './utils';

export * from './options';
export * from './types';
export * from './intent';

export function buildDesignProject(input: BuildInput): DesignOutput {
  const direction = directionById(input.directionId);
  const brief = deriveBrief(input.prompt, input.artifactType);
  const intent = resolveIntent(brief, input.artifactType);
  const enrichedBrief = applyIntentToBrief(brief, intent);
  const html = buildHtml(enrichedBrief, input.artifactType, direction, input.tweaks, intent);
  const critique = buildCritique(enrichedBrief, input.artifactType, direction, input.tweaks, intent, html);
  return {
    name: enrichedBrief.name,
    exportName: slugify(`${enrichedBrief.name}-${input.artifactType}`),
    briefSummary: `${enrichedBrief.objective} para ${enrichedBrief.audience}.`,
    brief: {
      rawPrompt: enrichedBrief.rawPrompt,
      topic: enrichedBrief.topic,
      audience: enrichedBrief.audience,
      objective: enrichedBrief.objective,
    },
    assumptions: buildAssumptions(enrichedBrief, direction, intent),
    sections: enrichedBrief.sections,
    features: enrichedBrief.features,
    html,
    handoffPrompt: buildHandoffPrompt(enrichedBrief, input.artifactType, direction, input.tweaks, intent),
    critique,
    direction,
    intent,
  };
}
