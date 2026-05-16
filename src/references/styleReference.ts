import type { DesignTweaks, DirectionId } from '../engine/index';
import type { DesignReference, ReferenceAnalysis, ReferencePreferences } from './types';

interface KeywordRule {
  patterns: RegExp[];
  keyword: string;
  directionId?: DirectionId;
  tweaksPatch?: Partial<DesignTweaks>;
  promptHint?: string;
  visualNote?: string;
  riskNote?: string;
}

const keywordRules: KeywordRule[] = [
  {
    patterns: [/editorial/i, /revista/i, /narrativa/i, /informe/i, /tipograf/i],
    keyword: 'editorial',
    directionId: 'editorial',
    promptHint: 'priorizar jerarquía editorial, ritmo tipográfico y narrativa clara',
    visualNote: 'Referencia con lectura editorial y jerarquía marcada.',
  },
  {
    patterns: [/dashboard/i, /backoffice/i, /crm/i, /operac/i, /tabla/i, /denso/i],
    keyword: 'sistemas',
    directionId: 'systems',
    tweaksPatch: { density: 'dense' },
    promptHint: 'usar una interfaz densa, escaneable y preparada para uso diario',
    visualNote: 'Referencia de producto operativo con alta densidad de información.',
  },
  {
    patterns: [/mobile/i, /móvil/i, /app/i, /gesto/i, /anim/i, /flujo/i],
    keyword: 'cinético',
    directionId: 'kinetic',
    tweaksPatch: { motion: 'expressive', showDevice: true },
    promptHint: 'hacer visibles estados, microinteracciones y flujo de pantalla',
    visualNote: 'Referencia con sensación de prototipo vivo y recorrido táctil.',
  },
  {
    patterns: [/oscuro/i, /dark/i, /alto contraste/i, /contrast/i, /negro/i],
    keyword: 'contraste',
    tweaksPatch: { tone: 'contrast' },
    promptHint: 'mantener contraste alto sin perder legibilidad',
    visualNote: 'Referencia con modo oscuro o contraste alto.',
    riskNote: 'Verificar contraste de texto secundario y estados de foco.',
  },
  {
    patterns: [/minimal/i, /limpio/i, /calma/i, /quiet/i, /aire/i],
    keyword: 'calma',
    tweaksPatch: { density: 'calm', motion: 'still' },
    promptHint: 'reducir ruido visual y mantener una composición calmada',
    visualNote: 'Referencia limpia, con respiración y poco ruido visual.',
  },
  {
    patterns: [/redonde/i, /rounded/i, /suave/i, /soft/i],
    keyword: 'suavidad',
    tweaksPatch: { radius: 10 },
    promptHint: 'usar radios suaves sin convertir la interfaz en una landing decorativa',
    visualNote: 'Referencia con esquinas suaves y sensación amable.',
  },
  {
    patterns: [/enterprise/i, /serio/i, /sobrio/i, /datos/i, /control/i],
    keyword: 'enterprise',
    directionId: 'systems',
    tweaksPatch: { density: 'balanced', motion: 'measured' },
    promptHint: 'mantener tono sobrio, controles previsibles y foco en decisiones',
    visualNote: 'Referencia sobria orientada a equipos profesionales.',
  },
];

function compact(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function mergeTweaks(current: Partial<DesignTweaks>, patch?: Partial<DesignTweaks>): Partial<DesignTweaks> {
  return patch ? { ...current, ...patch } : current;
}

function bestDirection(matches: KeywordRule[]): DirectionId | undefined {
  const counts = matches.reduce<Partial<Record<DirectionId, number>>>((acc, rule) => {
    if (!rule.directionId) return acc;
    acc[rule.directionId] = (acc[rule.directionId] ?? 0) + 1;
    return acc;
  }, {});
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as DirectionId | undefined) ?? undefined;
}

export function referenceFromNotes(notes: string, now = new Date().toISOString()): DesignReference | undefined {
  const content = compact(notes);
  if (!content) return undefined;
  return {
    id: `ref-${now}`,
    kind: 'visual-notes',
    title: 'Referencia local',
    content,
    createdAt: now,
  };
}

export function analyzeReferences(references: DesignReference[]): ReferenceAnalysis {
  const source = references.map((reference) => reference.content).join('\n');
  const matches = keywordRules.filter((rule) => rule.patterns.some((pattern) => pattern.test(source)));
  const preferences: ReferencePreferences = {
    directionId: bestDirection(matches),
    tweaksPatch: matches.reduce<Partial<DesignTweaks>>((acc, rule) => mergeTweaks(acc, rule.tweaksPatch), {}),
    promptHints: unique(matches.map((rule) => rule.promptHint ?? '')),
    visualNotes: unique(matches.map((rule) => rule.visualNote ?? '')),
    riskNotes: unique(matches.map((rule) => rule.riskNote ?? '')),
  };
  const keywords = unique(matches.map((rule) => rule.keyword));
  const summary =
    keywords.length > 0
      ? `Referencia detectada: ${keywords.join(', ')}.`
      : references.length > 0
        ? 'Referencia guardada sin sesgo visual dominante.'
        : 'Sin referencia activa.';

  return {
    references,
    summary,
    keywords,
    preferences,
  };
}

export function analyzeReferenceNotes(notes: string): ReferenceAnalysis {
  const reference = referenceFromNotes(notes);
  return analyzeReferences(reference ? [reference] : []);
}

export function buildReferenceContext(analysis: ReferenceAnalysis): string {
  if (analysis.references.length === 0) return '';

  const lines = [
    'Referencia local del usuario:',
    analysis.references.map((reference) => `- ${reference.content}`).join('\n'),
    analysis.preferences.promptHints.length > 0
      ? `Preferencias inferidas: ${analysis.preferences.promptHints.join('; ')}.`
      : '',
    analysis.preferences.riskNotes.length > 0 ? `Cuidado: ${analysis.preferences.riskNotes.join(' ')}` : '',
  ].filter(Boolean);

  return lines.join('\n');
}
