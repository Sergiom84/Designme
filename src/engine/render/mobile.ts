import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderPhoneFrame, renderTimeline } from './components';

export function renderMobile(brief: DerivedBrief, showDevice: boolean, intent: UXIntent): string {
  return `
    <div class="artifact-shell mobile-shell">
      ${renderPhoneFrame({
        showDevice,
        eyebrow: 'Today',
        title: brief.name,
        focusLabel: brief.objective,
        focusValue: intent.primaryAction,
        listItems: brief.features,
        navItems: brief.sections,
      })}
      <aside class="mobile-context">
        <p class="eyebrow">Prototype map</p>
        <h2>${escapeHtml(intent.userMentalModel)}</h2>
        <div class="timeline">${renderTimeline(brief.sections)}</div>
      </aside>
    </div>
  `;
}
