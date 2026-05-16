import { deriveBrief } from './brief';
import { buildAssumptions, buildCritique } from './critique';
import { buildHandoffPrompt } from './handoff';
import { directionById } from './options';
import { buildHtml } from './render/htmlDocument';
import type { BuildInput, DesignOutput } from './types';
import { slugify } from './utils';

export * from './options';
export * from './types';

export function buildDesignProject(input: BuildInput): DesignOutput {
  const direction = directionById(input.directionId);
  const brief = deriveBrief(input.prompt, input.artifactType);
  const html = buildHtml(brief, input.artifactType, direction, input.tweaks);
  const critique = buildCritique(brief, direction, input.tweaks);
  return {
    name: brief.name,
    exportName: slugify(`${brief.name}-${input.artifactType}`),
    briefSummary: `${brief.objective} for ${brief.audience}.`,
    assumptions: buildAssumptions(brief, direction),
    sections: brief.sections,
    features: brief.features,
    html,
    handoffPrompt: buildHandoffPrompt(brief, input.artifactType, direction, input.tweaks),
    critique,
    direction,
  };
}
