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
        'Hay botones sin nombre accesible',
        `${unnamedButtons.length} botón(es) dependen solo de lo visual.`,
        'Da a cada botón texto visible o un aria-label.',
        'button',
      ),
    );
  }

  if (!/button:focus-visible/.test(html)) {
    issues.push(
      makeIssue(
        'a11y-focus-visible',
        'error',
        'Falta estado de foco visible',
        'Los usuarios de teclado necesitan un anillo de foco visible en el prototipo exportado.',
        'Añade una regla button:focus-visible con outline claro y separación.',
        'style',
      ),
    );
  }

  if (html.includes('class="segmented"') && !/class="segmented"[^>]*role="group"/.test(html)) {
    issues.push(
      makeIssue(
        'a11y-segmented-role',
        'warning',
        'El control segmentado no declara su grupo',
        'El control segmentado generado debería exponer su propósito a tecnologías de asistencia.',
        'Renderiza controles segmentados con role="group" y aria-label.',
        '.segmented',
      ),
    );
  }

  if (html.includes('class="segmented"') && !/aria-pressed=/.test(html)) {
    issues.push(
      makeIssue(
        'a11y-active-state',
        'warning',
        'El estado activo es solo visual',
        'Los botones seleccionados deberían comunicar estado sin depender solo del color.',
        'Añade aria-pressed o aria-selected a los controles activos.',
        '.segmented button',
      ),
    );
  }

  if (html.includes('<nav') && !Array.from(html.matchAll(/<nav\b([^>]*)>/gi)).every(([, attrs]) => hasAttribute(attrs, 'aria-label'))) {
    issues.push(
      makeIssue(
        'a11y-nav-label',
        'info',
        'La navegación puede tener una etiqueta más clara',
        'Nombrar cada navegación ayuda a distinguir secciones de app, slides o móvil.',
        'Añade aria-label a cada landmark nav.',
        'nav',
      ),
    );
  }

  return issues;
}
