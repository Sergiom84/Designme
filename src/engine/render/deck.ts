import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderFeatureList, renderSideRail } from './components';

export function renderDeck(brief: DerivedBrief, intent: UXIntent): string {
  return `
    <div class="artifact-shell deck-shell">
      ${renderSideRail('', brief.sections.slice(0, 5), { className: 'slide-rail', numbered: true })}
      <main class="slide-stage">
        <p class="eyebrow">Narrative deck</p>
        <h1>${escapeHtml(brief.name)}</h1>
        <p>${escapeHtml(brief.topic)}</p>
        <div class="slide-proof">
          <span>${escapeHtml(brief.objective)}</span>
          <strong>${escapeHtml(intent.primaryAction)}</strong>
        </div>
        <ul class="feature-list">${renderFeatureList(brief.features)}</ul>
      </main>
      <aside class="speaker-notes">
        <span>Speaker notes</span>
        <p>${escapeHtml(intent.userMentalModel)}</p>
      </aside>
    </div>
  `;
}
