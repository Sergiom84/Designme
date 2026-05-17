import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderButton, renderCard, renderFeatureList, renderSideRail, renderTaskList } from './components';
import { renderMetricCards } from './partials';
import { orderByVariation, renderVariationAttributes, type RenderVariation } from './variations';

export function renderSoftware(brief: DerivedBrief, intent: UXIntent, variation: RenderVariation): string {
  const sections = orderByVariation(brief.sections, variation);
  const features = orderByVariation(brief.features, variation);

  return `
    <div class="artifact-shell software-shell ${variation.shellClass}" ${renderVariationAttributes(variation)}>
      ${renderSideRail(brief.name.slice(0, 2).toUpperCase(), sections.slice(0, 4))}
      <main class="workspace">
        <header class="hero-strip">
          <div>
            <p class="eyebrow">${escapeHtml(variation.label)}</p>
            <h1>${escapeHtml(brief.name)}</h1>
            <p>${escapeHtml(brief.objective)} para ${escapeHtml(brief.audience)}.</p>
          </div>
          ${renderButton({ label: intent.primaryAction, variant: 'primary' })}
        </header>
        <section class="metric-grid">${renderMetricCards(brief)}</section>
        <section class="split-grid">
          ${renderCard({
            className: 'large',
            eyebrow: 'Trabajo activo',
            title: sections[1] ?? sections[0],
            children: `<div class="task-table">${renderTaskList(features)}</div>`,
          })}
          ${renderCard({
            eyebrow: 'Intención de diseño',
            title: variation.skeleton === 'narrative-stack' ? 'Ruta narrativa' : 'Ruta de crítica',
            children: `<ul class="feature-list">${renderFeatureList(features)}</ul>`,
          })}
        </section>
      </main>
    </div>
  `;
}
