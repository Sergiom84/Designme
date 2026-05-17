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
        'El contraste del texto base está por debajo del objetivo',
        `El contraste texto/fondo es ${baseContrast}:1 en el tema ${theme.name}.`,
        'Oscurece el texto o aclara el fondo en los tokens del tema.',
      ),
    );
  }

  if (accentContrast < 3) {
    issues.push(
      issue(
        'contrast-accent-ui',
        'warning',
        'El contraste de la acción principal es débil',
        `El contraste entre accentText y accent es ${accentContrast}:1.`,
        'Ajusta accent o accentText para que los elementos importantes superen al menos 3:1.',
      ),
    );
  }

  if (context.html.includes('color-mix(')) {
    issues.push(
      issue(
        'contrast-color-mix-manual-check',
        'info',
        'Los colores mezclados requieren verificación visual',
        'El CSS generado usa color-mix para texto secundario, bordes y paneles; no se puede puntuar solo desde tokens.',
        'Mantén el chequeo automático de contraste y verifica las etiquetas secundarias en navegador.',
      ),
    );
  }

  return issues;
}
