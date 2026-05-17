import type { UXIntent } from '../intent/types';
import type { ArtifactType, DerivedBrief, DesignTweaks } from '../types';
import { renderDashboard } from './dashboard';
import { renderDeck } from './deck';
import { renderInfographic } from './infographic';
import { renderMobile } from './mobile';
import { renderSoftware } from './software';
import { selectRenderVariation } from './variations';
import { renderWeb } from './web';

export function renderArtifact(
  brief: DerivedBrief,
  type: ArtifactType,
  tweaks: DesignTweaks,
  intent: UXIntent,
): string {
  const variation = selectRenderVariation(brief, type, intent);

  if (type === 'dashboard') return renderDashboard(brief, intent, variation);
  if (type === 'web') return renderWeb(brief, intent, variation);
  if (type === 'mobile') return renderMobile(brief, tweaks.showDevice, intent, variation);
  if (type === 'deck') return renderDeck(brief, intent, variation);
  if (type === 'infographic') return renderInfographic(brief, intent, variation);
  return renderSoftware(brief, intent, variation);
}
