import type { UXIntent } from '../intent/types';
import type { ArtifactType, DerivedBrief, DesignTweaks } from '../types';
import { renderDashboard } from './dashboard';
import { renderDeck } from './deck';
import { renderInfographic } from './infographic';
import { renderMobile } from './mobile';
import { renderSoftware } from './software';
import { renderWeb } from './web';

export function renderArtifact(
  brief: DerivedBrief,
  type: ArtifactType,
  tweaks: DesignTweaks,
  intent: UXIntent,
): string {
  if (type === 'dashboard') return renderDashboard(brief, intent);
  if (type === 'web') return renderWeb(brief, intent);
  if (type === 'mobile') return renderMobile(brief, tweaks.showDevice, intent);
  if (type === 'deck') return renderDeck(brief, intent);
  if (type === 'infographic') return renderInfographic(brief, intent);
  return renderSoftware(brief, intent);
}
