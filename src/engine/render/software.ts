import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderButton, renderCard, renderFeatureList, renderSideRail, renderTaskList } from './components';
import { renderMetricCards } from './partials';

export function renderSoftware(brief: DerivedBrief, intent: UXIntent): string {
  return `
    <div class="artifact-shell software-shell">
      ${renderSideRail(brief.name.slice(0, 2).toUpperCase(), brief.sections.slice(0, 4))}
      <main class="workspace">
        <header class="hero-strip">
          <div>
            <p class="eyebrow">Local design workspace</p>
            <h1>${escapeHtml(brief.name)}</h1>
            <p>${escapeHtml(brief.objective)} for ${escapeHtml(brief.audience)}.</p>
          </div>
          ${renderButton({ label: intent.primaryAction, variant: 'primary' })}
        </header>
        <section class="metric-grid">${renderMetricCards(brief)}</section>
        <section class="split-grid">
          ${renderCard({
            className: 'large',
            eyebrow: 'Active work',
            title: brief.sections[1],
            children: `<div class="task-table">${renderTaskList(brief.features)}</div>`,
          })}
          ${renderCard({
            eyebrow: 'Design intent',
            title: 'Critique path',
            children: `<ul class="feature-list">${renderFeatureList(brief.features)}</ul>`,
          })}
        </section>
      </main>
    </div>
  `;
}
