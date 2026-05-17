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

- Producción permite assets locales de la app y, a nivel de documento, hosts `127.0.0.1:*` / `localhost:*` para que el provider `local-openai` pueda usarse cuando el usuario lo active.
- Desarrollo permite Vite en `127.0.0.1:5173` y su websocket además de los hosts locales.
- `object-src` es siempre `none`.
- `base-uri` queda restringido a `self`.

El CSP del documento es estático por necesidad (las cabeceras se fijan en la carga). La política dinámica se aplica en el siguiente bloque.

## Gating dinámico de red local

`electron/cspState.cjs` mantiene un flag persistido `allowLocalProvider` en `userData/csp-state.json`. `electron/security.cjs` registra un filtro `session.webRequest.onBeforeRequest` que consulta ese flag en cada petición y cancela cualquier llamada a `127.0.0.1` o `localhost` salvo:

- `127.0.0.1:5173` (Vite dev) en modo desarrollo;
- cualquier host local cuando `allowLocalProvider` es `true`.

El renderer empuja el flag al main por IPC (`designme:set-csp-state`) cuando el usuario cambia de provider. Si selecciona `local-openai`, el gate se abre; al volver a `deterministic`, `claude-code` o `codex`, se cierra y los siguientes `fetch` a Ollama/LM Studio fallan a nivel de red aunque el CSP del documento los permita.

## IPC

El preload expone una API mínima:

- `exportHtml`;
- `exportBundle`;
- `openExports`;
- `copyText`.
- `providerStart`, `providerStop`, `providerStatus` y `onProviderEvent`;
- `detectLocalSetup`;
- `setCspState` y `getCspState` para sincronizar el gate de red local con el provider activo.

Los payloads se validan en `electron/preload.cjs` y `electron/validators.cjs`. Los handlers en `electron/ipc.cjs` también rechazan emisores cuyo frame URL no sea de confianza.

## Providers

Designme no requiere providers externos, pero la versión 0.2.0 permite usarlos de forma explícita.

- `deterministic` corre en renderer y no usa red.
- `local-openai` llama al `baseUrl` configurado por el usuario. Si apunta a `127.0.0.1`/`localhost`, el flujo puede permanecer local; si apunta a un endpoint remoto, el prompt sale del equipo.
- `claude-code` y `codex` solo existen en desktop. El renderer no puede lanzar procesos directamente: pide un run por IPC y Electron main ejecuta el CLI con `shell: false`.
- Los prompts a Claude Code y Codex se escriben por `stdin`, no en argumentos de proceso.
- Codex se lanza con sandbox `read-only`; Claude Code se lanza con herramientas peligrosas deshabilitadas.
- Los procesos CLI usan workspaces temporales bajo `os.tmpdir()`.

La detección one-click de setups locales solo devuelve señales saneadas: provider, estado, versión, detalle y configuración aplicable a Ollama. No devuelve contenido de `~/.claude/config.json`, `~/.codex/auth.json`, tokens ni secretos.

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

- Las referencias se guardan como texto/metadata en localStorage.
- No se almacenan imágenes grandes, blobs ni base64.
- La mejora de brief activa por defecto es local y determinista.
- No hay llamadas externas ni API keys obligatorias.
- `Local OpenAI` puede usar una API key opcional. Por defecto solo vive en memoria de la sesión. Si el usuario activa "Recordar API key en este equipo" y la app de escritorio tiene `safeStorage` disponible (Keychain macOS / DPAPI Windows / libsecret Linux), la key se cifra y persiste en `userData/secrets.json`. Si `safeStorage` no está disponible (modo web o sin keyring) el checkbox queda deshabilitado y la key nunca toca disco en plaintext.
- Los providers no deterministas son opt-in y se ejecutan solo al pulsar `Generar`.

## Auditoría

```bash
npm run security:audit
```

El audit se ejecuta con `--omit=dev`, porque las herramientas de test/build no forman parte del runtime de producción.
