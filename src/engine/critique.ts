import { contrastRatio, getThemeById } from '../design-system/tokens';
import type { Critique, DerivedBrief, DesignDirection, DesignTweaks } from './types';

export function buildCritique(
  brief: DerivedBrief,
  direction: DesignDirection,
  tweaks: DesignTweaks,
): Critique {
  const theme = getThemeById(direction.themeId);
  const contrast = contrastRatio(theme.color.text, theme.color.background);
  const promptDepth = Math.min(2, Math.floor(brief.rawPrompt.length / 90));
  const motionBonus = tweaks.motion === 'expressive' ? 1 : 0;
  const densityBonus = tweaks.density === 'balanced' ? 1 : 0;
  const scores = [
    { label: 'Coherence', value: 7 + promptDepth },
    { label: 'Hierarchy', value: 8 + densityBonus },
    { label: 'Craft', value: 7 + (direction.id === 'editorial' ? 1 : 0) + (contrast >= 7 ? 1 : 0) },
    { label: 'Function', value: 8 + (brief.features.length > 6 ? 1 : 0) },
    { label: 'Novelty', value: 6 + motionBonus + (direction.id === 'kinetic' ? 1 : 0) },
  ].map((item) => ({ ...item, value: Math.min(10, item.value) }));

  const total = Math.round(scores.reduce((sum, score) => sum + score.value, 0) / scores.length);
  return {
    total,
    scores,
    keep: [
      `The ${direction.name.toLowerCase()} direction gives the concept a clear visual contract.`,
      `The generated modules are tied to "${brief.objective}" instead of generic filler.`,
      `Base text contrast is ${contrast}:1, which is ready for normal UI copy.`,
      'Tweaks stay small enough to explore choices without becoming a settings maze.',
    ],
    fix: [
      'Replace any placeholder copy with real product language before shipping.',
      'Add actual brand assets when the product identity is known.',
      'Run click-through verification after changing the generated HTML.',
    ],
    quickWins: [
      'Pick one hero metric and remove competing numbers.',
      'Rename sections with the vocabulary your users already use.',
      'Export HTML, then ask Codex or Claude for one focused refinement pass.',
    ],
  };
}

export function buildAssumptions(brief: DerivedBrief, direction: DesignDirection): string[] {
  return [
    `Audience: ${brief.audience}.`,
    `Goal: ${brief.objective}.`,
    `Direction: ${direction.name}, because it fits ${direction.bestFor.toLowerCase()}.`,
    'No API key is required; this pass is deterministic and local.',
  ];
}
