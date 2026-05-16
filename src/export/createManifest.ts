import type { ExportBundleBuildInput, ExportManifest } from './types';

export function createManifest({ output, input, createdAt = new Date().toISOString() }: ExportBundleBuildInput): ExportManifest {
  return {
    version: '0.2.0',
    createdAt,
    name: output.name,
    artifactType: input.artifactType,
    directionId: input.directionId,
    themeId: output.direction.themeId,
    tweaks: input.tweaks,
    brief: {
      prompt: input.prompt,
      summary: output.briefSummary,
      audience: output.brief.audience,
      objective: output.brief.objective,
      sections: output.sections,
      features: output.features,
    },
    intent: output.intent,
    quality: {
      total: output.critique.total,
      scores: output.critique.scores,
      issues: output.critique.issues,
    },
  };
}
