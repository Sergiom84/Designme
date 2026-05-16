# Acceptance Checklist

Para cerrar cada fase:

- [ ] `npm run typecheck` pasa.
- [ ] `npm run build` pasa.
- [ ] Los 6 baseline prompts siguen generando salida.
- [ ] No se pierde export HTML web.
- [ ] No se pierde export HTML desktop.
- [ ] No se rompe `localStorage` de prompt, tweaks o versiones.
- [ ] El preview desktop/tablet/mobile sigue funcionando.
- [ ] Los cambios están descritos en `README.md` o `docs/`.

## No Regresión

- No introducir API externa obligatoria.
- No eliminar export standalone HTML.
- No eliminar el handoff prompt.
- No convertir Designme en una app solo cloud.
