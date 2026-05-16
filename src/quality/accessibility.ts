import type { QualityContext, QualityIssue } from './types';

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function hasAttribute(markup: string, name: string): boolean {
  return new RegExp(`\\s${name}(=|\\s|>)`, 'i').test(markup);
}

function makeIssue(
  id: string,
  severity: QualityIssue['severity'],
  title: string,
  detail: string,
  suggestedFix: string,
  selector?: string,
): QualityIssue {
  return { id, category: 'accessibility', severity, title, detail, suggestedFix, selector };
}

export function analyzeAccessibility(context: QualityContext): QualityIssue[] {
  const { html } = context;
  const issues: QualityIssue[] = [];
  const buttons = Array.from(html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi));
  const unnamedButtons = buttons.filter(([, attrs, content]) => !stripTags(content) && !/aria-label=/i.test(attrs));

  if (unnamedButtons.length > 0) {
    issues.push(
      makeIssue(
        'a11y-button-name',
        'error',
        'Some buttons have no accessible name',
        `${unnamedButtons.length} button(s) rely on visuals only.`,
        'Give every button visible text or an aria-label.',
        'button',
      ),
    );
  }

  if (!/button:focus-visible/.test(html)) {
    issues.push(
      makeIssue(
        'a11y-focus-visible',
        'error',
        'Focus state is missing',
        'Keyboard users need a visible focus ring in the exported prototype.',
        'Add a button:focus-visible rule with a clear outline and offset.',
        'style',
      ),
    );
  }

  if (html.includes('class="segmented"') && !/class="segmented"[^>]*role="group"/.test(html)) {
    issues.push(
      makeIssue(
        'a11y-segmented-role',
        'warning',
        'Segmented control lacks a group role',
        'The generated segmented control should expose its purpose to assistive tech.',
        'Render segmented controls with role="group" and an aria-label.',
        '.segmented',
      ),
    );
  }

  if (html.includes('class="segmented"') && !/aria-pressed=/.test(html)) {
    issues.push(
      makeIssue(
        'a11y-active-state',
        'warning',
        'Active state is visual only',
        'Selected buttons should expose state without relying only on color.',
        'Add aria-pressed or aria-selected to active controls.',
        '.segmented button',
      ),
    );
  }

  if (html.includes('<nav') && !Array.from(html.matchAll(/<nav\b([^>]*)>/gi)).every(([, attrs]) => hasAttribute(attrs, 'aria-label'))) {
    issues.push(
      makeIssue(
        'a11y-nav-label',
        'info',
        'Navigation label can be clearer',
        'Named navigation helps users distinguish app, slide, and mobile sections.',
        'Add aria-label to every nav landmark.',
        'nav',
      ),
    );
  }

  return issues;
}
