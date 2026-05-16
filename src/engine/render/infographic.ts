import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';

export function renderInfographic(brief: DerivedBrief): string {
  return `
    <div class="artifact-shell infographic-shell">
      <main class="poster">
        <p class="eyebrow">Visual explainer</p>
        <h1>${escapeHtml(brief.objective)}</h1>
        <p>${escapeHtml(brief.topic)}</p>
        <section class="poster-grid">
          ${brief.sections
            .slice(0, 4)
            .map(
              (section, index) => `
                <article>
                  <span>${String(index + 1).padStart(2, '0')}</span>
                  <strong>${escapeHtml(section)}</strong>
                  <p>${escapeHtml(brief.features[index] ?? brief.objective)}</p>
                </article>
              `,
            )
            .join('')}
        </section>
      </main>
    </div>
  `;
}
