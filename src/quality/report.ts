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
      title: 'La exportación autónoma no tiene doctype',
      detail: 'El HTML exportado debería abrirse de forma predecible en navegadores.',
      suggestedFix: 'Mantén <!doctype html> como los primeros bytes del export generado.',
    });
  }
  if (!context.html.includes('<meta name="viewport"')) {
    issues.push({
      id: 'export-viewport',
      category: 'export',
      severity: 'warning',
      title: 'Falta la meta viewport',
      detail: 'Las vistas adaptables y el HTML exportado necesitan declaración de viewport.',
      suggestedFix: 'Añade una meta viewport en el head del documento HTML.',
    });
  }
  if (!context.html.includes('data-ux-domain=') || !context.html.includes('data-ux-goal=')) {
    issues.push({
      id: 'export-ux-metadata',
      category: 'export',
      severity: 'info',
      title: 'Los metadatos UX no están embebidos',
      detail: 'Los agentes y futuros paquetes de exportación se benefician de la metadata de intención en el HTML.',
      suggestedFix: 'Mantén data-ux-domain y data-ux-goal en el elemento body.',
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
      `Se detectó ${domainLabels[context.intent.domain]} / ${goalLabels[context.intent.goal]}, así que la crítica puede evaluar contra una intención UX real.`,
      `La dirección ${context.direction.name.toLowerCase()} mantiene un contrato visual claro para el concepto.`,
      'El HTML generado sigue siendo autónomo y conserva metadatos UX para handoff/exportación.',
      'Los componentes de render reutilizables facilitan auditar botones, listas, navegación y métricas.',
    ],
    fix: fix.length > 0 ? fix : ['No se encontraron problemas bloqueantes en la pasada determinista. Sigue probando con contenido real.'],
    quickWins: [
      'Resuelve las incidencias con severidad error antes del pulido visual.',
      'Sustituye cualquier aviso de copy genérico por lenguaje específico del dominio.',
      'Abre escritorio, tablet y móvil después de cambiar la densidad de layout.',
    ],
  };
}
