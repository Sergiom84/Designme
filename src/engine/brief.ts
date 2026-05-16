import { featureBank, keywordFeatures } from './banks/features';
import { sectionBank } from './banks/sections';
import type { ArtifactType, DerivedBrief } from './types';
import { stripNoise, titleCase } from './utils';

const fallbackPrompts: Record<ArtifactType, string> = {
  software:
    'Un estudio para planificar, generar y revisar pantallas de software para equipos de producto.',
  web: 'Una web de producto para presentar una herramienta nueva y convertir visitantes en demos.',
  dashboard: 'Un dashboard ejecutivo para ver actividad, riesgos y siguientes acciones.',
  mobile: 'Una app móvil de productividad con onboarding, foco y seguimiento semanal.',
  deck: 'Un deck de lanzamiento para explicar una idea compleja con claridad y ritmo visual.',
  infographic: 'Una infografía que convierte datos dispersos en una historia visual accionable.',
};

function extractName(prompt: string, type: ArtifactType): string {
  const quoted = prompt.match(/["'`](.{3,64})["'`]/);
  if (quoted?.[1]) return titleCase(quoted[1]);

  if (/\b(disenador|diseñador|designer)\b/i.test(prompt)) {
    return 'Designme Studio';
  }

  const named = prompt.match(
    /\b(?:para|for|llamado|called|sobre|de)\s+([\p{L}0-9][\p{L}0-9 &.-]{2,58})/iu,
  );
  if (named?.[1]) {
    const cleaned = named[1].split(/[,.!?;:]/)[0];
    if (!/^(apps?|software|webs?|sitio|producto|herramienta|dashboard|panel)\b/i.test(cleaned)) {
      return titleCase(cleaned);
    }
  }

  const fallbacks: Record<ArtifactType, string> = {
    software: 'Designme OS',
    web: 'Designme Web',
    dashboard: 'Signal Desk',
    mobile: 'Focus App',
    deck: 'Launch Narrative',
    infographic: 'Signal Map',
  };
  return fallbacks[type];
}

function inferAudience(prompt: string, type: ArtifactType): string {
  if (/developer|dev|api|engineer|program/i.test(prompt)) return 'equipos técnicos';
  if (/ceo|founder|director|executive|ejecut/i.test(prompt)) return 'decision makers';
  if (/cliente|customer|usuario|consumer/i.test(prompt)) return 'usuarios finales';
  if (/sales|ventas|marketing|growth/i.test(prompt)) return 'equipos comerciales';
  if (type === 'dashboard' || type === 'software') return 'equipos operativos';
  return 'personas que necesitan entender rápido';
}

function inferObjective(prompt: string, type: ArtifactType): string {
  if (/vender|convert|lead|demo|signup|registro/i.test(prompt)) return 'convertir interés en acción';
  if (/monitor|metric|kpi|seguimiento|control/i.test(prompt)) return 'hacer visible el estado real';
  if (/explicar|teach|curso|aprender|understand/i.test(prompt)) return 'explicar sin perder precisión';
  if (/organizar|plan|task|tarea|workflow/i.test(prompt)) return 'coordinar trabajo sin fricción';
  if (type === 'deck') return 'defender una narrativa con pruebas';
  return 'pasar de idea vaga a prototipo revisable';
}

export function deriveBrief(prompt: string, artifactType: ArtifactType): DerivedBrief {
  const rawPrompt = stripNoise(prompt) || fallbackPrompts[artifactType];
  const name = extractName(rawPrompt, artifactType);
  const topic = rawPrompt.length > 150 ? `${rawPrompt.slice(0, 147)}...` : rawPrompt;
  const audience = inferAudience(rawPrompt, artifactType);
  const objective = inferObjective(rawPrompt, artifactType);
  const sections = sectionBank[artifactType];
  const featureSet = new Set(featureBank[artifactType]);

  for (const [pattern, feature] of keywordFeatures) {
    if (pattern.test(rawPrompt)) featureSet.add(feature);
  }

  return {
    rawPrompt,
    name,
    topic,
    audience,
    objective,
    sections,
    features: Array.from(featureSet).slice(0, 8),
  };
}
