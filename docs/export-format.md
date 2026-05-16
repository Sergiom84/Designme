# Formato De Exportación

Designme mantiene dos salidas local-first: un HTML autónomo y un paquete editable.

## HTML Autónomo

El botón `Exportar HTML` escribe un `.html` autocontenido. Incluye:

- markup generado;
- CSS completo;
- script del prototipo;
- dock de ajustes standalone;
- metadatos UX en el `body`;
- `<!doctype html>` y viewport.

El archivo abre directamente en navegador y no necesita servidor.

## Paquete

El botón `Exportar paquete` escribe una carpeta con archivos separados:

```txt
Designme Export/
  index.html
  styles.css
  script.js
  designme.json
  handoff.md
  README.md
```

## Archivos

- `index.html`: versión enlazada a `styles.css` y `script.js`.
- `styles.css`: CSS extraído del HTML generado.
- `script.js`: interacciones standalone del prototipo.
- `designme.json`: prompt, artefacto, dirección, tema, ajustes, intención UX y reporte de calidad.
- `handoff.md`: contexto listo para pegar en Codex, Claude u otro agente.
- `README.md`: notas mínimas para continuar iterando.

## Manifest

`designme.json` se construye en `src/export/createManifest.ts` y conserva:

- versión del formato;
- fecha de creación;
- nombre del diseño;
- tipo de artefacto;
- dirección y tema;
- ajustes visuales;
- brief resumido;
- intención UX;
- puntuación e incidencias de calidad;
- resumen de referencias locales, si se usaron;
- metadata del proveedor IA opcional, si se usó.

Ejemplo reducido:

```json
{
  "version": "0.2.0",
  "createdAt": "2026-05-17T00:00:00.000Z",
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
    "summary": "hacer visible el estado real para equipos comerciales.",
    "audience": "equipos comerciales",
    "objective": "hacer visible el estado real",
    "sections": ["Resumen", "Panel de señales"],
    "features": ["Pipeline por etapa", "Deals bloqueados"]
  },
  "intent": {
    "domain": "crm",
    "goal": "decide",
    "primaryAction": "Tomar decisión"
  },
  "quality": {
    "total": 8,
    "issues": []
  },
  "references": {
    "used": true,
    "count": 1,
    "summary": "Referencia detectada: sistemas, contraste.",
    "keywords": ["sistemas", "contraste"]
  },
  "ai": {
    "providerId": "local",
    "used": true,
    "localOnly": true
  }
}
```

El manifest puede crecer, pero no debe perder estos campos base porque los consume el handoff y la documentación de export.

## Seguridad

Electron nunca acepta rutas de salida arbitrarias. El renderer envía nombre y contenido; `electron/paths.cjs` resuelve la ruta segura y `electron/validators.cjs` limita payloads y nombres de archivo.
