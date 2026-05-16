import { domainLabels, goalLabels } from '../engine/intent/domainRules';
import { analyzeAccessibility } from './accessibility';
import { analyzeColor } from './color';
import { analyzeCopy } from './copy';
import { analyzeLayoutHeuristics } from './layoutHeuristics';
import { buildScores, sortIssues, totalScore } from './scoring';
import type { QualityContext, QualityIssue, QualityReport } from './types';

function exportIssues(context: QualityContext): QualityIssue[] {
  const issues: QualityIssue[] = [];
  if (!context.html.startsWith('<!doctype html>')) {
    issues.push({
      id: 'export-doctype',
      category: 'export',
      severity: 'error',
      title: 'Standalone export is missing a doctype',
      detail: 'The HTML export should open predictably in browsers.',
      suggestedFix: 'Keep <!doctype html> as the first bytes of the generated export.',
    });
  }
  if (!context.html.includes('<meta name="viewport"')) {
    issues.push({
      id: 'export-viewport',
      category: 'export',
      severity: 'warning',
      title: 'Viewport meta is missing',
      detail: 'Responsive previews and exported HTML need a viewport declaration.',
      suggestedFix: 'Add a viewport meta tag in the HTML document head.',
    });
  }
  if (!context.html.includes('data-ux-domain=') || !context.html.includes('data-ux-goal=')) {
    issues.push({
      id: 'export-ux-metadata',
      category: 'export',
      severity: 'info',
      title: 'UX metadata is not embedded',
      detail: 'Agents and future export bundles benefit from intent metadata in the HTML.',
      suggestedFix: 'Keep data-ux-domain and data-ux-goal on the body element.',
    });
  }
  return issues;
}

function summarizeFixes(issues: QualityIssue[]): string[] {
  return issues
    .filter((issue) => issue.severity !== 'info')
    .slice(0, 4)
    .map((issue) => `${issue.title}: ${issue.suggestedFix}`);
}

export function analyzeDesignOutput(context: QualityContext): QualityReport {
  const issues = sortIssues([
    ...analyzeColor(context),
    ...analyzeAccessibility(context),
    ...analyzeLayoutHeuristics(context),
    ...analyzeCopy(context),
    ...exportIssues(context),
  ]);
  const scores = buildScores(issues);
  const fix = summarizeFixes(issues);

  return {
    total: totalScore(scores),
    scores,
    issues,
    keep: [
      `Detected ${domainLabels[context.intent.domain]} / ${goalLabels[context.intent.goal]}, so the critique can judge against real UX intent.`,
      `The ${context.direction.name.toLowerCase()} direction still gives the concept a clear visual contract.`,
      'Generated HTML remains standalone and keeps UX metadata for future handoff/export work.',
      'Reusable render components now make buttons, lists, navigation and metrics easier to audit consistently.',
    ],
    fix: fix.length > 0 ? fix : ['No blocking quality issues found in the deterministic pass. Keep testing with real content.'],
    quickWins: [
      'Resolve error-severity issues before visual polish.',
      'Replace any warning about generic copy with domain-specific language from the prompt.',
      'Open desktop, tablet and mobile preview after changing layout density.',
    ],
  };
}
