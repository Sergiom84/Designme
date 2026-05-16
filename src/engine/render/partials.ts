import type { DerivedBrief } from '../types';
import {
  renderFeatureList as renderFeatureItems,
  renderMetricCard,
  renderTimeline as renderTimelineItems,
} from './components';

export function renderMetricCards(brief: DerivedBrief): string {
  const metrics = [
    ['Clarity', '92', 'brief coverage'],
    ['Momentum', '+18%', 'next actions'],
    ['Risk', '3', 'items to resolve'],
  ];

  return metrics
    .map(([label, value, caption]) => renderMetricCard(label, value, `${caption} for ${brief.name}`))
    .join('');
}

export function renderFeatureList(brief: DerivedBrief): string {
  return renderFeatureItems(brief.features);
}

export function renderTimeline(brief: DerivedBrief): string {
  return renderTimelineItems(brief.sections);
}
