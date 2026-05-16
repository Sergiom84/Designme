import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderTimeline } from './partials';

export function renderMobile(brief: DerivedBrief, showDevice: boolean): string {
  const phoneClass = showDevice ? 'phone-frame' : 'phone-frame no-device';
  return `
    <div class="artifact-shell mobile-shell">
      <section class="${phoneClass}">
        <div class="phone-top"></div>
        <main class="phone-screen">
          <p class="eyebrow">Today</p>
          <h1>${escapeHtml(brief.name)}</h1>
          <div class="focus-card">
            <span>${escapeHtml(brief.objective)}</span>
            <strong>3 actions ready</strong>
          </div>
          <div class="mini-list">
            ${brief.features
              .slice(0, 4)
              .map((feature, index) => `<button data-screen="${index}"><span>${escapeHtml(feature)}</span><small>${index + 1}</small></button>`)
              .join('')}
          </div>
        </main>
        <nav class="phone-nav">
          ${brief.sections
            .slice(0, 4)
            .map((section, index) => `<button class="${index === 0 ? 'active' : ''}" data-screen="${index}">${escapeHtml(section.split(' ')[0])}</button>`)
            .join('')}
        </nav>
      </section>
      <aside class="mobile-context">
        <p class="eyebrow">Prototype map</p>
        <h2>Clickable states</h2>
        <div class="timeline">${renderTimeline(brief)}</div>
      </aside>
    </div>
  `;
}
