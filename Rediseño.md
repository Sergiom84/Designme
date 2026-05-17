# PLAN REDISEÑO DESIGNME → OPEN COWORK CLONE++

## Resumen ejecutivo

Rediseño completo Designme. 3 columnas estilo OCD: **chat-rail izq + dashboard ideas centro + inspector der**. Provider picker top-bar. Flujo: prompt → ask preguntas → genera N variantes → grid. **Extra sobre OCD**: importar carpeta código local + análisis.

Stack permanece (React 18 + TS + Vite + Electron 33). Engine determinista pasa a "fallback offline". Sesiones IDB + referencias + snapshots se conservan, reubicadas en drawer.

---

## Fase 0 — Preparación (medio día)

**Objetivo**: rama limpia + dependencias.

- Branch `redesign/ocd-clone` desde `main`.
- Añadir deps:
  - `@anthropic-ai/sdk` (BYOK Anthropic directa)
  - `openai` (BYOK OpenAI + compat Ollama existente)
  - `marked` + `dompurify` (render chat markdown sin XSS)
  - `chokidar` (electron, watch carpeta importada)
  - `ignore` (respetar `.gitignore` al indexar local code)
  - `react-syntax-highlighter` (preview código)
- Mover `src/components/*` actuales a `src/components/legacy/` (referencia, NO borrar todavía).
- Crear `docs/REDESIGN_PLAN.md` con este plan.

**Archivos tocados**: `package.json`, `package-lock.json`.

---

## Fase 1 — Esqueleto layout 3-col (1 día)

**Objetivo**: AppShell nuevo. Sin lógica todavía.

### Archivos nuevos
```
src/v2/
  App.tsx                    // root nuevo
  layout/
    Shell.tsx                // 3-col grid + top-bar + bottom status
    TopBar.tsx               // logo + provider picker + título proyecto + settings
    LeftRail.tsx             // chat-rail container
    CenterDashboard.tsx      // grid ideas / preview activa
    RightInspector.tsx       // tweaks + ask + design.md + critique
    StatusBar.tsx            // run state, tokens, errors
  state/
    store.ts                 // Zustand store unificado (sustituye 9 useState dispersos)
    types.ts                 // Chat, Idea, Project, Workspace types
```

### Decisiones layout
- Grid CSS: `[chat 360px] [dashboard 1fr] [inspector 380px]` colapsable.
- Top-bar 56px sticky.
- Status-bar 32px bottom.
- Theme dark/light toggle (OCD persiste en `localStorage['open-codesign:theme']` → reusar misma clave bajo `'designme:theme'`).

### `src/v2/App.tsx` reemplaza `src/App.tsx`
- `main.tsx` apunta a `v2/App`.
- `App.tsx` legacy queda en `legacy/AppLegacy.tsx` por si rollback.

---

## Fase 2 — Provider abstraction unificada (1.5 días)

**Objetivo**: provider picker top-bar con BYOK real + CLIs existentes + local.

### Cambios `src/providers/types.ts`
```ts
export type ProviderId =
  | 'deterministic'
  | 'local-openai'         // ollama, lm studio, vllm
  | 'anthropic-api'        // BYOK API key
  | 'openai-api'           // BYOK API key
  | 'claude-code-cli'      // renombrar de 'claude-code'
  | 'codex-cli';

export interface ProviderCapabilities {
  ask: boolean;          // soporta clarifying questions
  multiIdea: boolean;    // soporta N variantes paralelas
  streaming: boolean;
  toolCalls: boolean;
}

export interface Provider {
  id: ProviderId;
  label: string;
  capabilities: ProviderCapabilities;
  status(): Promise<ProviderStatus>;
  generate(req: GenerateRequest): AsyncIterable<GenerateEvent>;
  ask?(req: AskRequest): Promise<AskResponse>;  // NUEVO
}

export interface AskRequest {
  prompt: string;
  workspace?: WorkspaceSnapshot;
  signal: AbortSignal;
}

export interface AskResponse {
  questions: Array<{
    id: string;
    text: string;
    kind: 'single' | 'multi' | 'text';
    options?: string[];
  }>;
}
```

### Providers nuevos
```
src/providers/
  anthropicApi.ts        // SDK @anthropic-ai/sdk, key en SecretStore
  openaiApi.ts           // SDK openai, key en SecretStore
  shared/
    askFlow.ts           // prompt template para genera preguntas JSON
    multiIdea.ts         // helper N=3 generaciones paralelas
    schema.ts            // zod-lite schema validation de respuestas
```

### SecretStore
- Reusar `electron/secretStore.cjs` ya existente (DPAPI Windows).
- Renderer NUNCA toca la key. Provider hace `window.designme.callProvider(id, payload)` → preload → main → SDK con key inyectada.
- Web mode: key en memoria volátil (no persist).

### Provider picker UI
- `TopBar.tsx` muestra dropdown con icono + label + status dot.
- Estado por provider: idle / checking / ready / error.
- Click "Configure…" abre `<ProviderConfigModal>` (API key input, base URL, model selector).
- Setup detection (`useSetupDetection`) se mantiene, ampliado a nuevos providers.

---

## Fase 3 — Chat-rail lateral (2 días)

**Objetivo**: sustituir `LeftPanel` actual por chat de turnos tipo OCD.

### Archivos nuevos
```
src/v2/chat/
  ChatRail.tsx              // container scroll + composer abajo
  ChatTurn.tsx              // burbuja user/assistant con markdown
  Composer.tsx              // textarea autoexpand + attach + send
  AttachmentChip.tsx        // archivo o carpeta adjunta
  AskQuestionCard.tsx       // render preguntas inline en turno assistant
  ToolCallTrace.tsx         // (colapsable) tool calls del provider
```

### Modelo de chat
```ts
type ChatTurn =
  | { id; role: 'user'; text; attachments?: Attachment[]; ts }
  | { id; role: 'assistant'; text; toolCalls?: ToolCall[]; askQuestions?: Question[]; ideas?: IdeaRef[]; ts }
  | { id; role: 'system'; text; ts };

type Attachment =
  | { kind: 'file'; path; size; mime }
  | { kind: 'folder'; path; fileCount; bytes }
  | { kind: 'image'; dataUrl };
```

### Persistencia
- Chat por proyecto en IDB. Reusar `src/sessions/idbStore.ts` ampliado: añadir `chatTurns: ChatTurn[]` al `DesignSession`.
- Migración: sesiones viejas sin `chatTurns` → array vacío.

### Composer features
- `Enter` envía, `Shift+Enter` salto línea.
- Botón paperclip → menu: archivo / carpeta / imagen.
- Indicador "generando…" + botón Stop (reusa `stopGeneration` de `useGenerate`).
- Slash commands locales: `/clear`, `/export`, `/theme dark`, `/provider anthropic-api`.

---

## Fase 4 — Importación + análisis código local (2.5 días)

**Objetivo**: cumplir "Poder incluir en local el código / Que lo analice". **Esto NO existe en OCD**, es extensión.

### IPC nuevo `electron/codeWorkspace.cjs`
```js
ipcMain.handle('codeWorkspace:pick', async () => {
  // dialog.showOpenDialog({properties:['openDirectory']})
});
ipcMain.handle('codeWorkspace:index', async (e, rootPath) => {
  // walk con `ignore` respetando .gitignore + .designmeignore
  // devuelve { files: [{path, size, mime, sha1}], stats }
});
ipcMain.handle('codeWorkspace:readFile', async (e, rootPath, relPath) => {
  // path traversal guard: rel debe quedar dentro de rootPath
  // size cap 1MB por archivo
});
ipcMain.handle('codeWorkspace:watch', async (e, rootPath) => {
  // chokidar → emite 'codeWorkspace:change' a renderer
});
```

### Validación seguridad
- Path traversal: `path.resolve(root, rel).startsWith(root + sep)`.
- Whitelist extensiones: `.ts .tsx .js .jsx .py .rb .go .rs .java .css .scss .html .md .json .yaml .toml`.
- Skip: `node_modules`, `.git`, `dist`, `build`, `.next`, `*.lock`, binarios.
- Tamaño total cap: 50MB / 5k archivos. Si supera → user confirma.

### Analyzer renderer `src/v2/workspace/analyzer.ts`
- Detecta framework: presencia de `next.config`, `vite.config`, `package.json` deps, `tailwind.config`, `tsconfig`.
- Detecta design tokens existentes: busca `:root` CSS vars, `tailwind.config.theme`, `DESIGN.md`.
- Detecta componentes: cuenta archivos `*.tsx` en `src/components/**`.
- Output `WorkspaceAnalysis`:
  ```ts
  {
    framework: 'next'|'vite-react'|'sveltekit'|'unknown';
    styling: 'tailwind'|'css-modules'|'styled-components'|'plain';
    designSystemFound: boolean;
    tokens?: { colors: Record<string,string>; fonts: string[] };
    componentCount: number;
    topComponents: string[];
    hasDesignMd: boolean;
  }
  ```

### UI workspace
- `RightInspector.tsx` añade tab "Workspace".
- Si no hay carpeta: botón "Import folder…".
- Si hay: muestra árbol colapsable + análisis arriba + botón "Re-scan".
- Análisis se inyecta automáticamente en prompt context: `<workspace_context>\n{summary}\n</workspace_context>` antes de cada `generate` o `ask`.

### Provider-side
- `GenerateRequest` añade `workspace?: WorkspaceSnapshot`.
- Cada provider que la soporte (anthropic-api, openai-api, claude-code-cli, codex-cli) pega resumen en system prompt.
- Determinista ignora.

---

## Fase 5 — Flujo ASK (1.5 días)

**Objetivo**: clarifying questions antes de generar (como OCD).

### Trigger
- Auto si prompt < 40 chars o ambiguo (heurística local: keywords vagas).
- Manual: botón "Ask first" junto a "Generate".
- Provider con `capabilities.ask = true` → llama `provider.ask()` antes de `generate()`.

### Prompt template (`src/providers/shared/askFlow.ts`)
```
You are open-codesign-style design partner.
User brief: """{prompt}"""
Workspace summary: {workspace_or_none}

If brief is genuinely ambiguous, return 1-3 questions as JSON:
{"questions":[{"id":"q1","text":"...","kind":"single","options":["A","B"]}]}
If clear enough, return {"questions":[]}.

Only return JSON. No prose.
```

### UI ask
- `AskQuestionCard.tsx` se inyecta como turno assistant.
- Cada pregunta = chips (single), checkboxes (multi), textarea (text).
- Botón "Continue" → respuestas se serializan y concatenan al prompt: `\n\nUser answers:\n- Q: A: ...`.
- Botón "Skip questions" → llama `generate` con prompt original.

### Persistencia
- Q&A guardado como turno chat, no se reejecuta.

---

## Fase 6 — Multi-idea dashboard (2 días)

**Objetivo**: generar N=3 ideas en paralelo, grid clicable.

### Modelo
```ts
type Idea = {
  id: string;
  sessionId: string;
  variantIndex: number;     // 0..N-1
  title: string;            // breve, generado por provider
  html?: string;            // artefacto principal
  designOutput?: DesignOutput;
  thumbnail?: string;       // data URL screenshot iframe
  status: 'pending'|'streaming'|'ready'|'error';
  error?: string;
  createdAt: string;
  providerId: ProviderId;
  promptDigest: string;
};
```

### Generación
- `multiIdea.ts` recibe `{ prompt, workspace, N=3 }`.
- Lanza `N` calls paralelos al provider con system prompt variado:
  - Variant 0: "minimal/editorial"
  - Variant 1: "bold/campaign"
  - Variant 2: "dense/professional"
  - (sacado de `design-methodology.md` de OCD)
- Cada call streamea a su Idea independiente.
- `AbortController` único → Stop cancela todos.

### Dashboard UI `CenterDashboard.tsx`
- Estado vacío: hero centrado "Describe lo que quieres → escribe abajo".
- Generando: grid 2x2 / 3x1 (responsive) con cards. Cada card:
  - Header: variant title + provider + spinner si streaming.
  - Body: iframe sandbox del HTML, escalado `transform: scale(0.4)` + `pointer-events: none`.
  - Footer: botones `[Expand] [Tweak] [Export] [Delete]`.
- Click card → modo "focus": idea ocupa todo el dashboard, las otras quedan en strip lateral.
- Comparativa: shift+click 2 cards → split view.

### Persistencia
- Ideas guardadas en `DesignSession.ideas: Idea[]` en IDB.
- Cap 12 ideas por sesión, FIFO eviction.

---

## Fase 7 — Inspector derecho (1 día)

**Objetivo**: tweaks + design.md + critique en tabs.

### Tabs
1. **Tweaks** — EDITMODE-style (copiar protocolo OCD `tweaks-protocol.md`):
   - Parser que extrae bloque `/*EDITMODE-BEGIN*/...{...}/*EDITMODE-END*/` del HTML.
   - UI: sliders/color pickers por key.
   - Cambios aplican CSS vars `--ocd-tweak-<kebab>` en iframe sin re-generar.
2. **Design.md** — markdown editor para baton multi-screen.
   - Render con `marked` + DOMPurify.
   - Frontmatter parseado: `version`, `name`, `colors`, `typography`.
3. **Critique** — análisis local existente (`src/quality/`) se mantiene.
4. **Workspace** — ver Fase 4.
5. **References** — feature actual movida aquí.

### Reusar
- `TweakControls.tsx`, `CritiqueInspector.tsx`, `ReferenceInspector.tsx`, `HandoffInspector.tsx` actuales → portar a estructura tabs.

---

## Fase 8 — Engine bridge + scaffolds (1.5 días)

**Objetivo**: providers no deterministas devuelven HTML completo. Engine determinista actúa como fallback / preview de tweaks.

### Cambios `src/engine/index.ts`
- Exponer `buildDesignProject(input)` sigue igual (fallback).
- Añadir `wrapProviderHtml(rawHtml, input): DesignOutput` que:
  - Sanitiza con DOMPurify (whitelist CSP).
  - Extrae tokens + critique con analyzers existentes.
  - Empaqueta como `DesignOutput`.

### Scaffolds (mini-versión OCD)
```
src/v2/scaffolds/
  landing.html
  dashboard.html
  deck.html
  report.html
  mobile-app.html
```
- Provider recibe scaffold opcional según `artifactType` en system prompt.
- Reduce alucinación de estructura, mejora consistencia.

### Prompts mejorados
- `src/providers/prompts/` añadir `system-base.md` (basado en OCD `identity.md` + `output-rules.md` + `safety.md`).
- Cada provider compone: `system-base.md` + scaffold + workspace context + user prompt.

---

## Fase 9 — Sesiones drawer (medio día)

**Objetivo**: sesiones/versiones/comparativa siguen accesibles pero no estorban.

- `TopBar.tsx` botón "Projects" → abre `<SessionsDrawer>` modal lateral.
- Lista igual a `LeftPanel` actual (recientes, versiones, snapshots).
- "New project" desde drawer crea sesión vacía y cierra.
- Compare versions queda en drawer.

---

## Fase 10 — Comentarios sobre preview (medio día)

**Objetivo**: feature actual de comentarios sobre iframe se mantiene en idea expanded.

- Click "Comment mode" en card expanded → overlay clicks generan pins.
- Pins guardados en `Idea.comments[]`.
- Próximo Generate concatena comentarios al prompt (lógica actual `appendPreviewCommentsToPrompt`).

---

## Fase 11 — Endurecimiento + tests (1.5 días)

### Tests unit (Vitest)
- `askFlow.test.ts`: parsing JSON respuesta, fallback si JSON inválido.
- `multiIdea.test.ts`: N variants, abort cancela todos, errores aislados por variante.
- `workspace/analyzer.test.ts`: detección framework, tokens, path traversal.
- `secretStore`: ya tiene cobertura.

### E2E (Playwright)
- `redesign-flow.spec.ts`:
  1. Abre app → ve 3 cols.
  2. Escribe brief vago → recibe ask → responde → genera 3 ideas → click una → expande.
  3. Importa carpeta → ve análisis → re-genera con contexto.
  4. Export HTML idea expandida.
- Axe en dashboard y modals.

### Security
- CSP renderer: `default-src 'self'; script-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://api.anthropic.com https://api.openai.com http://127.0.0.1:*; frame-src 'self' blob:`.
- Iframes ideas: `sandbox="allow-scripts allow-same-origin"` solo si HTML pasa sanitización; si no, `sandbox="allow-scripts"`.
- IPC origin check en cada handler (ya existe en `electron/security.cjs`).
- Secret keys: validar formato (anthropic `sk-ant-`, openai `sk-`) antes de guardar.

---

## Fase 12 — Limpieza + docs (medio día)

- Borrar `src/components/legacy/` si todo pasa.
- Borrar `legacy/AppLegacy.tsx`.
- Actualizar README con screenshots nuevos.
- `CHANGELOG.md`: entrada `v0.3.0 — Redesign OCD-inspired`.
- `docs/architecture.md`: nuevo diagrama 3-col + flow ask → multi-idea.

---

## Orden de ejecución sugerido

| Sprint | Fases | Días |
|--------|-------|------|
| 1 | 0, 1, 2 | 3 |
| 2 | 3, 5 | 3.5 |
| 3 | 4 (workspace local) | 2.5 |
| 4 | 6, 7 | 3 |
| 5 | 8, 9, 10 | 2.5 |
| 6 | 11, 12 | 2 |
| **Total** | | **~16.5 días** |

---

## Riesgos + mitigación

- **Riesgo**: SDK Anthropic en renderer expone API key. **Mitig**: SDK SOLO en main process via IPC. Renderer nunca ve key.
- **Riesgo**: N=3 ideas paralelas saturan rate-limit BYOK. **Mitig**: cola con max 2 concurrentes + retry exponential.
- **Riesgo**: Indexar repo grande bloquea UI. **Mitig**: worker thread + progress bar + cancel.
- **Riesgo**: HTML provider malicioso (inyección desde modelo). **Mitig**: DOMPurify + sandboxed iframe + CSP estricta.
- **Riesgo**: Migración IDB rompe sesiones existentes. **Mitig**: schema version bump + migrator con backup `designme.sessions.v1.backup`.

---

## Archivos clave creados (~40 nuevos)

```
src/v2/
  App.tsx, layout/*, chat/*, workspace/*, scaffolds/*, state/*
src/providers/
  anthropicApi.ts, openaiApi.ts, shared/{askFlow,multiIdea,schema}.ts
electron/
  codeWorkspace.cjs
docs/
  REDESIGN_PLAN.md
```

## Archivos modificados (~15)

```
src/main.tsx, src/providers/{types,registry,index}.ts
src/sessions/{idbStore,index}.ts (chatTurns, ideas)
src/engine/index.ts (wrapProviderHtml)
electron/{main,preload,ipc}.cjs
package.json, README.md, CHANGELOG.md
```

---

