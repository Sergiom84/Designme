import type { ArtifactOption, DesignDirection, DesignTweaks, DirectionId } from './types';

export const artifactOptions: ArtifactOption[] = [
  { id: 'software', label: 'Software', hint: 'B2B, SaaS, CRM, ops tools' },
  { id: 'web', label: 'Web', hint: 'Homepage, docs, product page' },
  { id: 'dashboard', label: 'Dashboard', hint: 'Metrics, pipelines, monitoring' },
  { id: 'mobile', label: 'App', hint: 'iOS or Android prototype' },
  { id: 'deck', label: 'Slides', hint: 'Pitch, keynote, sales deck' },
  { id: 'infographic', label: 'Info', hint: 'Explainer, report, visual data' },
];

export const designDirections: DesignDirection[] = [
  {
    id: 'systems',
    name: 'Sistema operativo',
    school: 'Producto local-first',
    promise: 'Interfaz densa, clara y preparada para uso diario.',
    bestFor: 'Dashboards, backoffices, CRMs, herramientas internas.',
    themeId: 'systems',
  },
  {
    id: 'editorial',
    name: 'Editorial funcional',
    school: 'Información con pulso',
    promise: 'Jerarquía fuerte, ritmo tipográfico y narrativa visible.',
    bestFor: 'Webs, decks, informes, productos que necesitan explicar.',
    themeId: 'editorial',
  },
  {
    id: 'kinetic',
    name: 'Prototipo cinético',
    school: 'Movimiento medido',
    promise: 'Estados vivos, microinteracciones y sensación de producto real.',
    bestFor: 'Apps móviles, demos, launch screens y prototipos con flujo.',
    themeId: 'kinetic',
  },
];

export const defaultTweaks: DesignTweaks = {
  density: 'balanced',
  tone: 'light',
  motion: 'measured',
  radius: 6,
  showDevice: true,
};

export function directionById(id: DirectionId): DesignDirection {
  return designDirections.find((direction) => direction.id === id) ?? designDirections[0];
}
