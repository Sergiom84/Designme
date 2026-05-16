import type { DerivedBrief } from '../types';
import { escapeHtml } from '../utils';

export function renderMetricCards(brief: DerivedBrief): string {
  const metrics = [
    ['Clarity', '92', 'brief coverage'],
    ['Momentum', '+18%', 'next actions'],
    ['Risk', '3', 'items to resolve'],
  ];

  return metrics
    .map(
      ([label, value, caption]) => `
        <article class="metric-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <small>${escapeHtml(caption)} for ${escapeHtml(brief.name)}</small>
        </article>
      `,
    )
    .join('');
}

export function renderFeatureList(brief: DerivedBrief): string {
  return brief.features
    .slice(0, 5)
    .map(
      (feature, index) => `
        <li>
          <span class="index">${String(index + 1).padStart(2, '0')}</span>
          <span>${escapeHtml(feature)}</span>
        </li>
      `,
    )
    .join('');
}

export function renderTimeline(brief: DerivedBrief): string {
  return brief.sections
    .slice(0, 5)
    .map(
      (section, index) => `
        <button class="step-button ${index === 0 ? 'is-active' : ''}" data-screen="${index}">
          <span>${escapeHtml(section)}</span>
          <small>${index === 0 ? 'live' : 'queued'}</small>
        </button>
      `,
    )
    .join('');
}
