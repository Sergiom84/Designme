import { buildStandaloneHtml } from './buildStandaloneHtml';
import { createManifest } from './createManifest';
import type { ExportBundle, ExportBundleBuildInput } from './types';

function extractTagContent(html: string, tag: 'style' | 'script'): string {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function buildLinkedIndexHtml(html: string): string {
  return html
    .replace(/<style>[\s\S]*?<\/style>/i, '<link rel="stylesheet" href="./styles.css">')
    .replace(/<script>[\s\S]*?<\/script>/i, '<script src="./script.js"></script>');
}

function buildHandoffMarkdown(bundle: ExportBundle): string {
  const { manifest } = bundle;
  return [
    `# ${manifest.name}`,
    '',
    '## Contexto',
    '',
    `- Artefacto: ${manifest.artifactType}`,
    `- Dirección: ${manifest.directionId}`,
    `- Tema: ${manifest.themeId}`,
    `- Creado: ${manifest.createdAt}`,
    `- Puntuación de calidad: ${manifest.quality.total}/10`,
    '',
    '## Brief',
    '',
    manifest.brief.prompt,
    '',
    '## Intención UX',
    '',
    `- Dominio: ${manifest.intent.domain}`,
    `- Objetivo: ${manifest.intent.goal}`,
    `- Acción primaria: ${manifest.intent.primaryAction}`,
    '',
    '## Módulos planificados',
    '',
    ...manifest.intent.modules.map((module) => `- ${module.label}: ${module.purpose}`),
    '',
    '## Incidencias de calidad',
    '',
    ...(manifest.quality.issues.length > 0
      ? manifest.quality.issues.map((issue) => `- [${issue.severity}] ${issue.title}: ${issue.suggestedFix}`)
      : ['- El analizador local no encontró incidencias bloqueantes.']),
    '',
    '## Referencias E IA',
    '',
    manifest.references?.used
      ? `- Referencias usadas: ${manifest.references.count}. ${manifest.references.summary}`
      : '- Referencias usadas: no.',
    manifest.references?.keywords.length ? `- Rasgos detectados: ${manifest.references.keywords.join(', ')}` : '',
    manifest.ai ? `- IA/proveedor: ${manifest.ai.providerId} (${manifest.ai.localOnly ? 'local' : 'externo'}), usado=${manifest.ai.used}` : '- IA/proveedor: no usado.',
    '',
    '## Continuar en un agente',
    '',
    bundle.files['README.md'],
  ].join('\n');
}

function buildBundleReadme(manifestName: string): string {
  return [
    `# Exportación de ${manifestName}`,
    '',
    'Esta carpeta fue generada por Designme Studio.',
    '',
    '- Abre `index.html` directamente en un navegador. No requiere servidor.',
    '- Edita `styles.css` y `script.js` para iterar rápido.',
    '- Lee `designme.json` para ver prompt, intención, ajustes, dirección y metadata de calidad.',
    '- Usa `handoff.md` como contexto para Codex, Claude u otro agente de diseño/desarrollo.',
  ].join('\n');
}

export function buildExportBundle(input: ExportBundleBuildInput): ExportBundle {
  const html = buildStandaloneHtml(input.output);
  const manifest = createManifest(input);
  const readme = buildBundleReadme(input.output.name);
  const bundle: ExportBundle = {
    name: input.output.exportName,
    manifest,
    files: {
      'index.html': buildLinkedIndexHtml(html),
      'styles.css': extractTagContent(html, 'style'),
      'script.js': extractTagContent(html, 'script'),
      'designme.json': JSON.stringify(manifest, null, 2),
      'handoff.md': '',
      'README.md': readme,
    },
  };

  bundle.files['handoff.md'] = buildHandoffMarkdown(bundle);
  return bundle;
}
