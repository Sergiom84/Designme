import type { QualityCategory, QualityIssue, QualityScore, Severity } from './types';

const scoreLabels: Array<{ label: string; categories: QualityCategory[] }> = [
  { label: 'Accessibility', categories: ['accessibility', 'interaction'] },
  { label: 'Contrast', categories: ['contrast'] },
  { label: 'Hierarchy', categories: ['hierarchy', 'layout'] },
  { label: 'Copy', categories: ['copy'] },
  { label: 'Export', categories: ['export'] },
];

const severityPenalty: Record<Severity, number> = {
  info: 0.35,
  warning: 1.15,
  error: 2.35,
};

export function scoreCategory(issues: QualityIssue[], categories: QualityCategory[]): number {
  const penalty = issues
    .filter((issue) => categories.includes(issue.category))
    .reduce((sum, issue) => sum + severityPenalty[issue.severity], 0);
  return Math.max(1, Math.min(10, Math.round((10 - penalty) * 10) / 10));
}

export function buildScores(issues: QualityIssue[]): QualityScore[] {
  return scoreLabels.map((score) => ({
    label: score.label,
    value: scoreCategory(issues, score.categories),
  }));
}

export function totalScore(scores: QualityScore[]): number {
  const average = scores.reduce((sum, score) => sum + score.value, 0) / scores.length;
  return Math.max(1, Math.min(10, Math.floor(average)));
}

export function sortIssues(issues: QualityIssue[]): QualityIssue[] {
  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  return [...issues].sort((a, b) => order[a.severity] - order[b.severity] || a.category.localeCompare(b.category));
}
