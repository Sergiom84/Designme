# Seguridad

Designme es local-first, pero Electron mezcla navegador, sistema de archivos e IPC. La app mantiene una superficie pequeña y validada.

## Ventana Electron

`electron/main.cjs` crea la ventana con:

- `contextIsolation: true`;
- `nodeIntegration: false`;
- `sandbox: true`;
- `webSecurity: true`;
- navegación externa bloqueada;
- `window.open` denegado;
- `<webview>` denegado.

## CSP

`electron/security.cjs` inyecta Content Security Policy con `webRequest.onHeadersReceived`.

- Producción permite solo assets locales de la app.
- Desarrollo permite Vite en `127.0.0.1:5173` y su websocket.
- `object-src` es siempre `none`.
- `base-uri` queda restringido a `self`.

## IPC

El preload expone una API mínima:

- `exportHtml`;
- `exportBundle`;
- `openExports`;
- `copyText`.

Los payloads se validan en `electron/preload.cjs` y `electron/validators.cjs`. Los handlers en `electron/ipc.cjs` también rechazan emisores cuyo frame URL no sea de confianza.

## Preview Iframe

La app muestra el prototipo en:

```tsx
sandbox="allow-scripts"
```

Los scripts son necesarios para el dock standalone y los toggles de estado. El iframe no permite same-origin, formularios, popups, descargas, modales, pointer lock ni top navigation.

## Exportaciones

- El renderer no envía rutas de salida.
- Los nombres se sanitizan.
- Las rutas se resuelven dentro del directorio seguro de exports.
- El paquete solo puede escribir la lista esperada de archivos.

## Referencias E IA

- Las referencias de fase 13 se guardan como texto/metadata en localStorage.
- No se almacenan imágenes grandes, blobs ni base64.
- La mejora de brief activa por defecto es local y determinista.
- No hay llamadas externas ni API keys obligatorias.
- Cualquier proveedor remoto futuro debe ser opt-in y enseñar el payload antes de enviarlo.

## Auditoría

```bash
npm run security:audit
```

El audit se ejecuta con `--omit=dev`, porque las herramientas de test/build no forman parte del runtime de producción.
