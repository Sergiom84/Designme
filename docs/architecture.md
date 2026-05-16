# Arquitectura

Designme Studio es una herramienta local-first construida alrededor de un generador determinista. La app no necesita un modelo externo para producir un primer prototipo: parsea el brief, resuelve intención UX, renderiza HTML autónomo, analiza calidad y prepara un handoff para continuar en otro agente.

## Flujo Principal

1. `src/App.tsx` mantiene prompt, artefacto, dirección visual, ajustes, versiones y estado de exportación.
2. `src/engine/brief.ts` normaliza el prompt y deriva nombre, audiencia, objetivo, secciones y features.
3. `src/engine/intent/intentResolver.ts` detecta dominio, objetivo UX, estados, riesgos y módulos requeridos.
4. `src/engine/index.ts` enriquece el brief, construye HTML, crítica y handoff.
5. `src/engine/render/` elige el renderizador por tipo de artefacto.
6. `src/engine/render/components/` aporta botones, cards, navegación, listas, charts, estados y marcos de dispositivo.
7. `src/engine/render/styles/` concentra CSS generado común y layouts por artefacto.
8. `src/quality/` analiza accesibilidad, contraste, jerarquía, layout, copy, interacción y exportación.
9. `src/export/` crea HTML standalone o paquete estructurado.
10. `electron/` valida IPC, rutas y seguridad para exportar desde escritorio.

## Módulos Clave

```txt
src/
  components/          Shell React: brief, canvas, inspector, status.
  design-system/       Tokens, temas, paletas y contraste.
  engine/              Brief, intención, render, crítica y handoff.
  export/              HTML standalone, bundle y manifest.
  hooks/               Estado local, shortcuts y zoom.
  references/          Referencias locales convertidas en preferencias.
  ai/                  Proveedores opcionales de mejora de prompt.
  quality/             Reglas deterministas de análisis.
  styles/              CSS de app por responsabilidad.
tests/
  unit/                Motor, brief, contraste y manifest.
  e2e/                 Flujo principal, export web y Axe.
electron/              Ventana, seguridad, IPC, rutas y export bundle.
```

## Tipos De Artefacto

- `software`
- `web`
- `dashboard`
- `mobile`
- `deck`
- `infographic`

## Dominios De Intención

- CRM / ventas
- Finanzas
- Salud
- Educación
- Marketing
- Diseño
- Operaciones
- Productividad
- General

## Contratos

- No hay API externa obligatoria.
- El HTML generado debe seguir siendo autónomo.
- El handoff debe contener brief, intención, dirección, ajustes y módulos.
- El preview vive en un iframe sandboxed con scripts, sin same-origin.
- Electron no acepta rutas arbitrarias desde el renderer.
- Los tests de fase 10 protegen motor, exportación, flujo principal y accesibilidad básica.

## Electron

La app de escritorio vive en `electron/`:

- `main.cjs`: crea la ventana y decide dev/prod.
- `security.cjs`: CSP, navegación permitida, bloqueo de `window.open` y `webview`.
- `preload.cjs`: expone una API mínima en `window.designme`.
- `ipc.cjs`: registra handlers para exportar, abrir exports y copiar texto.
- `validators.cjs`: valida payloads de IPC.
- `paths.cjs`: resuelve directorios seguros y nombres saneados.
- `exportBundle.cjs`: escribe el paquete estructurado.

El renderer no recibe acceso directo a Node ni rutas arbitrarias.

## App Shell

La interfaz React tiene tres zonas:

- `LeftPanel`: brief, presets, artefactos y versiones.
- `CenterPanel`: toolbar, preview, comparación y status.
- `InspectorPanel`: direcciones, ajustes, referencias, crítica y handoff.

Los datos persistentes usan localStorage mediante hooks tipados. El preview usa `iframe srcDoc` con `sandbox="allow-scripts"`.

## Referencias E IA Opcional

La fase 13 añade una capa previa al motor, no un reemplazo del motor:

1. El usuario escribe notas de referencia en la pestaña `Referencias`.
2. `src/references/styleReference.ts` detecta señales como editorial, sistemas, cinético, contraste, calma o radios suaves.
3. Esas señales se convierten en `directionId`, `tweaksPatch`, hints de prompt, notas visuales y riesgos.
4. El usuario aplica estilo o mejora el brief de forma explícita.
5. `src/ai/providers/local.ts` mejora el brief con una función determinista local.

No hay proveedor externo activo por defecto. Si en el futuro se añade un proveedor remoto, debe ser opt-in y mostrar qué payload se envía.

## Tests Y CI

- Unit tests: `tests/unit/` con Vitest y jsdom.
- E2E: `tests/e2e/` con Playwright.
- Accesibilidad: Axe sobre la shell, excluyendo el iframe generado.
- CI: `.github/workflows/ci.yml` instala dependencias, Chromium, corre `npm run check` y `npm run e2e`.

## Límites Actuales

- La generación es determinista: no intenta competir con un modelo generativo completo.
- La crítica es heurística local: útil para regresiones y avisos, no reemplaza una revisión humana.
- La internacionalización es un diccionario tipado simple en `src/i18n/`, no una librería i18n completa.
- Las referencias son notas/metadatos. No se guardan imágenes grandes ni blobs en localStorage.

## Dónde Cambiar Cada Cosa

- Nuevo tipo de artefacto: `src/engine/types.ts`, `src/engine/options.ts`, `src/engine/render/`, tests unitarios.
- Nuevo dominio: `src/engine/intent/domainRules.ts`, `modulePlanner.ts`, tests de intent/engine.
- Nueva métrica de calidad: `src/quality/`, `src/quality/scoring.ts`, tests unitarios.
- Nuevo formato de export: `src/export/`, `electron/exportBundle.cjs`, `electron/validators.cjs`.
- Cambio visual de app: `src/components/`, `src/styles/`, `src/i18n/`.
