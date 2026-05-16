import type { ArtifactType } from '../types';

export const featureBank: Record<ArtifactType, string[]> = {
  software: [
    'workspace navigation',
    'stateful task table',
    'inline review comments',
    'quick command bar',
    'export-ready file panel',
  ],
  web: [
    'clear first viewport',
    'proof modules',
    'interactive product strip',
    'pricing signal',
    'conversion footer',
  ],
  dashboard: [
    'live metric cards',
    'risk queue',
    'trend chart',
    'owner filters',
    'decision summary',
  ],
  mobile: [
    'realistic phone frame',
    'bottom navigation',
    'screen switching',
    'gesture-sized controls',
    'progress feedback',
  ],
  deck: [
    'slide rail',
    'speaker notes',
    'narrative arc',
    'visual proof slide',
    'editable section labels',
  ],
  infographic: [
    'data hierarchy',
    'comparison grid',
    'callout labels',
    'source strip',
    'print-friendly rhythm',
  ],
};

export const keywordFeatures: Array<[RegExp, string]> = [
  [/ai|ia|agent|agente|automat/i, 'agent activity timeline'],
  [/crm|ventas|sales|pipeline/i, 'pipeline health view'],
  [/financ|bank|invoice|factura|pago/i, 'trust and compliance strip'],
  [/health|salud|clinic|medic/i, 'care-safe status markers'],
  [/learn|curso|educ|academy|school/i, 'learning progression map'],
  [/market|campaign|landing|growth/i, 'campaign experiment slots'],
  [/design|figma|prototype|prototipo/i, 'design review checklist'],
  [/team|equipo|operac|ops/i, 'team ownership lanes'],
];
