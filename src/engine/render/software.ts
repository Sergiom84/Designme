import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderFeatureList, renderMetricCards } from './partials';

export function renderSoftware(brief: DerivedBrief): string {
  return `
    <div class="artifact-shell software-shell">
      <aside class="rail">
        <div class="mark">${escapeHtml(brief.name.slice(0, 2).toUpperCase())}</div>
        ${brief.sections
          .slice(0, 4)
          .map((section, index) => `<button class="${index === 0 ? 'active' : ''}">${escapeHtml(section)}</button>`)
          .join('')}
      </aside>
      <main class="workspace">
        <header class="hero-strip">
          <div>
            <p class="eyebrow">Local design workspace</p>
            <h1>${escapeHtml(brief.name)}</h1>
            <p>${escapeHtml(brief.objective)} for ${escapeHtml(brief.audience)}.</p>
          </div>
          <button class="primary-action">Ship review</button>
        </header>
        <section class="metric-grid">${renderMetricCards(brief)}</section>
        <section class="split-grid">
          <article class="module large">
            <div class="module-head">
              <span>Active work</span>
              <strong>${escapeHtml(brief.sections[1])}</strong>
            </div>
            <div class="task-table">
              ${brief.features
                .slice(0, 5)
                .map(
                  (feature, index) => `
                    <button class="task-row">
                      <span>${escapeHtml(feature)}</span>
                      <small>${index % 2 === 0 ? 'ready' : 'needs input'}</small>
                    </button>
                  `,
                )
                .join('')}
            </div>
          </article>
          <article class="module">
            <div class="module-head">
              <span>Design intent</span>
              <strong>Critique path</strong>
            </div>
            <ul class="feature-list">${renderFeatureList(brief)}</ul>
          </article>
        </section>
      </main>
    </div>
  `;
}
