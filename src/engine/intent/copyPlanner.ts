import type { ArtifactType } from '../types';
import type { Domain, UserGoal } from './types';

export function primaryActionFor(goal: UserGoal, artifactType: ArtifactType): string {
  if (artifactType === 'deck') return 'Presentar historia';
  if (artifactType === 'infographic') return 'Explorar datos';

  const actions: Record<UserGoal, string> = {
    convert: 'Solicitar demo',
    monitor: 'Revisar señales',
    explain: 'Entender flujo',
    coordinate: 'Asignar siguiente acción',
    decide: 'Tomar decisión',
    learn: 'Continuar práctica',
    prototype: 'Probar prototipo',
  };
  return actions[goal];
}

export function secondaryActionFor(domain: Domain): string {
  const actions: Record<Domain, string> = {
    crm: 'Ver bloqueos',
    finance: 'Abrir auditoría',
    health: 'Revisar seguimiento',
    education: 'Ver progreso',
    marketing: 'Ver prueba',
    design: 'Abrir crítica',
    operations: 'Filtrar responsables',
    productivity: 'Ajustar rutina',
    generic: 'Ver detalles',
  };
  return actions[domain];
}
