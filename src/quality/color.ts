import { contrastRatio, getThemeById } from '../design-system/tokens';
import type { QualityContext, QualityIssue } from './types';

function issue(id: string, severity: QualityIssue['severity'], title: string, detail: string, suggestedFix: string): QualityIssue {
  return {
    id,
    category: 'contrast',
    severity,
    title,
    detail,
    suggestedFix,
  };
}

export function analyzeColor(context: QualityContext): QualityIssue[] {
  const theme = getThemeById(context.direction.themeId);
  const baseContrast = contrastRatio(theme.color.text, theme.color.background);
  const accentContrast = contrastRatio(theme.color.accentText, theme.color.accent);
  const issues: QualityIssue[] = [];

  if (baseContrast < 4.5) {
    issues.push(
      issue(
        'contrast-base-text',
        'error',
        'Base text contrast is below normal-copy target',
        `Text/background contrast is ${baseContrast}:1 for the ${theme.name} theme.`,
        'Darken text or lighten the page background in the theme tokens.',
      ),
    );
  }

  if (accentContrast < 3) {
    issues.push(
      issue(
        'contrast-accent-ui',
        'warning',
        'Accent action contrast is weak',
        `Accent text/action contrast is ${accentContrast}:1.`,
        'Adjust accent or accentText so important UI elements clear at least 3:1.',
      ),
    );
  }

  if (context.html.includes('color-mix(')) {
    issues.push(
      issue(
        'contrast-color-mix-manual-check',
        'info',
        'Mixed colors need viewport verification',
        'Generated CSS uses color-mix for muted text, borders and panels, which cannot be fully scored from tokens alone.',
        'Keep the automated token contrast check, then verify muted labels in the browser for the selected tone.',
      ),
    );
  }

  return issues;
}
