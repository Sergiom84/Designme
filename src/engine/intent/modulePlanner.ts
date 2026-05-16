import type { ArtifactType } from '../types';
import type { Domain, ModuleRequirement, ScreenState, UserGoal } from './types';

const commonStates: ScreenState[] = ['default', 'empty', 'loading', 'error'];

function moduleRequirement(
  id: string,
  label: string,
  purpose: string,
  priority: 1 | 2 | 3,
  states: ScreenState[] = ['default', 'review'],
  dataShape?: Record<string, string>,
): ModuleRequirement {
  return { id, label, purpose, priority, states, dataShape };
}

const domainModules: Record<Domain, ModuleRequirement[]> = {
  crm: [
    moduleRequirement('pipeline-stages', 'Pipeline por etapa', 'Mostrar volumen, valor y bloqueo por etapa comercial.', 1, commonStates, {
      stage: 'string',
      value: 'currency',
      blockedDeals: 'number',
    }),
    moduleRequirement('blocked-deals', 'Deals bloqueados', 'Priorizar oportunidades que necesitan intervención.', 1, ['default', 'empty', 'review'], {
      owner: 'string',
      daysIdle: 'number',
      nextAction: 'string',
    }),
    moduleRequirement('forecast-risk', 'Forecast y riesgo', 'Comparar target mensual contra gap y confianza.', 2),
    moduleRequirement('activity-feed', 'Actividad comercial', 'Resumir llamadas, emails y reuniones recientes.', 3),
  ],
  finance: [
    moduleRequirement('revenue-snapshot', 'Ingresos y margen', 'Separar ingreso, coste, margen y tendencia.', 1, commonStates),
    moduleRequirement('fraud-alerts', 'Alertas de fraude', 'Ordenar eventos por severidad y estado de revisión.', 1, ['default', 'review', 'success']),
    moduleRequirement('cohort-health', 'Cohortes y retención', 'Mostrar evolución y segmentos con caída anómala.', 2),
    moduleRequirement('audit-trail', 'Trazabilidad', 'Dejar claro quién aprobó, cuándo y por qué.', 2),
  ],
  health: [
    moduleRequirement('care-priority', 'Prioridad de atención', 'Ordenar casos por urgencia, contexto y siguiente paso.', 1, commonStates),
    moduleRequirement('patient-context', 'Contexto del paciente', 'Mostrar señales relevantes sin saturar.', 1),
    moduleRequirement('follow-up-plan', 'Plan de seguimiento', 'Hacer visible la continuidad del cuidado.', 2),
  ],
  education: [
    moduleRequirement('learning-path', 'Ruta de aprendizaje', 'Mostrar progreso, objetivo y siguiente lección.', 1, commonStates),
    moduleRequirement('practice-loop', 'Práctica guiada', 'Convertir teoría en ejercicios revisables.', 1),
    moduleRequirement('feedback-panel', 'Feedback accionable', 'Explicar qué mejorar y cómo practicarlo.', 2),
  ],
  marketing: [
    moduleRequirement('value-prop', 'Promesa principal', 'Expresar la oferta en una frase accionable.', 1),
    moduleRequirement('proof-system', 'Sistema de prueba', 'Unir métricas, logos, casos o testimonios.', 1),
    moduleRequirement('objection-strip', 'Objeciones clave', 'Responder dudas antes del CTA.', 2),
    moduleRequirement('conversion-path', 'Ruta de conversión', 'Reducir pasos hasta demo, signup o contacto.', 1),
  ],
  design: [
    moduleRequirement('brief-map', 'Mapa de brief', 'Conectar objetivo, audiencia, dirección y restricciones.', 1),
    moduleRequirement('variation-space', 'Espacio de variaciones', 'Comparar rutas visuales sin perder criterio.', 1),
    moduleRequirement('critique-loop', 'Bucle de crítica', 'Transformar observaciones en cambios concretos.', 1, ['default', 'review', 'success']),
    moduleRequirement('handoff-package', 'Handoff del agente', 'Preparar HTML, prompt y notas para continuar.', 2),
  ],
  operations: [
    moduleRequirement('work-queue', 'Cola de trabajo', 'Priorizar tareas por impacto, owner y bloqueo.', 1, commonStates),
    moduleRequirement('sla-board', 'SLA y riesgo', 'Mostrar urgencia real sin ruido.', 1),
    moduleRequirement('decision-log', 'Registro de decisiones', 'Evitar que acuerdos y responsables se pierdan.', 2),
  ],
  productivity: [
    moduleRequirement('daily-focus', 'Foco diario', 'Elegir una acción pequeña y ejecutable.', 1, commonStates),
    moduleRequirement('streak-health', 'Rachas y energía', 'Mostrar progreso sin castigar interrupciones.', 2),
    moduleRequirement('weekly-review', 'Revisión semanal', 'Convertir datos en ajuste de rutina.', 2),
  ],
  generic: [
    moduleRequirement('overview', 'Vista principal', 'Explicar el estado actual y la siguiente acción.', 1, commonStates),
    moduleRequirement('evidence', 'Prueba o evidencia', 'Dar soporte visible a la promesa principal.', 2),
    moduleRequirement('action-panel', 'Panel de acción', 'Dejar claro qué puede hacer el usuario.', 1),
  ],
};

const artifactModules: Partial<Record<ArtifactType, ModuleRequirement[]>> = {
  mobile: [
    moduleRequirement('bottom-navigation', 'Navegación móvil', 'Permitir moverse entre pantallas con targets cómodos.', 1),
    moduleRequirement('detail-screen', 'Pantalla de detalle', 'Dar contexto sin romper el flujo principal.', 2),
  ],
  dashboard: [
    moduleRequirement('metric-stack', 'Stack de métricas', 'Separar métricas de vanidad de señales accionables.', 1),
    moduleRequirement('alert-lane', 'Carril de alertas', 'Hacer visible lo que necesita atención inmediata.', 1),
  ],
  deck: [
    moduleRequirement('narrative-arc', 'Arco narrativo', 'Pasar de tensión a solución, prueba y siguiente paso.', 1),
    moduleRequirement('speaker-notes', 'Notas de presentación', 'Acompañar cada slide con intención verbal.', 2),
  ],
  infographic: [
    moduleRequirement('data-spine', 'Eje de datos', 'Ordenar la explicación alrededor de una progresión legible.', 1),
    moduleRequirement('callout-system', 'Sistema de llamadas', 'Destacar aprendizajes y consecuencias.', 2),
  ],
};

function goalModule(goal: UserGoal): ModuleRequirement {
  const modules: Record<UserGoal, ModuleRequirement> = {
    convert: moduleRequirement('conversion-cta', 'CTA de conversión', 'Cerrar con una acción clara y medible.', 1, ['default', 'success']),
    monitor: moduleRequirement('monitoring-loop', 'Loop de monitorización', 'Pasar de señal a decisión y seguimiento.', 1),
    explain: moduleRequirement('explanation-ladder', 'Escalera explicativa', 'Ir de concepto simple a implicación accionable.', 1),
    coordinate: moduleRequirement('ownership-lanes', 'Líneas de responsabilidad', 'Unir tarea, owner, estado y deadline.', 1),
    decide: moduleRequirement('decision-support', 'Soporte de decisión', 'Comparar opciones, riesgo y recomendación.', 1, ['default', 'review']),
    learn: moduleRequirement('learning-feedback', 'Feedback de aprendizaje', 'Mostrar avance y siguiente práctica.', 2),
    prototype: moduleRequirement('prototype-flow', 'Flujo prototipable', 'Hacer visibles estados y navegación principal.', 1),
  };
  return modules[goal];
}

function uniqueModules(modules: ModuleRequirement[]): ModuleRequirement[] {
  const seen = new Set<string>();
  return modules.filter((module) => {
    if (seen.has(module.id)) return false;
    seen.add(module.id);
    return true;
  });
}

export function planModules(
  domain: Domain,
  goal: UserGoal,
  artifactType: ArtifactType,
): ModuleRequirement[] {
  return uniqueModules([
    ...domainModules[domain],
    goalModule(goal),
    ...(artifactModules[artifactType] ?? []),
  ])
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 8);
}
