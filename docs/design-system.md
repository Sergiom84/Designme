# Sistema De Diseño

Designme usa tokens internos para que la app y los artefactos generados compartan decisiones visuales sin duplicar colores, radios o escalas.

## Ubicación

```txt
src/design-system/
  README.md
  tokens/
    base.ts
    contrast.ts
    cssVars.ts
    index.ts
    palettes.ts
    themes.ts
    types.ts
```

## Capas

- `base.ts`: escalas base de espaciado, tipografía, radio, sombra y movimiento.
- `palettes.ts`: paletas crudas para sistemas, editorial y cinético.
- `themes.ts`: temas semánticos usados por las direcciones visuales.
- `cssVars.ts`: convierte tokens a custom properties para el HTML generado.
- `contrast.ts`: luminancia relativa, ratio WCAG y helpers de validación.
- `types.ts`: contratos TypeScript de color, tipografía, spacing, radius, motion y tema.

## Direcciones Visuales

Las direcciones viven en `src/engine/options.ts` y apuntan a un `themeId`:

- `systems`: interfaz densa y diaria para dashboards, backoffices y herramientas internas.
- `editorial`: jerarquía fuerte para webs, decks e informes.
- `kinetic`: movimiento medido para apps móviles, demos y prototipos con flujo.

## Cómo Llega Al HTML

1. `buildDesignProject` resuelve la dirección visual.
2. `buildHtml` carga el tema con `getThemeById`.
3. `renderThemeCssVars` genera variables CSS.
4. Los renderizadores consumen esas variables en `src/engine/render/styles/`.

## Contraste

La crítica local no intenta medir todos los colores derivados, pero sí valida el contraste base desde tokens:

- texto vs fondo principal;
- texto de acción vs color de acento;
- aviso manual cuando se usa `color-mix`.

## Reglas Prácticas

- Añade un token antes de hardcodear un valor visual repetido.
- Mantén las direcciones como contrato de intención, no como plantillas cerradas.
- Si una paleta baja contraste, corrige tokens antes de retocar cada renderizador.
- Las variables CSS generadas deben seguir siendo standalone para export HTML.
