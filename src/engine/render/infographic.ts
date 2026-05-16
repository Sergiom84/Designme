import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderNumberedCard } from './components';

export function renderInfographic(brief: DerivedBrief, intent: UXIntent): string {
  return `
    <div class="artifact-shell infographic-shell">
      <main class="poster">
        <p class="eyebrow">Visual explainer</p>
        <h1>${escapeHtml(brief.objective)}</h1>
        <p>${escapeHtml(brief.topic)}</p>
        <section class="poster-grid">
          ${intent.modules
            .slice(0, 4)
            .map((module, index) => renderNumberedCard(index, module.label, module.purpose))
            .join('')}
        </section>
      </main>
    </div>
  `;
}
