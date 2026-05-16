import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderButton, renderNav } from './components';
import { renderMetricCards } from './partials';
import { orderByVariation, renderVariationAttributes, type RenderVariation } from './variations';

export function renderWeb(brief: DerivedBrief, intent: UXIntent, variation: RenderVariation): string {
  const features = orderByVariation(brief.features, variation);

  return `
    <div class="artifact-shell web-shell ${variation.shellClass}" ${renderVariationAttributes(variation)}>
      ${renderNav(brief.name, ['Producto', 'Prueba', 'Flujo'], 'Solicitar demo')}
      <main class="web-main">
        <section class="web-hero">
          <div>
            <p class="eyebrow">${escapeHtml(variation.label)} para ${escapeHtml(brief.audience)}</p>
            <h1>${escapeHtml(brief.objective)}.</h1>
            <p>${escapeHtml(brief.topic)}</p>
            <div class="hero-actions">
              ${renderButton({ label: intent.primaryAction, variant: 'primary' })}
              ${renderButton({ label: intent.secondaryAction ?? 'Ver sistema', variant: 'ghost' })}
            </div>
          </div>
          <div class="product-shot" aria-label="Vista previa del producto generado">
            <div class="shot-top"></div>
            <div class="shot-grid">
              <span></span><span></span><span></span><span></span>
            </div>
            <div class="shot-panel">${renderMetricCards(brief)}</div>
          </div>
        </section>
        <section class="proof-row">
          ${features
            .slice(0, 3)
            .map((feature) => `<article><strong>${escapeHtml(feature)}</strong><span>${escapeHtml(brief.objective)}</span></article>`)
            .join('')}
        </section>
      </main>
    </div>
  `;
}
