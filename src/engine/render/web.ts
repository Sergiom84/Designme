import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderButton, renderNav } from './components';
import { renderMetricCards } from './partials';

export function renderWeb(brief: DerivedBrief, intent: UXIntent): string {
  return `
    <div class="artifact-shell web-shell">
      ${renderNav(brief.name, ['Product', 'Proof', 'Workflow'], 'Request demo')}
      <main class="web-main">
        <section class="web-hero">
          <div>
            <p class="eyebrow">Built for ${escapeHtml(brief.audience)}</p>
            <h1>${escapeHtml(brief.objective)}.</h1>
            <p>${escapeHtml(brief.topic)}</p>
            <div class="hero-actions">
              ${renderButton({ label: intent.primaryAction, variant: 'primary' })}
              ${renderButton({ label: intent.secondaryAction ?? 'View system', variant: 'ghost' })}
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
