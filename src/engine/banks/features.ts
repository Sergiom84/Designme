import type { ArtifactType } from '../types';

export const featureBank: Record<ArtifactType, string[]> = {
  software: [
    'navegación del espacio',
    'tabla de tareas con estado',
    'comentarios de revisión en línea',
    'barra rápida de comandos',
    'panel de archivos listo para exportar',
  ],
  web: [
    'primer pantallazo claro',
    'módulos de prueba',
    'franja de producto interactiva',
    'señal de precios',
    'pie de conversión',
  ],
  dashboard: [
    'tarjetas métricas en vivo',
    'cola de riesgos',
    'gráfico de tendencia',
    'filtros por responsable',
    'resumen de decisiones',
  ],
  mobile: [
    'marco móvil realista',
    'navegación inferior',
    'cambio de pantallas',
    'controles de tamaño táctil',
    'retroalimentación de progreso',
  ],
  deck: [
    'carril de diapositivas',
    'notas de presentación',
    'arco narrativo',
    'diapositiva de prueba visual',
    'etiquetas de sección editables',
  ],
  infographic: [
    'jerarquía de datos',
    'cuadrícula comparativa',
    'etiquetas de llamada',
    'franja de fuentes',
    'ritmo apto para impresión',
  ],
};

export const keywordFeatures: Array<[RegExp, string]> = [
  [/ai|ia|agent|agente|automat/i, 'timeline de actividad del agente'],
  [/crm|ventas|sales|pipeline/i, 'salud del pipeline'],
  [/financ|bank|invoice|factura|pago/i, 'franja de confianza y cumplimiento'],
  [/health|salud|clinic|medic/i, 'marcadores de estado clínico seguro'],
  [/learn|curso|educ|academy|school/i, 'mapa de progresión de aprendizaje'],
  [/market|campaign|landing|growth/i, 'espacios de experimento de campaña'],
  [/design|figma|prototype|prototipo/i, 'checklist de revisión de diseño'],
  [/team|equipo|operac|ops/i, 'líneas de responsabilidad del equipo'],
];
