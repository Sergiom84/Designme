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
        'El artefacto generado debería tener un único heading principal',
        `Se encontraron ${h1Texts.length} elemento(s) h1.`,
        'Mantén un h1 principal y baja los headings de apoyo a h2/h3.',
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
        'El título principal es demasiado largo',
        `El heading principal tiene ${longHero.length} caracteres.`,
        'Acorta el h1 o mueve el detalle de apoyo al cuerpo de texto.',
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
        'La acción primaria debería ser única',
        `Se encontraron ${primaryActions} botón(es) de acción primaria.`,
        'Mantén un CTA dominante y usa botones secundarios para alternativas.',
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
        'Demasiadas métricas compiten por atención',
        `Se encontraron ${metricCards} tarjetas métricas fuera de un dashboard.`,
        'Elige la métrica que apoya la acción principal y mueve el resto a una zona secundaria.',
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
        'El prototipo tiene poca profundidad modular',
        `Solo se detectaron ${modules} módulos de contenido.`,
        'Añade un estado, cola, panel de evidencia o detalle conectado a la intención UX.',
      ),
    );
  }

  if (tweaks.density === 'dense' && intent.modules.length >= 7) {
    issues.push(
      issue(
        'layout-dense-complex-intent',
        'layout',
        'info',
        'El modo denso con muchos módulos necesita revisión de espaciado',
        `Hay ${intent.modules.length} módulos de intención planificados con densidad alta.`,
        'Revisa tablet/móvil y mueve módulos de baja prioridad a tabs o pantallas de detalle.',
      ),
    );
  }

  if (brief.features.length < 5) {
    issues.push(
      issue(
        'layout-feature-depth',
        'layout',
        'info',
        'El set de funcionalidades es escaso',
        `Solo hay ${brief.features.length} etiquetas de funcionalidad tras planificar la intención.`,
        'Añade restricciones, entidades o estados de usuario al prompt para enriquecer los módulos.',
      ),
    );
  }

  return issues;
}
