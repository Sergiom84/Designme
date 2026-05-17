import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderCard, renderChartBars, renderFeatureList, renderSegmentedControl } from './components';
import { renderMetricCards } from './partials';
import { orderByVariation, renderVariationAttributes, type RenderVariation } from './variations';

export function renderDashboard(brief: DerivedBrief, intent: UXIntent, variation: RenderVariation): string {
  const features = orderByVariation(brief.features, variation);

  return `
    <div class="artifact-shell dashboard-shell ${variation.shellClass}" ${renderVariationAttributes(variation)}>
      <main class="workspace full">
        <header class="hero-strip compact">
          <div>
            <p class="eyebrow">${escapeHtml(variation.label)}</p>
            <h1>${escapeHtml(brief.name)}</h1>
          </div>
          ${renderSegmentedControl('Rango temporal', ['Semana', 'Mes', 'Trimestre'])}
        </header>
        <section class="metric-grid">${renderMetricCards(brief)}</section>
        <section class="analytics-grid">
          ${renderCard({
            className: 'chart-module',
            eyebrow: brief.objective,
            title: intent.secondaryAction ?? 'Tendencia de señales',
            children: renderChartBars(),
          })}
          ${renderCard({
            eyebrow: 'Cola de responsables',
            title: variation.skeleton === 'lane-board' ? 'Carriles de decisión' : 'Siguientes acciones',
            children: `<ul class="feature-list">${renderFeatureList(features)}</ul>`,
          })}
        </section>
      </main>
    </div>
  `;
}
