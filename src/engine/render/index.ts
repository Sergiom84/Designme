import type { ArtifactType, DerivedBrief, DesignTweaks } from '../types';
import { renderDashboard } from './dashboard';
import { renderDeck } from './deck';
import { renderInfographic } from './infographic';
import { renderMobile } from './mobile';
import { renderSoftware } from './software';
import { renderWeb } from './web';

export function renderArtifact(brief: DerivedBrief, type: ArtifactType, tweaks: DesignTweaks): string {
  if (type === 'dashboard') return renderDashboard(brief);
  if (type === 'web') return renderWeb(brief);
  if (type === 'mobile') return renderMobile(brief, tweaks.showDevice);
  if (type === 'deck') return renderDeck(brief);
  if (type === 'infographic') return renderInfographic(brief);
  return renderSoftware(brief);
}
