import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderCard, renderChartBars, renderFeatureList, renderSegmentedControl } from './components';
import { renderMetricCards } from './partials';

export function renderDashboard(brief: DerivedBrief, intent: UXIntent): string {
  return `
    <div class="artifact-shell dashboard-shell">
      <main class="workspace full">
        <header class="hero-strip compact">
          <div>
            <p class="eyebrow">Decision dashboard</p>
            <h1>${escapeHtml(brief.name)}</h1>
          </div>
          ${renderSegmentedControl('Time range', ['Week', 'Month', 'Quarter'])}
        </header>
        <section class="metric-grid">${renderMetricCards(brief)}</section>
        <section class="analytics-grid">
          ${renderCard({
            className: 'chart-module',
            eyebrow: brief.objective,
            title: intent.secondaryAction ?? 'Signal trend',
            children: renderChartBars(),
          })}
          ${renderCard({
            eyebrow: 'Owner queue',
            title: 'Next actions',
            children: `<ul class="feature-list">${renderFeatureList(brief.features)}</ul>`,
          })}
        </section>
      </main>
    </div>
  `;
}
