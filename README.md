# Designme Studio

Diseñador local-first para apps, pantallas de software, dashboards, decks, infografías y webs. No requiere API key: esta versión usa un motor determinista, exporta HTML autónomo y genera un prompt de handoff para continuar el trabajo en Codex, Claude u otro agente.

## Funcionalidades

- Generador determinista local, sin proveedor cloud obligatorio.
- Vista previa en lienzos de escritorio, tablet y móvil.
- Shell adaptable con zoom, modo solo lienzo y comparación de versiones guardadas.
- Direcciones visuales respaldadas por tokens de diseño compartidos.
- Ajustes de densidad, tono, movimiento, radio y marco de dispositivo.
- Referencias locales: notas visuales/textuales que se convierten en preferencias, no en copia ciega.
- Mejora local del brief sin llamadas externas ni API key.
- Panel de crítica con rúbrica de calidad y puntuación sensible a contraste.
- Analizador local de accesibilidad, jerarquía, layout, copy, contraste y exportación.
- Exportación HTML y paquete estructurado con `index.html`, `styles.css`, `script.js`, `designme.json`, `handoff.md` y README.
- Electron endurecido con CSP, IPC validado por origen y sandbox de preview más estricto.
- Shell React accesible con tabs por teclado, controles nombrados, medidores etiquetados y estado anunciado de forma discreta.

## Capturas

![Designme Studio en escritorio](docs/assets/screenshots/designme-desktop.png)

![Panel de crítica local](docs/assets/screenshots/designme-critica.png)

![Preview móvil](docs/assets/screenshots/designme-mobile.png)

## Quick Start

```bash
npm install
npm run dev
```

Esto arranca Vite y Electron. Para probar solo la versión web:

```bash
npm run web
```

## Build

```bash
npm run build
npm run desktop
```

## Stack

- React 18, TypeScript y Vite 6 para la app.
- Electron 33 para escritorio.
- Lucide React para iconos.
- Vitest + jsdom para unit tests.
- Playwright + Axe para e2e y accesibilidad.
- GitHub Actions con Node 22.

## Validar

```bash
npm run check
npm run e2e
npm run security:audit
```

`npm run check` ejecuta typecheck, unit tests y build. `npm run e2e` levanta Vite en `127.0.0.1:4173` y corre el flujo principal, export web y Axe.

## Atajos

- `Ctrl/Cmd+S`: guardar versión.
- `Ctrl/Cmd+E`: exportar HTML.
- `Ctrl/Cmd+B`: alternar solo lienzo.
- `Ctrl/Cmd+0`: restablecer vista.

## Ejecutable Windows

```bash
npm run package
```

El ejecutable portable se crea en `release/`. Los HTML exportados se escriben en `Documents/Designme/exports`, salvo que definas `DESIGNME_EXPORT_DIR`.

## Roadmap De Calidad

El plan activo vive en [`docs/PLAN_MEJORAS_DESIGNME.md`](docs/PLAN_MEJORAS_DESIGNME.md).

Los prompts base y checks de aceptación están en [`docs/quality/`](docs/quality/). Prioridades actuales:

1. Tokens y calidad de tema.
2. Arquitectura modular del generador.
3. Crítica medible y accesibilidad.
4. Shell adaptable.
5. IPC Electron y límites de preview más seguros.

## Arquitectura

- `src/engine.ts` es un barrel de compatibilidad.
- `src/engine/brief.ts` convierte prompts en un brief derivado.
- `src/engine/intent/` detecta dominio, objetivo UX, módulos, estados y riesgos.
- `src/engine/options.ts` define artefactos, direcciones y ajustes por defecto.
- `src/engine/render/components/` contiene componentes HTML reutilizables para artefactos generados.
- `src/engine/render/styles/` contiene CSS compartido y layouts por tipo de artefacto.
- `src/engine/render/` renderiza HTML autónomo por artefacto.
- `src/engine/critique.ts` y `src/engine/handoff.ts` separan revisión de calidad y handoff del render.
- `src/quality/` analiza HTML generado y convierte incidencias medibles en puntuaciones.
- `src/components/`, `src/hooks/` y `src/styles/` mantienen modular la shell responsive.
- `src/export/` construye HTML autónomo y paquetes de exportación.
- `src/references/` convierte referencias locales en preferencias estructuradas.
- `src/ai/` define proveedores opcionales; el proveedor activo por defecto es local y determinista.
- `src/design-system/tokens/` contiene temas, paletas, variables CSS y helpers de contraste.

Más detalle:

- Arquitectura: [`docs/architecture.md`](docs/architecture.md).
- Sistema de diseño: [`docs/design-system.md`](docs/design-system.md).
- Formato de exportación: [`docs/export-format.md`](docs/export-format.md).
- Rúbrica de calidad: [`docs/quality-rubric.md`](docs/quality-rubric.md).
- Accesibilidad: [`docs/accessibility.md`](docs/accessibility.md).
- Seguridad: [`docs/security.md`](docs/security.md).
- Prompts de ejemplo: [`examples/prompts.md`](examples/prompts.md).

## Formato De Export

Designme exporta un HTML autónomo o un paquete editable:

```txt
index.html
styles.css
script.js
designme.json
handoff.md
README.md
```

`designme.json` conserva prompt, tipo de artefacto, dirección, tema, ajustes, intención UX y reporte de calidad.

## IA Opcional Y Privacidad

La app no envía nada fuera por defecto. La pestaña `Referencias` analiza notas locales, detecta rasgos como densidad, contraste, dirección visual o movimiento, y deja al usuario decidir si quiere:

- aplicar esas preferencias a dirección/ajustes;
- mejorar el brief localmente con un proveedor determinista.

La IA futura debe entrar como proveedor explícito y opt-in. Designme no persiste API keys ni manda referencias a servicios externos en esta fase.

## Inspiración Conceptual

- Open CoDesign: flujo local-first, sesiones explícitas, preview en vivo, exports reales y sin bloqueo cloud.
- Huashu Design: asesor de dirección visual, variaciones ajustables, supuestos visuales tempranos y rúbrica práctica de crítica.

No hay proveedor de modelos hardcodeado. La app funciona offline como punto de partida de diseño y deja un puente limpio hacia Codex o Claude sin atar Designme a una cuenta de API.
