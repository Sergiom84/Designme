# Plan de mejora de Designme Studio

**Proyecto:** `Sergiom84/Designme`  
**Fecha:** 2026-05-16  
**Objetivo:** subir Designme de un MVP funcional a una herramienta local-first de diseño más sólida, consistente, accesible, segura y mantenible.  
**Formato recomendado de trabajo:** implementar por fases, en PRs pequeños, validando `npm run typecheck` y `npm run build` al cerrar cada fase.

---

## 0. Diagnóstico resumido

### Lo que ya existe

| Zona | Archivo actual | Responsabilidad actual |
|---|---|---|
| Motor de generación | `src/engine.ts` | Tipos principales, opciones de artefacto, direcciones visuales, prompt parsing básico, bancos de secciones/features, render HTML/CSS/JS, crítica, handoff prompt. |
| App React | `src/App.tsx` | Estado de prompt, tipo de artefacto, dirección, tweaks, preview, versiones, export HTML, inspector lateral. |
| Estilos de app | `src/styles.css` | Shell de 3 columnas, paneles, toolbar, iframe, tabs, cards, controls, responsive parcial. |
| Tipos globales | `src/vite-env.d.ts` | Tipado del bridge `window.designme`. |
| Electron main | `electron/main.cjs` | Ventana principal, export HTML, abrir carpeta exports. |
| Electron preload | `electron/preload.cjs` | Exposición de `exportHtml`, `openExports`, `copyText`. |
| Scripts/deps | `package.json` | Vite + React + Electron + TypeScript + electron-builder. Sin framework de tests ni linting. |
| Documentación | `README.md` | Uso básico, build, packaging, explicación conceptual. |

### Problemas principales a corregir

1. **Demasiada lógica concentrada en `src/engine.ts`.** El archivo mezcla dominio, render, CSS, crítica y handoff.
2. **Diseño generado basado en plantillas cerradas.** Hay buenos conceptos, pero poca variación estructural real.
3. **Crítica poco verificable.** La puntuación actual es heurística simple, no mide contraste, accesibilidad, foco, targets, semántica ni densidad real.
4. **Sistema visual no centralizado.** Hay colores, radios, sombras, gaps y tokens dispersos entre el motor y `styles.css`.
5. **Responsive de la app limitado.** La shell usa anchuras rígidas y `body { min-width: 980px; overflow: hidden; }`.
6. **Seguridad Electron mejorable.** La base es buena —`contextIsolation: true`, `nodeIntegration: false`—, pero falta CSP, sandbox explícito, bloqueo de navegación y validación fuerte de IPC.
7. **Exportación demasiado simple.** Exportar solo un HTML standalone es útil, pero para calidad alta conviene exportar bundle con metadata, tokens y handoff.
8. **Falta infraestructura de tests.** No hay tests de motor, contraste, exportación, accesibilidad ni responsive.

---

## 1. Principios guía

Estos principios deben orientar todas las fases:

1. **Primero calidad determinista, después IA.** Antes de conectar modelos, el motor local debe generar estructuras limpias, consistentes y revisables.
2. **Tokens antes que plantillas.** Si los tokens son buenos, cada plantilla mejora. Si los tokens son pobres, añadir plantillas solo multiplica inconsistencias.
3. **Crítica medible.** La pestaña de crítica debe señalar problemas comprobables, no solo opiniones.
4. **Diseño como producto real.** Cada artefacto debe incluir estados, microcopy, acciones, densidad, navegación y jerarquía creíbles.
5. **Export útil para continuar.** El usuario debe poder llevarse HTML, CSS, JS, metadata y prompt de handoff.
6. **Local-first y seguro.** Mantener la ventaja de privacidad/offline sin abrir agujeros en Electron o en el iframe de preview.

---

## 2. Fuentes externas usadas para definir criterios

> Estas fuentes no obligan a copiar su implementación, pero sí ayudan a definir estándares y dirección de calidad.

| Tema | Fuente | Uso en este plan |
|---|---|---|
| Accesibilidad web | WCAG 2.2 / W3C | Contraste, foco visible, target size, labels, reflow, navegación por teclado. |
| WAI-ARIA | WAI-ARIA Authoring Practices | Patrones para tabs, estados seleccionados, nombres accesibles y navegación por teclado. |
| Seguridad web | Content Security Policy | Reducir riesgo de XSS, clickjacking y ejecución de contenido no autorizado. |
| Seguridad Electron | Electron Security Tutorial | Sandbox, contextIsolation, nodeIntegration, CSP, navegación, IPC validado. |
| Design systems | W3C Design Tokens Community Group / Style Dictionary / Material Design tokens | Separar decisiones visuales en tokens reutilizables. |
| UI-to-code | WebSight, Pix2Struct, DCGen | Inspiración para separar generación en briefing, layout, segmentos y render. |
| Componentes accesibles | shadcn/ui, Radix UI, React Aria | Inspiración para arquitectura de componentes, no necesariamente dependencia. |

URLs de referencia:

- https://www.w3.org/TR/WCAG22/
- https://www.w3.org/WAI/ARIA/apg/
- https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe
- https://www.electronjs.org/docs/latest/tutorial/security
- https://github.com/shadcn-ui/ui
- https://github.com/abi/screenshot-to-code
- https://arxiv.org/abs/2403.09029
- https://arxiv.org/abs/2406.16386

---

# Fase 0 — Preparación, baseline y reglas de trabajo

## Objetivo

Crear una base para poder cambiar sin romper. Antes de tocar el motor conviene medir el estado inicial, añadir scripts mínimos y documentar el comportamiento esperado.

## Resultado esperado

- Se puede ejecutar build/typecheck sin errores.
- Existe una carpeta `docs/` con este plan y criterios de calidad.
- Existe una pequeña matriz de ejemplos manuales para comparar antes/después.
- Se define una lista de prompts de regresión.

## Archivos afectados

| Acción | Ruta | Detalle |
|---|---|---|
| Modificar | `README.md` | Añadir sección “Roadmap de calidad” y link al plan. |
| Modificar | `package.json` | Añadir scripts de validación cuando se instalen tests en fases posteriores. En esta fase se puede dejar preparado sin dependencias nuevas. |
| Crear | `docs/PLAN_MEJORAS_DESIGNME.md` | Este documento dentro del repo. |
| Crear | `docs/quality/baseline-prompts.md` | Prompts fijos para revisar cada cambio. |
| Crear | `docs/quality/acceptance-checklist.md` | Checklist común para cada fase. |
| Crear | `docs/quality/screenshots/` | Carpeta para capturas manuales antes/después. |

## Prompts de baseline recomendados

Crear `docs/quality/baseline-prompts.md`:

```md
# Baseline prompts

## Software
Dashboard para un CRM de ventas B2B con pipeline, riesgos, deals bloqueados y siguientes acciones.

## Web
Web de producto para una herramienta de IA que convierte reuniones en tareas verificables.

## Dashboard
Dashboard ejecutivo para una fintech: ingresos, fraude, alertas, cohortes y decisiones pendientes.

## Mobile
App móvil de hábitos para fundadores ocupados con foco diario, rachas y revisión semanal.

## Deck
Deck de lanzamiento para explicar una plataforma local-first de diseño con agentes.

## Infographic
Infografía sobre cómo reducir deuda técnica en equipos pequeños de producto.
```

## Checklist de aceptación

Crear `docs/quality/acceptance-checklist.md`:

```md
# Acceptance checklist

Para cerrar cada fase:

- [ ] `npm run typecheck` pasa.
- [ ] `npm run build` pasa.
- [ ] Los 6 baseline prompts siguen generando salida.
- [ ] No se pierde export HTML web.
- [ ] No se pierde export HTML desktop.
- [ ] No se rompe localStorage de prompt/tweaks/versiones.
- [ ] El preview desktop/tablet/mobile sigue funcionando.
- [ ] Los cambios están descritos en README o docs.
```

## Criterios de no-regresión

- No introducir API externa obligatoria.
- No eliminar export standalone HTML.
- No eliminar el handoff prompt.
- No convertirlo en una app solo cloud.
- No mezclar fases si no es necesario.

---

# Fase 1 — Sistema de diseño interno: tokens, temas y escalas

## Objetivo

Sacar colores, tipografía, radios, sombras, espaciado, movimiento y densidad de los strings HTML/CSS y convertirlos en un sistema de tokens tipado.

Ahora el motor tiene paletas dentro de `designDirections` y el CSS generado define muchas variables inline. La app también tiene colores hardcodeados en `src/styles.css`. Esta fase centraliza esas decisiones.

## Archivos nuevos

| Ruta nueva | Responsabilidad |
|---|---|
| `src/design-system/tokens/types.ts` | Tipos de tokens: color, spacing, typography, radius, shadow, motion, density. |
| `src/design-system/tokens/base.ts` | Escalas base: spacing, fontSize, lineHeight, radius, shadow, duration, easing. |
| `src/design-system/tokens/palettes.ts` | Paletas crudas: systems, editorial, kinetic. |
| `src/design-system/tokens/themes.ts` | Construcción de temas semánticos desde paletas. |
| `src/design-system/tokens/cssVars.ts` | Funciones para convertir tokens a CSS custom properties. |
| `src/design-system/tokens/contrast.ts` | Utilidades de contraste, luminancia relativa y validación. |
| `src/design-system/tokens/index.ts` | Barrel export. |
| `src/design-system/README.md` | Documentación de tokens y decisiones. |

## Archivos afectados

| Ruta | Cambio |
|---|---|
| `src/engine.ts` | Dejar de definir paletas completas dentro del motor o reducirlas a IDs. Importar temas desde `src/design-system/tokens`. |
| `src/styles.css` | Sustituir colores hardcodeados por variables globales: `--app-bg`, `--app-surface`, `--app-text`, etc. |
| `src/App.tsx` | Usar tokens/tema para swatches y metadatos de dirección visual. |

## Estructura propuesta

```txt
src/
  design-system/
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

## Tipos recomendados

```ts
// src/design-system/tokens/types.ts
export type ColorRole =
  | 'background'
  | 'surface'
  | 'surfaceRaised'
  | 'text'
  | 'textMuted'
  | 'border'
  | 'accent'
  | 'accentText'
  | 'secondary'
  | 'highlight'
  | 'danger'
  | 'success'
  | 'warning'
  | 'focusRing';

export interface ColorTokens {
  [role: string]: string;
}

export interface TypographyTokens {
  familySans: string;
  familyMono: string;
  size: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'display', string>;
  lineHeight: Record<'tight' | 'normal' | 'relaxed', string>;
  weight: Record<'regular' | 'medium' | 'semibold' | 'bold' | 'black', number>;
}

export interface SpacingTokens {
  scale: Record<'0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16', string>;
}

export interface RadiusTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  round: string;
}

export interface MotionTokens {
  still: string;
  fast: string;
  normal: string;
  expressive: string;
  easingStandard: string;
  easingEmphasized: string;
}

export interface DesignTheme {
  id: string;
  name: string;
  color: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  motion: MotionTokens;
}
```

## Cambios concretos en `src/engine.ts`

### Antes

`designDirections` contiene directamente:

```ts
palette: {
  ink: '#17191c',
  paper: '#f5f1e8',
  surface: '#fffdf8',
  subtle: '#dfd8c8',
  accent: '#0f766e',
  secondary: '#be5b3d',
  highlight: '#d9b84f',
}
```

### Después

`DesignDirection` debe apuntar a `themeId` o a un tema derivado:

```ts
export interface DesignDirection {
  id: DirectionId;
  name: string;
  school: string;
  promise: string;
  bestFor: string;
  themeId: 'systems' | 'editorial' | 'kinetic';
}
```

Y en el build:

```ts
import { getThemeById, renderThemeCssVars } from './design-system/tokens';

const theme = getThemeById(direction.themeId);
const cssVars = renderThemeCssVars(theme, tweaks);
```

## Cambios concretos en `src/styles.css`

### Crear variables de app

Al inicio de `src/styles.css`:

```css
:root {
  --app-bg: #f4efe6;
  --app-surface: #fffdf8;
  --app-surface-muted: #f7f3ea;
  --app-text: #191b1f;
  --app-text-muted: #6b655b;
  --app-border: rgba(25, 27, 31, 0.13);
  --app-accent: #0f766e;
  --app-accent-soft: rgba(15, 118, 110, 0.1);
  --app-focus: rgba(15, 118, 110, 0.45);
  --app-radius-sm: 6px;
  --app-radius-md: 8px;
  --app-shadow-lg: 0 24px 80px rgba(20, 20, 20, 0.12);
}
```

Luego reemplazar valores repetidos:

- `#191b1f` → `var(--app-text)`
- `#fffdf8` → `var(--app-surface)`
- `#0f766e` → `var(--app-accent)`
- `rgba(25, 27, 31, 0.13)` → `var(--app-border)`
- `8px` como radio principal → `var(--app-radius-md)`

## Criterios de aceptación

- `src/engine.ts` queda menos dependiente de colores hardcodeados.
- Los colores de app se controlan desde variables.
- Las direcciones visuales siguen funcionando.
- El export HTML sigue incluyendo CSS completo standalone.
- El contraste mínimo se puede calcular desde `contrast.ts`.
- No hay cambio visual drástico todavía; esta fase es de arquitectura.

---

# Fase 2 — Dividir el motor en módulos mantenibles

## Objetivo

Romper `src/engine.ts` en piezas claras. No cambiar aún todo el comportamiento: primero mover responsabilidades para poder mejorar sin crear un archivo gigante inmanejable.

## Archivos nuevos

| Ruta nueva | Responsabilidad |
|---|---|
| `src/engine/types.ts` | Tipos públicos: `ArtifactType`, `DirectionId`, `DesignTweaks`, `BuildInput`, `DesignOutput`, `Critique`, etc. |
| `src/engine/options.ts` | `artifactOptions`, `designDirections`, `defaultTweaks`. |
| `src/engine/brief.ts` | `deriveBrief`, `extractName`, `inferAudience`, `inferObjective`. |
| `src/engine/banks/sections.ts` | `sectionBank`. |
| `src/engine/banks/features.ts` | `featureBank`, `keywordFeatures`. |
| `src/engine/render/index.ts` | `renderArtifact`, coordinación de renderizadores. |
| `src/engine/render/software.ts` | Render software. |
| `src/engine/render/dashboard.ts` | Render dashboard. |
| `src/engine/render/web.ts` | Render web. |
| `src/engine/render/mobile.ts` | Render mobile. |
| `src/engine/render/deck.ts` | Render deck. |
| `src/engine/render/infographic.ts` | Render infographic. |
| `src/engine/render/partials.ts` | `renderMetricCards`, `renderFeatureList`, `renderTimeline`. |
| `src/engine/render/htmlDocument.ts` | `buildHtml`, shell HTML completa. |
| `src/engine/critique.ts` | `buildCritique`, temporalmente igual a la lógica actual. |
| `src/engine/handoff.ts` | `buildHandoffPrompt`. |
| `src/engine/utils.ts` | `stripNoise`, `titleCase`, `escapeHtml`, `slugify`. |
| `src/engine/index.ts` | Export público: `buildDesignProject`, opciones y tipos. |

## Archivos afectados

| Ruta | Cambio |
|---|---|
| `src/engine.ts` | Convertirlo en wrapper temporal o eliminarlo después de migrar imports. |
| `src/App.tsx` | Cambiar import de `./engine` a `./engine` si se mantiene barrel, o a `./engine/index`. Mejor mantener compatibilidad. |
| `src/vite-env.d.ts` | Sin cambios en esta fase. |

## Estrategia segura

1. Crear carpeta `src/engine/`.
2. Mover tipos primero.
3. Mover opciones y bancos.
4. Mover utilidades.
5. Mover renderizadores.
6. Mover crítica/handoff.
7. Crear `src/engine/index.ts`.
8. Dejar `src/engine.ts` como re-export temporal:

```ts
export * from './engine/index';
```

9. Cuando todo compile, decidir si se elimina `src/engine.ts` o se mantiene por compatibilidad.

## Estructura esperada

```txt
src/
  engine.ts                  # re-export temporal
  engine/
    banks/
      features.ts
      sections.ts
    render/
      dashboard.ts
      deck.ts
      htmlDocument.ts
      index.ts
      infographic.ts
      mobile.ts
      partials.ts
      software.ts
      web.ts
    brief.ts
    critique.ts
    handoff.ts
    index.ts
    options.ts
    types.ts
    utils.ts
```

## Criterios de aceptación

- `npm run typecheck` pasa.
- `npm run build` pasa.
- `App.tsx` sigue importando sin cambios grandes.
- El output generado es prácticamente igual al actual.
- El diff visual debe ser mínimo.

---

# Fase 3 — Brief estructurado e intención UX

## Objetivo

Pasar de detección por regex simple a una representación estructurada del problema de diseño. La generación debe saber no solo “qué artefacto es”, sino qué objetivo UX, dominio, módulos y estados necesita.

## Archivos nuevos

| Ruta nueva | Responsabilidad |
|---|---|
| `src/engine/intent/types.ts` | Tipos `Domain`, `UserGoal`, `UXIntent`, `ScreenState`, `ModuleRequirement`. |
| `src/engine/intent/domainRules.ts` | Reglas por dominio: CRM, fintech, salud, educación, marketing, diseño, operaciones, etc. |
| `src/engine/intent/intentResolver.ts` | Convierte `DerivedBrief` en `UXIntent`. |
| `src/engine/intent/modulePlanner.ts` | Decide módulos necesarios según tipo, dominio y objetivo. |
| `src/engine/intent/copyPlanner.ts` | Genera microcopy inicial más específico. |
| `src/engine/intent/index.ts` | Barrel export. |

## Archivos afectados

| Ruta | Cambio |
|---|---|
| `src/engine/brief.ts` | Mantener parseo básico, pero enriquecer el resultado con `language`, `domain`, `constraints`, `entities`. |
| `src/engine/render/*` | Recibir `UXIntent` además de `DerivedBrief`. |
| `src/engine/types.ts` | Añadir `intent` a `DesignOutput` si se quiere mostrar/debuggear. |
| `src/engine/index.ts` | `buildDesignProject` debe llamar a `resolveIntent`. |
| `src/App.tsx` | Opcional: mostrar resumen de intención en el inspector. |

## Tipos propuestos

```ts
export type Domain =
  | 'crm'
  | 'finance'
  | 'health'
  | 'education'
  | 'marketing'
  | 'design'
  | 'operations'
  | 'productivity'
  | 'generic';

export type UserGoal =
  | 'convert'
  | 'monitor'
  | 'explain'
  | 'coordinate'
  | 'decide'
  | 'learn'
  | 'prototype';

export type ScreenState = 'default' | 'empty' | 'loading' | 'error' | 'success' | 'review';

export interface ModuleRequirement {
  id: string;
  label: string;
  purpose: string;
  priority: 1 | 2 | 3;
  states: ScreenState[];
  dataShape?: Record<string, string>;
}

export interface UXIntent {
  domain: Domain;
  goal: UserGoal;
  primaryAction: string;
  secondaryAction?: string;
  userMentalModel: string;
  modules: ModuleRequirement[];
  requiredStates: ScreenState[];
  riskNotes: string[];
}
```

## Ejemplo de mejora esperada

### Prompt

```txt
Dashboard para un CRM de ventas B2B con pipeline, riesgos y siguientes acciones.
```

### Antes

Módulos genéricos:

- live metric cards
- risk queue
- trend chart
- owner filters
- decision summary
- pipeline health view

### Después

Módulos con intención:

- Pipeline por etapa: leads, qualified, proposal, negotiation, closed.
- Deals bloqueados: causa, owner, días sin actividad, siguiente acción.
- Forecast: target mensual, riesgo, gap.
- Actividad reciente: llamadas, emails, reuniones.
- Alertas de riesgo: sin follow-up, importe alto, fecha crítica.
- Owner filters: representante, región, segmento.
- Decision log: decisiones pendientes y responsables.

## Criterios de aceptación

- Cada artefacto tiene módulos menos genéricos.
- `buildDesignProject` sigue siendo determinista.
- El motor ya no depende solo de `keywordFeatures`.
- La app puede mostrar “dominio detectado” y “objetivo detectado”.
- El output sigue exportándose como HTML standalone.

---

# Fase 4 — Componentes de render reutilizables para HTML generado

## Objetivo

Evitar que cada renderizador escriba botones, cards, métricas, listas y navegación a mano. Crear piezas HTML reutilizables con clases consistentes y tokens.

## Archivos nuevos

| Ruta nueva | Responsabilidad |
|---|---|
| `src/engine/render/components/types.ts` | Props de componentes HTML string. |
| `src/engine/render/components/button.ts` | `renderButton`. |
| `src/engine/render/components/card.ts` | `renderCard`, `renderMetricCard`. |
| `src/engine/render/components/nav.ts` | `renderNav`, `renderSideRail`, `renderSegmentedControl`. |
| `src/engine/render/components/list.ts` | `renderFeatureList`, `renderTaskList`. |
| `src/engine/render/components/chart.ts` | Barras, tendencias, sparkline simple. |
| `src/engine/render/components/state.ts` | Empty/loading/error/success blocks. |
| `src/engine/render/components/device.ts` | Phone frame y responsive wrappers. |
| `src/engine/render/components/index.ts` | Barrel export. |
| `src/engine/render/styles/generatedCss.ts` | CSS común de componentes generados. |
| `src/engine/render/styles/artifactCss.ts` | CSS específico por tipo de artefacto. |

## Archivos afectados

| Ruta | Cambio |
|---|---|
| `src/engine/render/software.ts` | Usar componentes en vez de HTML duplicado. |
| `src/engine/render/dashboard.ts` | Usar componentes. |
| `src/engine/render/web.ts` | Usar componentes. |
| `src/engine/render/mobile.ts` | Usar componentes. |
| `src/engine/render/deck.ts` | Usar componentes. |
| `src/engine/render/infographic.ts` | Usar componentes. |
| `src/engine/render/htmlDocument.ts` | Inyectar CSS común + CSS de artefacto + tokens. |

## Componentes mínimos recomendados

1. `renderButton`
2. `renderMetricCard`
3. `renderPanel`
4. `renderSectionHeader`
5. `renderTaskRow`
6. `renderFeatureList`
7. `renderSegmentedControl`
8. `renderEmptyState`
9. `renderErrorState`
10. `renderLoadingState`
11. `renderChartBars`
12. `renderPhoneFrame`

## Ejemplo de API

```ts
renderButton({
  label: 'Export review',
  variant: 'primary',
  size: 'md',
  attributes: {
    type: 'button',
    'data-action': 'export-review',
  },
});
```

## Reglas de accesibilidad para componentes generados

- Todo `button` debe tener texto visible o `aria-label`.
- No usar `div` clicable si puede ser `button`.
- Los grupos tipo tabs/segmentos deben tener `aria-label`.
- El estado activo debe tener algo más que color: `aria-pressed`, `aria-selected` o texto.
- Los focus rings deben ser visibles.
- Los targets importantes deben ser como mínimo 40px de alto aunque WCAG 2.2 defina 24px como mínimo AA para target size.

## Criterios de aceptación

- Reducir duplicación de HTML en renderizadores.
- Las clases generadas siguen una convención estable.
- El CSS común de artefactos vive en uno o dos archivos, no dentro de cada función.
- Los componentes tienen nombres accesibles.
- El output HTML sigue siendo standalone.

---

# Fase 5 — Crítica real: analizador de calidad visual, accesibilidad y UX

## Objetivo

Reemplazar la crítica simple por un sistema que calcule problemas reales y convierta esos resultados en recomendaciones.

La crítica actual puntúa con reglas como longitud del prompt, densidad y dirección. Eso está bien como placeholder, pero no basta. Esta fase convierte la crítica en una ventaja del producto.

## Archivos nuevos

| Ruta nueva | Responsabilidad |
|---|---|
| `src/quality/types.ts` | Tipos `QualityIssue`, `QualityReport`, `QualityScore`, `Severity`. |
| `src/quality/color.ts` | Luminancia, contraste, parseo de hex/rgb, recomendación de ajuste. |
| `src/quality/accessibility.ts` | Reglas básicas: labels, buttons, ARIA, focus, target size detectable por CSS simple. |
| `src/quality/layoutHeuristics.ts` | Densidad, número de módulos, longitud de títulos, jerarquía. |
| `src/quality/copy.ts` | Detectar placeholder copy, textos genéricos, verbos débiles. |
| `src/quality/scoring.ts` | Convertir issues en puntuaciones por categoría. |
| `src/quality/report.ts` | Construir `Critique` compatible con la UI actual. |
| `src/quality/index.ts` | Barrel export. |

## Archivos afectados

| Ruta | Cambio |
|---|---|
| `src/engine/critique.ts` | Sustituir `buildCritique` por llamada a `analyzeDesignOutput`. |
| `src/engine/types.ts` | Ampliar `Critique` con issues, severity, category y suggestedFix. |
| `src/App.tsx` | Mejorar pestaña “Crítica”: mostrar issues accionables, no solo listas. |
| `src/styles.css` | Estilos para nueva lista de issues. |

## Tipos propuestos

```ts
export type QualityCategory =
  | 'accessibility'
  | 'contrast'
  | 'hierarchy'
  | 'layout'
  | 'copy'
  | 'interaction'
  | 'export';

export type Severity = 'info' | 'warning' | 'error';

export interface QualityIssue {
  id: string;
  category: QualityCategory;
  severity: Severity;
  title: string;
  detail: string;
  suggestedFix: string;
  selector?: string;
}

export interface QualityReport {
  total: number;
  scores: Array<{ label: string; value: number }>;
  issues: QualityIssue[];
  keep: string[];
  fix: string[];
  quickWins: string[];
}
```

## Reglas mínimas de análisis

### Contraste

- Texto normal: objetivo `>= 4.5:1`.
- Texto grande o UI no textual importante: objetivo `>= 3:1`.
- Si no se puede calcular por `color-mix`, marcar como `warning` y sugerir validación manual.

### Interacción

- Botones principales: altura mínima recomendada `>= 40px`.
- Botones del preview: deben tener texto o `aria-label`.
- Tabs/segmentos: deben exponer estado activo.
- No depender solo de color para “activo”, “riesgo”, “error” o “éxito”.

### Jerarquía

- No más de un `h1` principal por artefacto generado.
- Hero title: máximo orientativo `12–14ch` si usa display.
- No más de 3 métricas compitiendo en hero.
- El CTA principal debe ser único y claro.

### Copy

Detectar frases demasiado genéricas:

- `Start prototype`
- `View system`
- `Ship review`
- `Next actions`
- `brief coverage`
- `items to resolve`

No se prohíben, pero se marca como mejora si el prompt permitía copy más específico.

## Cambios en UI de crítica

En `src/App.tsx`, la pestaña `critique` debería mostrar:

1. Score total.
2. Scores por categoría.
3. Issues ordenados por severidad.
4. “Keep” / “Fix” / “Quick wins”.
5. Botón “Copy critique” opcional.

## Criterios de aceptación

- El score ya no depende solo de reglas fijas internas.
- Hay al menos 8 reglas de calidad reales.
- La UI muestra problemas con severidad.
- La crítica sigue funcionando offline.
- No se añade dependencia obligatoria a modelos externos.

---

# Fase 6 — Rediseño responsive de la app shell

## Objetivo

Convertir la app en una herramienta cómoda en portátil, tablet y móvil. Ahora la shell de tres columnas es útil en escritorio grande, pero rígida.

## Archivos nuevos

| Ruta nueva | Responsabilidad |
|---|---|
| `src/components/AppShell.tsx` | Layout principal. |
| `src/components/LeftPanel.tsx` | Brief, presets, artifact selector, versiones. |
| `src/components/CanvasToolbar.tsx` | Toolbar superior del preview. |
| `src/components/PreviewStage.tsx` | Iframe, zoom, tamaños, comparación. |
| `src/components/InspectorPanel.tsx` | Panel derecho. |
| `src/components/DirectionInspector.tsx` | Tab direcciones. |
| `src/components/TweakControls.tsx` | Tab tweaks. |
| `src/components/CritiqueInspector.tsx` | Tab crítica. |
| `src/components/HandoffInspector.tsx` | Tab handoff. |
| `src/components/VersionHistory.tsx` | Guardar/restaurar versiones. |
| `src/hooks/useLocalStorageState.ts` | Persistencia reutilizable. |
| `src/hooks/usePreviewZoom.ts` | Zoom fit/50/75/100. |
| `src/hooks/useKeyboardShortcuts.ts` | Atajos: guardar, exportar, canvas mode. |
| `src/styles/tokens.css` | Variables de app. |
| `src/styles/app-shell.css` | Layout general. |
| `src/styles/panels.css` | Paneles. |
| `src/styles/preview.css` | Preview/iframe/zoom. |
| `src/styles/forms.css` | Inputs, botones, segmented controls. |
| `src/styles/inspector.css` | Tabs e inspector. |

## Archivos afectados

| Ruta | Cambio |
|---|---|
| `src/App.tsx` | Reducirlo a composición y estado principal. Extraer componentes. |
| `src/styles.css` | Dividirlo o convertirlo en importador de archivos CSS. |
| `src/engine/types.ts` | Sin cambio necesario. |

## Nueva estructura CSS recomendada

```txt
src/
  styles.css                 # importa los demás
  styles/
    app-shell.css
    forms.css
    inspector.css
    panels.css
    preview.css
    tokens.css
```

`src/styles.css` quedaría así:

```css
@import './styles/tokens.css';
@import './styles/app-shell.css';
@import './styles/panels.css';
@import './styles/preview.css';
@import './styles/forms.css';
@import './styles/inspector.css';
```

## Responsive esperado

### Desktop grande `>= 1280px`

- 3 columnas: left / preview / inspector.
- Preview ocupa el centro.
- Toolbar completa.

### Laptop `1024px–1279px`

- Left panel más estrecho o colapsable.
- Inspector como drawer lateral.
- Preview con zoom `fit` por defecto.

### Tablet `768px–1023px`

- Left panel como drawer.
- Inspector como bottom panel o drawer.
- Toolbar compacta.
- Preview centrado.

### Móvil `< 768px`

- Una sola columna.
- Brief arriba, preview después, inspector en tabs colapsables.
- Sin `min-width: 980px`.
- El iframe puede tener altura fija y scroll propio.

## Cambios concretos en CSS

Eliminar o suavizar:

```css
body {
  min-width: 980px;
  overflow: hidden;
}
```

Sustituir por:

```css
body {
  min-width: 0;
  overflow: auto;
}
```

Y mover el control de overflow a la shell:

```css
.app-shell {
  min-height: 100dvh;
}

@media (min-width: 1280px) {
  .app-shell {
    height: 100dvh;
    overflow: hidden;
  }
}
```

## Nuevas funciones de preview

| Función | Detalle |
|---|---|
| Zoom | `fit`, `50%`, `75%`, `100%`. |
| Canvas only | Oculta paneles, deja solo toolbar mínima + preview. |
| Compare versions | Seleccionar dos versiones guardadas y comparar en dos iframes. |
| Reset view | Volver a desktop + fit. |

## Criterios de aceptación

- La app se puede usar en 1366px de ancho sin sensación de compresión.
- La app no rompe en 1024px.
- En móvil no aparece scroll horizontal global.
- El panel derecho no obliga a perder el preview.
- `App.tsx` queda por debajo de unas 250–300 líneas.

---

# Fase 7 — Exportación avanzada: bundle, manifest y handoff limpio

## Objetivo

Pasar de “descargar un HTML” a “exportar un paquete útil para continuar el diseño/desarrollo”. Mantener el HTML standalone, pero añadir salida estructurada.

## Archivos nuevos

| Ruta nueva | Responsabilidad |
|---|---|
| `src/export/types.ts` | Tipos de exportación. |
| `src/export/buildStandaloneHtml.ts` | HTML actual standalone. |
| `src/export/buildExportBundle.ts` | Construye bundle con `index.html`, `styles.css`, `script.js`, `designme.json`, `handoff.md`. |
| `src/export/createManifest.ts` | Metadata del diseño, tokens, prompt, fecha, artifactType, direction, tweaks. |
| `src/export/index.ts` | Barrel export. |
| `electron/exportBundle.cjs` | Escritura de carpeta bundle en desktop. |
| `electron/validators.cjs` | Validación básica de payloads para IPC. |

## Archivos afectados

| Ruta | Cambio |
|---|---|
| `src/engine/types.ts` | `DesignOutput` puede incluir `exportBundle` o datos separables. |
| `src/engine/render/htmlDocument.ts` | Separar CSS/JS del HTML para poder exportar bundle. |
| `src/App.tsx` | Añadir botón o menú: `Export HTML` y `Export bundle`. |
| `src/vite-env.d.ts` | Añadir tipos de `exportBundle`. |
| `electron/main.cjs` | Añadir handler IPC `designme:export-bundle`. |
| `electron/preload.cjs` | Exponer `exportBundle`. |
| `package.json` | Sin dependencia obligatoria si se exporta carpeta. Si se quiere zip, añadir una dependencia como `archiver`. |

## Formato de bundle propuesto

```txt
Designme Export/
  index.html
  styles.css
  script.js
  designme.json
  handoff.md
  README.md
```

## `designme.json` propuesto

```json
{
  "version": "0.2.0",
  "createdAt": "2026-05-16T00:00:00.000Z",
  "name": "Signal Desk",
  "artifactType": "dashboard",
  "directionId": "systems",
  "themeId": "systems",
  "tweaks": {
    "density": "balanced",
    "tone": "light",
    "motion": "measured",
    "radius": 6,
    "showDevice": true
  },
  "brief": {
    "prompt": "Dashboard para un CRM...",
    "audience": "equipos comerciales",
    "objective": "hacer visible el estado real"
  },
  "quality": {
    "total": 8,
    "issues": []
  }
}
```

## Criterios de aceptación

- HTML standalone sigue funcionando.
- Bundle exportado abre `index.html` sin servidor.
- `designme.json` contiene prompt, tweaks, direction y quality report.
- `handoff.md` está listo para pegar en otro agente.
- Electron valida nombres y evita rutas raras.

---

# Fase 8 — Seguridad Electron y preview sandbox

## Objetivo

Endurecer la app sin complicar el uso local-first. La seguridad importa porque Electron mezcla navegador, archivos locales e IPC.

## Archivos nuevos

| Ruta nueva | Responsabilidad |
|---|---|
| `electron/security.cjs` | CSP, navegación, window open policy, opciones seguras. |
| `electron/ipc.cjs` | Registro de handlers IPC. |
| `electron/validators.cjs` | Validadores de payload para export HTML/bundle. |
| `electron/paths.cjs` | Helpers de directorios seguros y sanitización de nombres. |

## Archivos afectados

| Ruta | Cambio |
|---|---|
| `electron/main.cjs` | Usar helpers; añadir sandbox; bloquear navegación no deseada; separar IPC. |
| `electron/preload.cjs` | Mantener API mínima, validar tipos antes de invocar. |
| `src/vite-env.d.ts` | Tipar nuevas APIs. |
| `src/App.tsx` | Gestionar errores de exportación con mensajes claros. |
| `index.html` o build Vite | Añadir CSP si aplica en app web. |

## Cambios recomendados en `BrowserWindow`

```js
const win = new BrowserWindow({
  width: 1480,
  height: 960,
  minWidth: 1120,
  minHeight: 760,
  title: 'Designme Studio',
  backgroundColor: '#f6f2ea',
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    preload: path.join(__dirname, 'preload.cjs'),
  },
});
```

## Bloquear navegación externa

```js
win.webContents.on('will-navigate', (event, url) => {
  const allowedDev = isDev && url.startsWith('http://127.0.0.1:5173');
  const allowedFile = !isDev && url.startsWith('file://');

  if (!allowedDev && !allowedFile) {
    event.preventDefault();
  }
});

win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
```

## Validación IPC

Validar:

- `payload.html` es string.
- tamaño máximo razonable, por ejemplo `2–5 MB` al principio.
- `payload.name` no contiene path traversal.
- `payload.bundle` tiene claves esperadas.
- no aceptar rutas arbitrarias del renderer.

## Preview iframe

El preview actual usa:

```tsx
sandbox="allow-scripts allow-same-origin"
```

Revisión recomendada:

1. Mantener scripts porque los prototipos tienen toggles.
2. Evaluar quitar `allow-same-origin` si no es estrictamente necesario.
3. Si se mantiene, documentar por qué.
4. No permitir forms, popups ni top navigation.
5. Limitar scripts generados al JS interno del prototipo.

## Criterios de aceptación

- Export HTML sigue funcionando en Electron.
- No se puede navegar la ventana principal a URLs externas.
- No se pueden abrir ventanas nuevas desde contenido generado.
- IPC valida payloads.
- `preload.cjs` expone solo lo necesario.

---

# Fase 9 — Accesibilidad y semántica de la app React

## Objetivo

Hacer que la propia app sea más profesional y accesible. No solo el output generado.

## Archivos afectados

| Ruta | Cambio |
|---|---|
| `src/App.tsx` o componentes extraídos | Añadir roles/aria correctos en tabs, toolbar, status, botones icon-only. |
| `src/styles.css` o `src/styles/*.css` | Mejorar focus states, targets, contraste y responsive. |
| `src/components/*` | Si ya se hizo Fase 6, aplicar aquí sobre componentes. |

## Cambios concretos

### Tabs del inspector

Actualmente son botones visuales. Convertir a patrón tablist:

```tsx
<nav className="tab-row" role="tablist" aria-label="Inspector tabs">
  <button
    role="tab"
    aria-selected={sideTab === tab.id}
    aria-controls={`panel-${tab.id}`}
    id={`tab-${tab.id}`}
  >
    ...
  </button>
</nav>
```

Panel:

```tsx
<section
  id="panel-critique"
  role="tabpanel"
  aria-labelledby="tab-critique"
>
  ...
</section>
```

### Status row

```tsx
<footer className="status-row" role="status" aria-live="polite">
  ...
</footer>
```

### Botones icon-only

Todo botón solo con icono debe tener `aria-label`, no depender solo de `title`.

### Focus visible

Mantener y reforzar:

```css
button:focus-visible,
textarea:focus-visible,
input:focus-visible {
  outline: 2px solid var(--app-focus);
  outline-offset: 2px;
}
```

## Criterios de aceptación

- Navegación básica por teclado usable.
- Tabs comunican estado seleccionado.
- Status comunica cambios sin ser intrusivo.
- Botones icon-only tienen nombre accesible.
- No se usa ARIA si basta con HTML nativo.

---

# Fase 10 — Tests unitarios, calidad y e2e

## Objetivo

Añadir tests suficientes para evitar que cada refactor rompa el generador, la exportación o la app.

## Dependencias recomendadas

Modificar `package.json`:

```bash
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom playwright @axe-core/playwright
```

Opcional si se quiere linting:

```bash
npm i -D eslint prettier eslint-plugin-react-hooks eslint-plugin-jsx-a11y
```

## Archivos nuevos

| Ruta nueva | Responsabilidad |
|---|---|
| `vitest.config.ts` | Configuración unit tests. |
| `playwright.config.ts` | Configuración e2e. |
| `tests/unit/engine/buildDesignProject.test.ts` | Pruebas del motor. |
| `tests/unit/engine/brief.test.ts` | Parseo de prompts. |
| `tests/unit/quality/contrast.test.ts` | Contraste. |
| `tests/unit/export/createManifest.test.ts` | Manifest/export. |
| `tests/e2e/app.spec.ts` | App carga, cambia prompt, export web fallback. |
| `tests/e2e/accessibility.spec.ts` | Axe básico sobre app. |
| `.github/workflows/ci.yml` | CI: install, typecheck, test, build. |

## Scripts nuevos en `package.json`

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "check": "npm run typecheck && npm run test && npm run build"
  }
}
```

## Tests mínimos del motor

1. `buildDesignProject` devuelve `name`, `html`, `handoffPrompt`, `critique`.
2. Cada `ArtifactType` genera HTML no vacío.
3. `escapeHtml` evita inyección básica.
4. `slugify` produce nombres seguros.
5. El CRM prompt genera dominio/módulos CRM después de Fase 3.
6. La crítica detecta texto placeholder o contraste bajo.

## Tests e2e mínimos

1. La app carga.
2. Escribir prompt actualiza preview.
3. Cambiar artifact type actualiza output.
4. Guardar versión añade item.
5. Restaurar versión recupera prompt.
6. Cambiar preview mobile cambia clase.
7. La pestaña crítica muestra score/issues.
8. Export HTML web crea descarga en navegador o al menos dispara flujo.

## Criterios de aceptación

- `npm run check` pasa.
- CI pasa en GitHub Actions.
- Hay tests unitarios del motor y de contraste.
- Hay al menos un e2e de flujo principal.

---

# Fase 11 — Mejora de copy, idioma y naming

## Objetivo

Subir la percepción de calidad corrigiendo textos, acentos, tono y consistencia. Ahora hay textos en español sin tildes y mezcla de inglés/español.

## Archivos afectados

| Ruta | Cambio |
|---|---|
| `src/App.tsx` o componentes | Corregir labels visibles. |
| `src/engine/options.ts` | Corregir textos de directions, prompts y banks. |
| `src/engine/handoff.ts` | Handoff en español correcto. |
| `src/engine/render/*` | Decidir si output generado será español, inglés o según prompt. |
| `README.md` | Unificar idioma. |

## Cambios concretos

| Actual | Recomendado |
|---|---|
| `Critica` | `Crítica` |
| `diseno` | `diseño` |
| `disenador` | `diseñador` |
| `Actua` | `Actúa` |
| `Direccion` | `Dirección` |
| `Informacion` | `Información` |
| `movil` | `móvil` |
| `prototipo cinetico` | `prototipo cinético` |

## Recomendación de arquitectura

Crear diccionario simple:

| Ruta nueva | Responsabilidad |
|---|---|
| `src/i18n/es.ts` | Textos de interfaz en español. |
| `src/i18n/en.ts` | Opcional para inglés. |
| `src/i18n/index.ts` | Selector simple. |

No hace falta meter una librería i18n todavía. Un objeto tipado es suficiente.

## Criterios de aceptación

- UI principal sin faltas visibles.
- Handoff prompt en español correcto.
- Presets bien escritos.
- No se rompe la generación.

---

# Fase 12 — Documentación, ejemplos y presentación del repo

## Objetivo

Hacer que el repo se entienda y parezca serio para cualquiera que lo vea.

## Archivos nuevos

| Ruta nueva | Responsabilidad |
|---|---|
| `docs/architecture.md` | Explicación del motor, app, export y Electron. |
| `docs/design-system.md` | Tokens, temas, direcciones visuales. |
| `docs/security.md` | Decisiones Electron/iframe/IPC. |
| `docs/export-format.md` | Formato de HTML/bundle/manifest. |
| `docs/quality-rubric.md` | Cómo funciona la crítica. |
| `examples/prompts.md` | Prompts recomendados. |
| `examples/exports/.gitkeep` | Carpeta para ejemplos exportados o links. |

## Archivos afectados

| Ruta | Cambio |
|---|---|
| `README.md` | Añadir screenshots/GIF, features, roadmap, quick start, architecture links. |
| `package.json` | Mejorar description si hace falta. |

## README recomendado

Estructura:

```md
# Designme Studio

## What it is
## Why local-first
## Features
## Screenshots
## Run locally
## Build desktop app
## Export format
## Architecture
## Roadmap
## Security notes
## License
```

## Criterios de aceptación

- Un desarrollador nuevo entiende el proyecto en 5 minutos.
- Hay al menos 3 screenshots o GIFs.
- README enlaza a arquitectura, diseño, seguridad y export.
- El roadmap no promete IA si todavía no está implementada.

---

# Fase 13 — Opcional: referencias visuales y generación asistida por IA

## Objetivo

Solo después de fortalecer el motor determinista: permitir usar referencias visuales o IA como capa opcional, sin romper el local-first.

## Importante

Esta fase **no debe ser prioritaria**. Primero hay que resolver tokens, motor, crítica, responsive, export y seguridad.

## Archivos nuevos posibles

| Ruta nueva | Responsabilidad |
|---|---|
| `src/references/types.ts` | Tipos de referencia visual/textual. |
| `src/references/styleReference.ts` | Convertir referencia en tokens o preferencias. |
| `src/references/referenceStore.ts` | Guardar referencias locales. |
| `src/ai/types.ts` | Tipos de proveedor opcional. |
| `src/ai/providers/openai.ts` | Opcional, no hardcoded por defecto. |
| `src/ai/providers/local.ts` | Futuro proveedor local. |
| `src/ai/promptEnhancer.ts` | Mejora de brief/copy, no generación ciega. |

## Archivos afectados

| Ruta | Cambio |
|---|---|
| `src/App.tsx` o componentes | Añadir panel opcional “References”. |
| `src/engine/intent/*` | Permitir que referencia influya en tokens/módulos. |
| `src/engine/render/*` | No acoplar a IA; usar salida estructurada. |
| `README.md` | Explicar que IA es opcional. |

## Criterios de aceptación

- La app sigue funcionando sin API key.
- IA no reemplaza al motor, solo lo mejora.
- Las referencias se convierten en tokens/preferencias, no en copia visual ciega.
- El usuario controla qué se envía fuera, si se envía algo.

---

# Orden recomendado de implementación

## Orden corto si quieres avanzar rápido

1. Fase 1 — Tokens.
2. Fase 2 — Dividir motor.
3. Fase 5 — Crítica real.
4. Fase 6 — Responsive app shell.
5. Fase 8 — Seguridad Electron.
6. Fase 10 — Tests.

## Orden completo recomendado

| Orden | Fase | Motivo |
|---:|---|---|
| 0 | Preparación | Evita perder control. |
| 1 | Tokens | Mejora todo lo visual desde la raíz. |
| 2 | Dividir motor | Permite cambios sin romper todo. |
| 3 | Brief/intent | Hace que los diseños sean menos genéricos. |
| 4 | Componentes render | Reduce duplicación y mejora consistencia. |
| 5 | Crítica real | Convierte Designme en herramienta útil, no solo generador. |
| 6 | Responsive shell | Mejora la experiencia diaria de uso. |
| 7 | Export bundle | Aumenta valor práctico. |
| 8 | Seguridad Electron | Necesario antes de crecer. |
| 9 | Accesibilidad app | Profesionaliza la UI. |
| 10 | Tests/CI | Evita regresiones. |
| 11 | Copy/idioma | Pulido visible. |
| 12 | Docs/repo | Hace presentable el proyecto. |
| 13 | IA opcional | Solo cuando la base sea fuerte. |

---

# Mapa final esperado de carpetas

```txt
Designme/
  docs/
    architecture.md
    design-system.md
    export-format.md
    PLAN_MEJORAS_DESIGNME.md
    quality-rubric.md
    security.md
    quality/
      acceptance-checklist.md
      baseline-prompts.md
      screenshots/
  electron/
    exportBundle.cjs
    ipc.cjs
    main.cjs
    paths.cjs
    preload.cjs
    security.cjs
    validators.cjs
  examples/
    prompts.md
    exports/
      .gitkeep
  src/
    ai/                         # opcional, fase 13
    components/
      AppShell.tsx
      CanvasToolbar.tsx
      CritiqueInspector.tsx
      DirectionInspector.tsx
      HandoffInspector.tsx
      InspectorPanel.tsx
      LeftPanel.tsx
      PreviewStage.tsx
      TweakControls.tsx
      VersionHistory.tsx
    design-system/
      README.md
      tokens/
        base.ts
        contrast.ts
        cssVars.ts
        index.ts
        palettes.ts
        themes.ts
        types.ts
    engine.ts                   # re-export temporal o eliminado
    engine/
      banks/
        features.ts
        sections.ts
      intent/
        copyPlanner.ts
        domainRules.ts
        index.ts
        intentResolver.ts
        modulePlanner.ts
        types.ts
      render/
        components/
          button.ts
          card.ts
          chart.ts
          device.ts
          index.ts
          list.ts
          nav.ts
          state.ts
          types.ts
        styles/
          artifactCss.ts
          generatedCss.ts
        dashboard.ts
        deck.ts
        htmlDocument.ts
        index.ts
        infographic.ts
        mobile.ts
        partials.ts
        software.ts
        web.ts
      brief.ts
      critique.ts
      handoff.ts
      index.ts
      options.ts
      types.ts
      utils.ts
    export/
      buildExportBundle.ts
      buildStandaloneHtml.ts
      createManifest.ts
      index.ts
      types.ts
    hooks/
      useKeyboardShortcuts.ts
      useLocalStorageState.ts
      usePreviewZoom.ts
    i18n/
      es.ts
      index.ts
    quality/
      accessibility.ts
      color.ts
      copy.ts
      index.ts
      layoutHeuristics.ts
      report.ts
      scoring.ts
      types.ts
    references/                 # opcional, fase 13
    styles/
      app-shell.css
      forms.css
      inspector.css
      panels.css
      preview.css
      tokens.css
    styles.css
    App.tsx
    main.tsx
    vite-env.d.ts
  tests/
    e2e/
      accessibility.spec.ts
      app.spec.ts
    unit/
      engine/
        brief.test.ts
        buildDesignProject.test.ts
      export/
        createManifest.test.ts
      quality/
        contrast.test.ts
  .github/
    workflows/
      ci.yml
  package.json
  playwright.config.ts
  README.md
  vitest.config.ts
```

---

# Qué no haría todavía

1. **No metería una API de IA obligatoria.** Rompería la propuesta local-first.
2. **No añadiría 20 plantillas nuevas antes de tokens.** Solo multiplicaría deuda.
3. **No reescribiría todo en Tailwind ahora.** Puede ser útil después, pero no es necesario para subir calidad.
4. **No cambiaría Electron por Tauri todavía.** Primero endurecer Electron y medir necesidades reales.
5. **No añadiría una librería i18n pesada.** Un diccionario tipado basta.
6. **No haría ZIP export si no hace falta.** Exportar carpeta es más simple y suficiente al principio.

---

# Primera fase accionable recomendada

Si vas a empezar ya, haz solo esto:

## Sprint 1

1. Crear `docs/PLAN_MEJORAS_DESIGNME.md`.
2. Crear `src/design-system/tokens/types.ts`.
3. Crear `src/design-system/tokens/base.ts`.
4. Crear `src/design-system/tokens/palettes.ts`.
5. Crear `src/design-system/tokens/themes.ts`.
6. Crear `src/design-system/tokens/cssVars.ts`.
7. Crear `src/design-system/tokens/contrast.ts`.
8. Modificar `src/engine.ts` para consumir `getThemeById`.
9. Modificar `src/styles.css` para usar variables de app.
10. Ejecutar `npm run typecheck` y `npm run build`.

## Resultado del Sprint 1

No buscas una app nueva. Buscas una base visual mejor. El usuario quizá no note una revolución, pero el proyecto queda preparado para subir calidad sin caos.

---

# Indicadores de que Designme está subiendo de nivel

Cuando avances, deberías poder decir:

- El mismo prompt ya no produce siempre la misma estructura con distinto texto.
- La crítica detecta problemas concretos y accionables.
- El output generado tiene estados reales.
- El sistema visual se ajusta desde tokens.
- El preview se usa bien en portátil.
- El export permite continuar el trabajo fuera de Designme.
- Electron está más cerrado.
- Hay tests que protegen el motor.
- El README vende el proyecto con claridad.

---

# Resumen ejecutivo

Designme ya tiene una base con valor: local-first, export HTML, handoff prompt, direcciones visuales y tweaks. El siguiente salto no es “más IA” ni “más plantillas”. El salto correcto es:

1. **Tokens.**
2. **Motor modular.**
3. **Brief estructurado.**
4. **Componentes HTML reutilizables.**
5. **Crítica medible.**
6. **Responsive serio.**
7. **Export bundle.**
8. **Seguridad Electron.**
9. **Tests y documentación.**

Ese orden convierte el proyecto en una herramienta sólida, no solo en una demo visual.
