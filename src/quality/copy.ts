import type { QualityContext, QualityIssue } from './types';

const genericPhrases = [
  'Start prototype',
  'View system',
  'Ship review',
  'Next actions',
  'brief coverage',
  'items to resolve',
  'Generated product preview',
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
        'Some copy is still generic',
        `Found generic phrase(s): ${foundGeneric.join(', ')}.`,
        'Replace generic labels with vocabulary from the product domain and user task.',
      ),
    );
  }

  const firstVerb = intent.primaryAction.split(/\s+/)[0]?.toLowerCase();
  if (weakActions.includes(firstVerb)) {
    issues.push(
      issue(
        'copy-weak-primary-action',
        'info',
        'Primary action can be more decisive',
        `"${intent.primaryAction}" starts with a low-intent verb.`,
        'Use a verb that commits the user to a concrete outcome.',
        '.primary-action',
      ),
    );
  }

  if (brief.name.length <= 5 || /^design|app|tool|demo$/i.test(brief.name)) {
    issues.push(
      issue(
        'copy-name-specificity',
        'info',
        'Product name is not specific yet',
        `"${brief.name}" works for exploration but will feel generic in a handoff.`,
        'Rename the concept with a domain-specific product name before shipping.',
      ),
    );
  }

  if (!html.includes(intent.primaryAction)) {
    issues.push(
      issue(
        'copy-primary-action-missing',
        'error',
        'Primary action is missing from the artifact',
        `The planned action "${intent.primaryAction}" is not visible in the generated HTML.`,
        'Render the planned primary action in the hero, toolbar, or main task module.',
      ),
    );
  }

  return issues;
}
