import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderFeatureList, renderMetricCards } from './partials';

export function renderDashboard(brief: DerivedBrief, intent: UXIntent): string {
  return `
    <div class="artifact-shell dashboard-shell">
      <main class="workspace full">
        <header class="hero-strip compact">
          <div>
            <p class="eyebrow">Decision dashboard</p>
            <h1>${escapeHtml(brief.name)}</h1>
          </div>
          <div class="segmented">
            <button class="active">Week</button>
            <button>Month</button>
            <button>Quarter</button>
          </div>
        </header>
        <section class="metric-grid">${renderMetricCards(brief)}</section>
        <section class="analytics-grid">
          <article class="module chart-module">
            <div class="module-head">
              <span>${escapeHtml(brief.objective)}</span>
              <strong>${escapeHtml(intent.secondaryAction ?? 'Signal trend')}</strong>
            </div>
            <div class="bars">
              <i style="height: 46%"></i><i style="height: 68%"></i><i style="height: 58%"></i>
              <i style="height: 83%"></i><i style="height: 74%"></i><i style="height: 91%"></i>
            </div>
          </article>
          <article class="module">
            <div class="module-head">
              <span>Owner queue</span>
              <strong>Next actions</strong>
            </div>
            <ul class="feature-list">${renderFeatureList(brief)}</ul>
          </article>
        </section>
      </main>
    </div>
  `;
}
