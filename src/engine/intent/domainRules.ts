import type { Domain, UserGoal } from './types';

interface DomainRule {
  domain: Domain;
  label: string;
  patterns: RegExp[];
  mentalModel: string;
  risks: string[];
}

export const domainRules: DomainRule[] = [
  {
    domain: 'crm',
    label: 'CRM / ventas',
    patterns: [/crm/i, /ventas/i, /sales/i, /pipeline/i, /deals?/i, /leads?/i],
    mentalModel: 'Pipeline, responsables, bloqueos y siguiente acción comercial.',
    risks: ['No esconder deals bloqueados detrás de métricas agregadas.', 'Mostrar responsable y urgencia junto a cada riesgo.'],
  },
  {
    domain: 'finance',
    label: 'Finanzas',
    patterns: [/fintech/i, /financ/i, /bank/i, /ingresos/i, /fraude/i, /factura/i, /pago/i],
    mentalModel: 'Confianza, trazabilidad, riesgo y conciliación de datos.',
    risks: ['Diferenciar alertas críticas de simples variaciones.', 'Evitar ambigüedad en importes, fechas y estados.'],
  },
  {
    domain: 'health',
    label: 'Salud',
    patterns: [/salud/i, /health/i, /clinic/i, /paciente/i, /médic/i, /medic/i],
    mentalModel: 'Prioridad clínica, seguridad, seguimiento y contexto humano.',
    risks: ['No usar lenguaje alarmista sin jerarquía.', 'Separar información crítica de apoyo administrativo.'],
  },
  {
    domain: 'education',
    label: 'Educación',
    patterns: [/curso/i, /learn/i, /educ/i, /academy/i, /school/i, /clase/i],
    mentalModel: 'Progreso, comprensión, práctica y siguiente lección.',
    risks: ['Evitar pantallas llenas de contenido sin progreso visible.', 'Explicar el siguiente paso de aprendizaje.'],
  },
  {
    domain: 'marketing',
    label: 'Marketing',
    patterns: [/marketing/i, /campaign/i, /landing/i, /growth/i, /lead/i, /convers/i],
    mentalModel: 'Promesa, prueba, objeciones y conversión.',
    risks: ['No abrir con claims genéricos.', 'Conectar prueba visual con llamada a la acción.'],
  },
  {
    domain: 'design',
    label: 'Diseño',
    patterns: [/diseñ/i, /disen/i, /design/i, /figma/i, /prototype/i, /prototipo/i],
    mentalModel: 'Brief, variaciones, crítica, handoff y revisión iterativa.',
    risks: ['No confundir exploración con configuración infinita.', 'Mantener visible el criterio detrás de cada variación.'],
  },
  {
    domain: 'operations',
    label: 'Operaciones',
    patterns: [/ops/i, /operac/i, /equipo/i, /team/i, /workflow/i, /tarea/i, /task/i],
    mentalModel: 'Colas de trabajo, responsabilidad, SLA y desbloqueo.',
    risks: ['No separar la tarea de su responsable.', 'Distinguir pendientes de decisiones bloqueadas.'],
  },
  {
    domain: 'productivity',
    label: 'Productividad',
    patterns: [/hábito/i, /habito/i, /focus/i, /foco/i, /productiv/i, /racha/i, /pomodoro/i],
    mentalModel: 'Captura rápida, foco, progreso y ritual diario.',
    risks: ['Evitar métricas que culpabilicen al usuario.', 'Dar una acción pequeña y clara en cada estado.'],
  },
];

export const domainLabels: Record<Domain, string> = {
  crm: 'CRM / ventas',
  finance: 'Finanzas',
  health: 'Salud',
  education: 'Educación',
  marketing: 'Marketing',
  design: 'Diseño',
  operations: 'Operaciones',
  productivity: 'Productividad',
  generic: 'General',
};

export const goalLabels: Record<UserGoal, string> = {
  convert: 'Convertir',
  monitor: 'Monitorizar',
  explain: 'Explicar',
  coordinate: 'Coordinar',
  decide: 'Decidir',
  learn: 'Aprender',
  prototype: 'Prototipar',
};

export function detectDomain(prompt: string): Domain {
  return domainRules.find((rule) => rule.patterns.some((pattern) => pattern.test(prompt)))?.domain ?? 'generic';
}

export function mentalModelForDomain(domain: Domain): string {
  return domainRules.find((rule) => rule.domain === domain)?.mentalModel ?? 'Objetivo, contenido, estado y siguiente acción.';
}

export function riskNotesForDomain(domain: Domain): string[] {
  return domainRules.find((rule) => rule.domain === domain)?.risks ?? [
    'Evitar módulos genéricos sin relación con el objetivo del usuario.',
    'Mostrar claramente qué acción debería ocurrir después.',
  ];
}

export function detectGoal(prompt: string, objective: string): UserGoal {
  const source = `${prompt} ${objective}`;
  if (/vender|convert|lead|demo|signup|registro|conversion|conversión/i.test(source)) return 'convert';
  if (/monitor|metric|kpi|seguimiento|control|dashboard|alert/i.test(source)) return 'monitor';
  if (/decidir|decision|decisión|prioridad|riesgo|risk/i.test(source)) return 'decide';
  if (/explicar|teach|curso|aprender|understand|infograf/i.test(source)) return 'explain';
  if (/organizar|coordinar|workflow|tarea|task|equipo/i.test(source)) return 'coordinate';
  if (/learn|curso|clase|educ|racha|hábito|habito/i.test(source)) return 'learn';
  return 'prototype';
}
