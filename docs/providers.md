# Providers

Designme Studio 0.2.0 puede generar con un motor determinista local o con providers externos explícitos. El objetivo no es esconder la infraestructura: el usuario ve qué provider está activo, cuándo se envía un prompt y qué estado devuelve cada integración.

## Resumen

| Provider | ID | Dónde corre | Requiere | Privacidad base |
|---|---|---|---|---|
| Determinista | `deterministic` | Renderer local | Nada | No sale nada del equipo |
| Local OpenAI | `local-openai` | Endpoint OpenAI-compatible | Servidor/modelo; API key opcional | Depende del `baseUrl` |
| Claude Code | `claude-code` | Electron + CLI `claude` | CLI instalado y autenticado | El CLI usa la cuenta Claude del usuario |
| Codex | `codex` | Electron + CLI `codex` | CLI instalado y autenticado | El CLI usa la cuenta Codex del usuario |

El provider determinista se actualiza automáticamente con debounce. Los demás providers solo generan cuando el usuario pulsa `Generar`; el botón `Stop` cancela el run activo.

## Contrato Interno

Los providers implementan `src/providers/types.ts`:

- `ProviderId`: `deterministic`, `local-openai`, `claude-code` o `codex`.
- `ProviderStatus`: `idle`, `checking`, `ready` o `error`.
- `GenerateRequest`: prompt, artefacto, dirección, tweaks, brief/intención opcionales y `AbortSignal`.
- `GenerateEvent`: `token`, `tool-call`, `tool-result`, `final` o `error`.

La UI consume ese contrato desde:

- `src/providers/registry.ts`: lista y provider activo.
- `src/hooks/useGenerate.ts`: debounce del determinista, runs manuales del resto y cancelación.
- `src/components/ProviderPicker.tsx`: selección, estado, `Generar` y `Stop`.
- `src/components/AgentStream.tsx`: stream de tokens, herramientas y errores.

## Deterministic

`deterministic` envuelve el motor local de `src/engine/`.

- No necesita red, cuenta ni API key.
- Produce HTML autónomo, crítica y handoff con reglas locales.
- Es el fallback seguro para modo web, offline y test.
- Se recalcula automáticamente al cambiar prompt, artefacto, dirección o tweaks.

Úsalo para iterar rápido, validar estructura, exportar un primer prototipo o trabajar sin modelos.

## Local OpenAI / BYOK

`local-openai` llama a endpoints compatibles con OpenAI Chat Completions.

Campos configurables:

- `baseUrl`: por defecto `http://127.0.0.1:11434/v1`.
- `model`: por defecto `llama3.1:8b`.
- `apiKey`: opcional, solo en memoria de sesión.
- `timeoutMs`: entre 1 y 300 segundos.

Endpoints usados:

- Status: `GET {baseUrl}/models`.
- Generación: `POST {baseUrl}/chat/completions` con `stream: true`.

El payload incluye prompt, tipo de artefacto, dirección, tweaks, brief e intención UX. El sistema pide un único documento HTML standalone, sin fences de Markdown; aun así, el adapter acepta bloques Markdown etiquetados como HTML y extrae el contenido.

### Persistencia De API Keys

Designme no persiste `apiKey`. `src/settings/localOpenAI.ts` guarda solo `baseUrl`, `model` y `timeoutMs` en `localStorage`. Si se introduce una key, se usa en la sesión actual como header:

```txt
Authorization: Bearer <apiKey>
```

No hay keychain ni `safeStorage` todavía. Para gateways remotos, trata la key como credencial temporal y vuelve a introducirla cuando haga falta.

### Compatibilidad Esperada

El adapter está pensado para:

- Ollama con API OpenAI-compatible.
- LM Studio.
- vLLM.
- llama.cpp server OpenAI-compatible.
- Gateways BYOK que implementen `/models`, `/chat/completions` y streaming SSE.

No hay provider dedicado para OpenAI cloud oficial. Si quieres usarlo, configúralo como endpoint OpenAI-compatible y entiende que el prompt saldrá del equipo.

## Ollama

Ollama no es un `ProviderId` separado. Es una detección rápida que configura `local-openai`.

En escritorio, `electron/setupDetection.cjs` comprueba:

- existencia de `~/.config/ollama`;
- respuesta de `http://127.0.0.1:11434/api/tags`;
- primer modelo disponible en `models[].name`.

Si el servidor responde, la UI muestra `Usar Ollama`. Ese botón:

- aplica `baseUrl: http://127.0.0.1:11434/v1`;
- usa el primer modelo detectado si existe;
- activa `local-openai`;
- no importa secretos.

Checklist rápido:

1. Instala Ollama fuera de Designme.
2. Descarga un modelo, por ejemplo `ollama pull llama3.1:8b`.
3. Arranca Ollama.
4. Abre Designme desktop.
5. Pulsa `Usar Ollama` o rellena manualmente `Local OpenAI`.

## Claude Code

`claude-code` está disponible solo en la app desktop. En web mode no existe el bridge `window.designme.providerStart`, así que el provider queda en error/no disponible.

Detección:

- Windows: `where claude`.
- Unix-like: `which claude`.
- Versión: `claude --version`.
- Login/status: `claude /status`.
- Setup local: también se comprueba `~/.claude/config.json` sin devolver su contenido.

Ejecución:

```txt
claude -p --output-format stream-json --input-format text --permission-mode dontAsk --disallowedTools Bash Edit MultiEdit NotebookEdit Write WebFetch WebSearch
```

El prompt se envía por `stdin`, no como argumento de proceso. El proceso corre con `shell: false`, `windowsHide: true` y `stdio` pipe. El workspace temporal es `os.tmpdir()/designme-claude-code`.

Designme acepta eventos `assistant`/`user`/`result`, normaliza tokens y herramientas, y extrae un documento `<!doctype html>...</html>` del texto final.

Limitaciones:

- Designme no instala ni autentica Claude Code.
- El CLI puede comunicarse con el servicio Claude según la cuenta del usuario.
- Las herramientas peligrosas se deshabilitan por flags, pero el contrato final sigue siendo texto HTML.
- Si el CLI no devuelve HTML completo, el run termina en error.

## Codex

`codex` también está disponible solo en desktop.

Detección:

- Windows: `where.exe codex`.
- Unix-like: `which codex`.
- Versión: `codex --version`.
- Login/status: `codex login status`.
- Setup local: también se comprueba `~/.codex/auth.json` sin devolver su contenido.

Ejecución:

```txt
codex --ask-for-approval never exec --json --sandbox read-only --skip-git-repo-check -C <tmp> -
```

El prompt se envía por `stdin`. El workspace temporal es `os.tmpdir()/designme-codex`. El sandbox de Codex se fuerza a `read-only` y no se pide aprobación interactiva.

Designme normaliza eventos JSON de texto, tool calls, tool results y salida final. Igual que Claude Code, el resultado debe contener un HTML standalone completo.

Limitaciones:

- Designme no instala ni autentica Codex.
- El CLI usa la cuenta y configuración local del usuario.
- El sandbox reduce el riesgo de escritura, pero el CLI sigue siendo un proceso local externo.

## Detección One-Click

La detección vive en Electron main y se expone por IPC validado:

```txt
designme:detect-local-setup
```

El renderer recibe solo un resultado saneado:

- `claude-code`: config encontrada, CLI encontrada, versión y detalle.
- `codex`: auth encontrada, CLI encontrada, versión y detalle.
- `ollama`: config encontrada, endpoint listo, `baseUrl` y modelo sugerido.

No se devuelve contenido de `config.json`, `auth.json`, tokens, headers, rutas arbitrarias ni secretos.

## Seguridad Y Privacidad

- Electron valida payloads en preload y main.
- Los handlers IPC comprueban origen con `assertTrustedSender`.
- Los providers CLI se ejecutan con `shell: false`.
- Los prompts a Claude Code y Codex van por `stdin`.
- El preview se mantiene en iframe `sandbox="allow-scripts"` sin `allow-same-origin`.
- La CSP de escritorio permite hosts locales para providers (`127.0.0.1` y `localhost`) porque `Local OpenAI` puede necesitar Ollama/LM Studio.
- `local-openai` no persiste API keys.
- Los providers externos son opt-in por selección y botón `Generar`.

## Troubleshooting

### Local OpenAI Dice Error

- Revisa que `baseUrl` no tenga una ruta duplicada.
- Comprueba que `{baseUrl}/models` responda.
- Si el endpoint requiere key, introdúcela de nuevo en la sesión.
- Asegúrate de que el modelo existe con el nombre exacto.

### Ollama No Se Detecta

- Comprueba `http://127.0.0.1:11434/api/tags`.
- Descarga al menos un modelo.
- Si Ollama escucha en otro puerto, rellena `Local OpenAI` manualmente.

### Claude Code No Está Ready

- Ejecuta `claude --version`.
- Ejecuta `claude /status`.
- Asegúrate de que `claude` está en `PATH`.
- Reinicia Designme si instalaste el CLI con la app abierta.

### Codex No Está Ready

- Ejecuta `codex --version`.
- Ejecuta `codex login status`.
- Asegúrate de que `codex` está en `PATH`.
- Reinicia Designme si instalaste el CLI con la app abierta.

### El Provider Devuelve Error De HTML

Claude Code y Codex deben devolver un documento completo. Si el modelo responde con explicación, Markdown sin documento o HTML parcial, Designme lo rechaza para no romper el preview/export.

## Lo Que Designme No Hace

- No gestiona suscripciones, billing, OAuth ni login de Claude, Codex u OpenAI.
- No guarda API keys en keychain todavía.
- No garantiza privacidad si configuras `baseUrl` remoto.
- No convierte Ollama en provider separado; lo aplica sobre `local-openai`.
- No ejecuta Claude Code/Codex en modo web.
- No publica a hosting ni modifica repos externos desde el output generado.
