import type { UXIntent } from '../intent/types';
import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';
import { renderPhoneFrame, renderTimeline } from './components';
import { orderByVariation, renderVariationAttributes, type RenderVariation } from './variations';

export function renderMobile(
  brief: DerivedBrief,
  showDevice: boolean,
  intent: UXIntent,
  variation: RenderVariation,
): string {
  const sections = orderByVariation(brief.sections, variation);
  const features = orderByVariation(brief.features, variation);

  return `
    <div class="artifact-shell mobile-shell ${variation.shellClass}" ${renderVariationAttributes(variation)}>
      ${renderPhoneFrame({
        showDevice,
        eyebrow: variation.label,
        title: brief.name,
        focusLabel: brief.objective,
        focusValue: intent.primaryAction,
        listItems: features,
        navItems: sections,
      })}
      <aside class="mobile-context">
        <p class="eyebrow">Mapa del prototipo</p>
        <h2>${escapeHtml(intent.userMentalModel)}</h2>
        <div class="timeline">${renderTimeline(sections)}</div>
      </aside>
    </div>
  `;
}
