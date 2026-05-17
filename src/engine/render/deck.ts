import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderFeatureList, renderSideRail } from './components';
import { orderByVariation, renderVariationAttributes, type RenderVariation } from './variations';

export function renderDeck(brief: DerivedBrief, intent: UXIntent, variation: RenderVariation): string {
  const sections = orderByVariation(brief.sections, variation);
  const features = orderByVariation(brief.features, variation);

  return `
    <div class="artifact-shell deck-shell ${variation.shellClass}" ${renderVariationAttributes(variation)}>
      ${renderSideRail('', sections.slice(0, 5), { className: 'slide-rail', numbered: true })}
      <main class="slide-stage">
        <p class="eyebrow">${escapeHtml(variation.label)}</p>
        <h1>${escapeHtml(brief.name)}</h1>
        <p>${escapeHtml(brief.topic)}</p>
        <div class="slide-proof">
          <span>${escapeHtml(brief.objective)}</span>
          <strong>${escapeHtml(intent.primaryAction)}</strong>
        </div>
        <ul class="feature-list">${renderFeatureList(features)}</ul>
      </main>
      <aside class="speaker-notes">
        <span>Notas de presentación</span>
        <p>${escapeHtml(intent.userMentalModel)}</p>
      </aside>
    </div>
  `;
}
