import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderFeatureList } from './partials';

export function renderDeck(brief: DerivedBrief): string {
  return `
    <div class="artifact-shell deck-shell">
      <aside class="slide-rail">
        ${brief.sections
          .slice(0, 5)
          .map((section, index) => `<button class="${index === 0 ? 'active' : ''}">${index + 1}. ${escapeHtml(section)}</button>`)
          .join('')}
      </aside>
      <main class="slide-stage">
        <p class="eyebrow">Narrative deck</p>
        <h1>${escapeHtml(brief.name)}</h1>
        <p>${escapeHtml(brief.topic)}</p>
        <div class="slide-proof">
          <span>${escapeHtml(brief.objective)}</span>
          <strong>${escapeHtml(brief.audience)}</strong>
        </div>
        <ul class="feature-list">${renderFeatureList(brief)}</ul>
      </main>
      <aside class="speaker-notes">
        <span>Speaker notes</span>
        <p>Open with the tension, show the system, then ask for one concrete next step.</p>
      </aside>
    </div>
  `;
}
