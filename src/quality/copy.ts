import type { QualityContext, QualityIssue } from './types';

const genericPhrases = [
  'Start prototype',
  'View system',
  'Ship review',
  'Next actions',
  'brief coverage',
  'items to resolve',
  'Generated product preview',
  'Ver sistema',
  'Siguientes acciones',
  'cobertura del brief',
  'temas por resolver',
  'Vista previa del producto generado',
];

const weakActions = ['view', 'open', 'see', 'check', 'explore', 'ver', 'abrir', 'revisar'];

function issue(
  id: string,
  severity: QualityIssue['severity'],
  title: string,
  detail: string,
  suggestedFix: string,
  selector?: string,
): QualityIssue {
  return { id, category: 'copy', severity, title, detail, suggestedFix, selector };
}

export function analyzeCopy(context: QualityContext): QualityIssue[] {
  const { html, intent, brief } = context;
  const issues: QualityIssue[] = [];
  const foundGeneric = genericPhrases.filter((phrase) => html.toLowerCase().includes(phrase.toLowerCase()));

  if (foundGeneric.length > 0) {
    issues.push(
      issue(
        'copy-generic-phrases',
        'warning',
        'Parte del copy sigue siendo genérico',
        `Se encontraron frases genéricas: ${foundGeneric.join(', ')}.`,
        'Sustituye esos textos por vocabulario del dominio y de la tarea del usuario.',
      ),
    );
  }

  const firstVerb = intent.primaryAction.split(/\s+/)[0]?.toLowerCase();
  if (weakActions.includes(firstVerb)) {
    issues.push(
      issue(
        'copy-weak-primary-action',
        'info',
        'La acción primaria puede ser más decidida',
        `"${intent.primaryAction}" empieza con un verbo de baja intención.`,
        'Usa un verbo que comprometa al usuario con un resultado concreto.',
        '.primary-action',
      ),
    );
  }

  if (brief.name.length <= 5 || /^design|app|tool|demo$/i.test(brief.name)) {
    issues.push(
      issue(
        'copy-name-specificity',
        'info',
        'El nombre del producto aún no es específico',
        `"${brief.name}" sirve para explorar, pero sonará genérico en un handoff.`,
        'Renombra el concepto con un nombre más propio del dominio antes de entregarlo.',
      ),
    );
  }

  if (!html.includes(intent.primaryAction)) {
    issues.push(
      issue(
        'copy-primary-action-missing',
        'error',
        'La acción primaria no aparece en el artefacto',
        `La acción planificada "${intent.primaryAction}" no es visible en el HTML generado.`,
        'Muestra la acción primaria en el hero, la barra de acciones o el módulo principal.',
      ),
    );
  }

  return issues;
}
