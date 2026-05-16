import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';

export function renderInfographic(brief: DerivedBrief, intent: UXIntent): string {
  return `
    <div class="artifact-shell infographic-shell">
      <main class="poster">
        <p class="eyebrow">Visual explainer</p>
        <h1>${escapeHtml(brief.objective)}</h1>
        <p>${escapeHtml(brief.topic)}</p>
        <section class="poster-grid">
          ${intent.modules
            .slice(0, 4)
            .map(
              (module, index) => `
                <article>
                  <span>${String(index + 1).padStart(2, '0')}</span>
                  <strong>${escapeHtml(module.label)}</strong>
                  <p>${escapeHtml(module.purpose)}</p>
                </article>
              `,
            )
            .join('')}
        </section>
      </main>
    </div>
  `;
}
