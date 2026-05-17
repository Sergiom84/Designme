import type { DerivedBrief } from '../types';
import {
  renderFeatureList as renderFeatureItems,
  renderMetricCard,
  renderTimeline as renderTimelineItems,
} from './components';

export function renderMetricCards(brief: DerivedBrief): string {
  const metrics = [
    ['Claridad', '92', 'cobertura del brief'],
    ['Impulso', '+18%', 'siguientes acciones'],
    ['Riesgo', '3', 'temas por resolver'],
  ];

  return metrics
    .map(([label, value, caption]) => renderMetricCard(label, value, `${caption} para ${brief.name}`))
    .join('');
}

export function renderFeatureList(brief: DerivedBrief): string {
  return renderFeatureItems(brief.features);
}

export function renderTimeline(brief: DerivedBrief): string {
  return renderTimelineItems(brief.sections);
}
