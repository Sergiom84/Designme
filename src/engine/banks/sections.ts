import type { ArtifactType } from '../types';

export const sectionBank: Record<ArtifactType, string[]> = {
  software: ['Centro de mando', 'Cola de trabajo', 'Panel de señales', 'Cajón de acciones', 'Trazabilidad'],
  web: ['Primer pantallazo', 'Prueba de producto', 'Casos de uso', 'Flujo', 'Carril de conversión'],
  dashboard: ['Resumen', 'Panel de señales', 'Pipeline', 'Alertas', 'Registro de decisiones'],
  mobile: ['Inicio', 'Captura', 'Detalle', 'Progreso', 'Ajustes'],
  deck: ['Apertura', 'Tensión de mercado', 'Solución', 'Prueba', 'Siguiente paso'],
  infographic: ['Tesis central', 'Eje de datos', 'Comparativa', 'Implicaciones', 'Caja de acción'],
};
