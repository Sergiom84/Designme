import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderMetricCards } from './partials';

export function renderWeb(brief: DerivedBrief, intent: UXIntent): string {
  return `
    <div class="artifact-shell web-shell">
      <nav class="site-nav">
        <strong>${escapeHtml(brief.name)}</strong>
        <span>Product</span><span>Proof</span><span>Workflow</span>
        <button>Request demo</button>
      </nav>
      <main class="web-main">
        <section class="web-hero">
          <div>
            <p class="eyebrow">Built for ${escapeHtml(brief.audience)}</p>
            <h1>${escapeHtml(brief.objective)}.</h1>
            <p>${escapeHtml(brief.topic)}</p>
            <div class="hero-actions">
              <button class="primary-action">${escapeHtml(intent.primaryAction)}</button>
              <button class="ghost-action">${escapeHtml(intent.secondaryAction ?? 'View system')}</button>
            </div>
          </div>
          <div class="product-shot" aria-label="Generated product preview">
            <div class="shot-top"></div>
            <div class="shot-grid">
              <span></span><span></span><span></span><span></span>
            </div>
            <div class="shot-panel">${renderMetricCards(brief)}</div>
          </div>
        </section>
        <section class="proof-row">
          ${brief.features
            .slice(0, 3)
            .map((feature) => `<article><strong>${escapeHtml(feature)}</strong><span>${escapeHtml(brief.objective)}</span></article>`)
            .join('')}
        </section>
      </main>
    </div>
  `;
}
