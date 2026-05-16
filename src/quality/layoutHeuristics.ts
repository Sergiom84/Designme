import type { QualityContext, QualityIssue } from './types';

function textFromTag(html: string, tag: string): string[] {
  return Array.from(html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))).map((match) =>
    match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
  );
}

function count(html: string, pattern: RegExp): number {
  return Array.from(html.matchAll(pattern)).length;
}

function issue(
  id: string,
  category: QualityIssue['category'],
  severity: QualityIssue['severity'],
  title: string,
  detail: string,
  suggestedFix: string,
  selector?: string,
): QualityIssue {
  return { id, category, severity, title, detail, suggestedFix, selector };
}

export function analyzeLayoutHeuristics(context: QualityContext): QualityIssue[] {
  const { html, brief, tweaks, intent } = context;
  const issues: QualityIssue[] = [];
  const h1Texts = textFromTag(html, 'h1');
  const metricCards = count(html, /class="metric-card"/g);
  const primaryActions = count(html, /class="[^"]*primary-action/g);
  const modules = count(html, /class="[^"]*module/g) + count(html, /class="metric-card"/g);

  if (h1Texts.length !== 1) {
    issues.push(
      issue(
        'hierarchy-h1-count',
        h1Texts.length === 0 ? 'hierarchy' : 'hierarchy',
        'error',
        'Generated artifact should have one main heading',
        `Found ${h1Texts.length} h1 element(s).`,
        'Keep one primary h1 and demote supporting headings to h2/h3.',
        'h1',
      ),
    );
  }

  const longHero = h1Texts.find((text) => text.length > 88);
  if (longHero) {
    issues.push(
      issue(
        'hierarchy-hero-length',
        'hierarchy',
        'warning',
        'Hero title is too long for display type',
        `The main heading is ${longHero.length} characters.`,
        'Shorten the h1 or move supporting detail into body copy.',
        'h1',
      ),
    );
  }

  if (primaryActions !== 1) {
    issues.push(
      issue(
        'interaction-primary-action-count',
        'interaction',
        'warning',
        'Primary action should be singular',
        `Found ${primaryActions} primary action button(s).`,
        'Keep one dominant CTA and use secondary buttons for alternatives.',
        '.primary-action',
      ),
    );
  }

  if (metricCards > 3 && context.artifactType !== 'dashboard') {
    issues.push(
      issue(
        'layout-metric-competition',
        'layout',
        'warning',
        'Too many metrics compete for attention',
        `Found ${metricCards} metric cards outside a dashboard artifact.`,
        'Choose the one proof metric that supports the main action and move the rest lower.',
        '.metric-card',
      ),
    );
  }

  if (modules < 3 && context.artifactType !== 'infographic') {
    issues.push(
      issue(
        'layout-module-depth',
        'layout',
        'warning',
        'Prototype has limited module depth',
        `Only ${modules} content modules were detected.`,
        'Add a state, queue, evidence panel, or detail module tied to the UX intent.',
      ),
    );
  }

  if (tweaks.density === 'dense' && intent.modules.length >= 7) {
    issues.push(
      issue(
        'layout-dense-complex-intent',
        'layout',
        'info',
        'Dense mode with many planned modules needs manual spacing review',
        `${intent.modules.length} intent modules are planned while density is dense.`,
        'Check the tablet/mobile preview and move low-priority modules behind tabs or detail screens.',
      ),
    );
  }

  if (brief.features.length < 5) {
    issues.push(
      issue(
        'layout-feature-depth',
        'layout',
        'info',
        'Feature set is thin',
        `Only ${brief.features.length} feature labels are available after intent planning.`,
        'Add constraints, entities, or user states to the prompt for richer module planning.',
      ),
    );
  }

  return issues;
}
