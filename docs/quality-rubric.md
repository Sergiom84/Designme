# Rúbrica De Calidad

Designme puntúa artefactos generados con reglas deterministas locales. La crítica no reemplaza una revisión humana, pero detecta problemas frecuentes antes de exportar o hacer handoff.

## Categorías

- Accesibilidad: botones nombrados, foco visible, navegación etiquetada y estado en controles segmentados.
- Contraste: checks de token texto/fondo y avisos manuales para colores mezclados.
- Jerarquía: número de `h1`, longitud del título, acción primaria y competencia entre métricas.
- Layout: profundidad modular, riesgo por densidad y riqueza de features.
- Copy: frases genéricas, verbos débiles y acción primaria ausente.
- Exportación: doctype, viewport y metadatos UX.

## Severidad

- Error: corregir antes de considerar usable el export.
- Advertencia: corregir antes de pulido visual o revisión externa.
- Info: chequeo manual útil o mejora futura.

## Puntuación

`src/quality/scoring.ts` resta penalizaciones por severidad y agrupa resultados en:

- Accesibilidad;
- Contraste;
- Jerarquía;
- Copy;
- Exportación.

La puntuación total es un promedio conservador. No mide gusto visual; mide riesgos verificables.

## Qué Produce La Crítica

- `scores`: buckets numéricos.
- `issues`: incidencias ordenadas por severidad.
- `keep`: decisiones que conviene conservar.
- `fix`: correcciones prioritarias.
- `quickWins`: checks manuales rápidos.

## Cómo Añadir Una Regla

1. Añade la regla en `src/quality/`.
2. Usa una categoría existente de `src/quality/types.ts`.
3. Devuelve `id`, `severity`, `title`, `detail`, `suggestedFix` y selector si aplica.
4. Ajusta tests unitarios si cambia el comportamiento esperado.

## Relación Con La UI

La pestaña `Crítica` muestra:

- puntuación total;
- medidores por categoría;
- número de incidencias;
- hasta 8 issues priorizadas;
- bloques de conservar, corregir y mejoras rápidas.

El botón de copiar genera un resumen textual con puntuaciones, incidencias y correcciones.

## Relación Con Export

El reporte completo entra en `designme.json` dentro del paquete exportado. Así otro agente puede continuar con contexto de calidad, no solo con el HTML.
