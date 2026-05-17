import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderNumberedCard } from './components';
import { orderByVariation, renderVariationAttributes, type RenderVariation } from './variations';

export function renderInfographic(brief: DerivedBrief, intent: UXIntent, variation: RenderVariation): string {
  const modules = orderByVariation(intent.modules, variation);

  return `
    <div class="artifact-shell infographic-shell ${variation.shellClass}" ${renderVariationAttributes(variation)}>
      <main class="poster">
        <p class="eyebrow">${escapeHtml(variation.label)}</p>
        <h1>${escapeHtml(brief.objective)}</h1>
        <p>${escapeHtml(brief.topic)}</p>
        <section class="poster-grid">
          ${modules
            .slice(0, 4)
            .map((module, index) => renderNumberedCard(index, module.label, module.purpose))
            .join('')}
        </section>
      </main>
    </div>
  `;
}
