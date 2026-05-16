import { domainLabels, goalLabels } from './intent/domainRules';
import type { UXIntent } from './intent/types';
import type { ArtifactType, DerivedBrief, DesignDirection, DesignTweaks } from './types';

export function buildHandoffPrompt(
  brief: DerivedBrief,
  type: ArtifactType,
  direction: DesignDirection,
  tweaks: DesignTweaks,
  intent: UXIntent,
): string {
  return [
    'Actúa como diseñador senior de producto y frontend.',
    '',
    `Brief: ${brief.rawPrompt}`,
    `Artefacto: ${type}`,
    `Nombre provisional: ${brief.name}`,
    `Audiencia: ${brief.audience}`,
    `Objetivo: ${brief.objective}`,
    `Dominio detectado: ${domainLabels[intent.domain]}`,
    `Objetivo UX detectado: ${goalLabels[intent.goal]}`,
    `Acción primaria: ${intent.primaryAction}`,
    `Estados requeridos: ${intent.requiredStates.join(', ')}`,
    `Dirección visual: ${direction.name} (${direction.school})`,
    `Tweaks: density=${tweaks.density}, tone=${tweaks.tone}, motion=${tweaks.motion}, radius=${tweaks.radius}px`,
    '',
    'Entrega un prototipo HTML/CSS/JS standalone, responsive, con estados interactivos reales, texto listo para revisar, y un pequeño panel de tweaks persistente en localStorage.',
    'Evita una landing genérica si el brief pide software: construye la pantalla utilizable. Usa jerarquía clara, controles esperables, y deja notas breves solo donde ayuden a iterar.',
    '',
    `Módulos planificados por Designme Studio: ${intent.modules.map((module) => `${module.label} (${module.purpose})`).join('; ')}.`,
    `Notas de riesgo UX: ${intent.riskNotes.join(' ')}`,
  ].join('\n');
}
