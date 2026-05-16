export type ArtifactType = 'web' | 'software' | 'dashboard' | 'mobile' | 'deck' | 'infographic';
export type DirectionId = 'systems' | 'editorial' | 'kinetic';
export type Density = 'calm' | 'balanced' | 'dense';
export type Motion = 'still' | 'measured' | 'expressive';
export type Tone = 'light' | 'contrast' | 'ink';

export interface ArtifactOption {
  id: ArtifactType;
  label: string;
  hint: string;
}

export interface DesignDirection {
  id: DirectionId;
  name: string;
  school: string;
  promise: string;
  bestFor: string;
  palette: {
    ink: string;
    paper: string;
    surface: string;
    subtle: string;
    accent: string;
    secondary: string;
    highlight: string;
  };
}

export interface DesignTweaks {
  density: Density;
  tone: Tone;
  motion: Motion;
  radius: number;
  showDevice: boolean;
}

export interface BuildInput {
  prompt: string;
  artifactType: ArtifactType;
  directionId: DirectionId;
  tweaks: DesignTweaks;
}

export interface Critique {
  total: number;
  scores: Array<{ label: string; value: number }>;
  keep: string[];
  fix: string[];
  quickWins: string[];
}

export interface DesignOutput {
  name: string;
  exportName: string;
  briefSummary: string;
  assumptions: string[];
  sections: string[];
  features: string[];
  html: string;
  handoffPrompt: string;
  critique: Critique;
  direction: DesignDirection;
}

interface DerivedBrief {
  rawPrompt: string;
  name: string;
  topic: string;
  audience: string;
  objective: string;
  sections: string[];
  features: string[];
}

export const artifactOptions: ArtifactOption[] = [
  { id: 'software', label: 'Software', hint: 'B2B, SaaS, CRM, ops tools' },
  { id: 'web', label: 'Web', hint: 'Homepage, docs, product page' },
  { id: 'dashboard', label: 'Dashboard', hint: 'Metrics, pipelines, monitoring' },
  { id: 'mobile', label: 'App', hint: 'iOS or Android prototype' },
  { id: 'deck', label: 'Slides', hint: 'Pitch, keynote, sales deck' },
  { id: 'infographic', label: 'Info', hint: 'Explainer, report, visual data' },
];

export const designDirections: DesignDirection[] = [
  {
    id: 'systems',
    name: 'Sistema operativo',
    school: 'Producto local-first',
    promise: 'Interfaz densa, clara y preparada para uso diario.',
    bestFor: 'Dashboards, backoffices, CRMs, herramientas internas.',
    palette: {
      ink: '#17191c',
      paper: '#f5f1e8',
      surface: '#fffdf8',
      subtle: '#dfd8c8',
      accent: '#0f766e',
      secondary: '#be5b3d',
      highlight: '#d9b84f',
    },
  },
  {
    id: 'editorial',
    name: 'Editorial funcional',
    school: 'Informacion con pulso',
    promise: 'Jerarquia fuerte, ritmo tipografico y narrativa visible.',
    bestFor: 'Webs, decks, informes, productos que necesitan explicar.',
    palette: {
      ink: '#161412',
      paper: '#f8f4ec',
      surface: '#ffffff',
      subtle: '#e3ded3',
      accent: '#9b3f31',
      secondary: '#1e6f9f',
      highlight: '#d8b53f',
    },
  },
  {
    id: 'kinetic',
    name: 'Prototipo cinetico',
    school: 'Movimiento medido',
    promise: 'Estados vivos, microinteracciones y sensacion de producto real.',
    bestFor: 'Apps moviles, demos, launch screens y prototipos con flujo.',
    palette: {
      ink: '#121417',
      paper: '#f2f5ef',
      surface: '#fbfcf8',
      subtle: '#d8dfd6',
      accent: '#d76642',
      secondary: '#16858f',
      highlight: '#b6cf50',
    },
  },
];

export const defaultTweaks: DesignTweaks = {
  density: 'balanced',
  tone: 'light',
  motion: 'measured',
  radius: 6,
  showDevice: true,
};

const fallbackPrompts: Record<ArtifactType, string> = {
  software:
    'Un estudio para planificar, generar y revisar pantallas de software para equipos de producto.',
  web: 'Una web de producto para presentar una herramienta nueva y convertir visitantes en demos.',
  dashboard: 'Un dashboard ejecutivo para ver actividad, riesgos y siguientes acciones.',
  mobile: 'Una app movil de productividad con onboarding, foco y seguimiento semanal.',
  deck: 'Un deck de lanzamiento para explicar una idea compleja con claridad y ritmo visual.',
  infographic: 'Una infografia que convierte datos dispersos en una historia visual accionable.',
};

const sectionBank: Record<ArtifactType, string[]> = {
  software: ['Command center', 'Work queue', 'Insight panel', 'Action drawer', 'Audit trail'],
  web: ['First viewport', 'Product proof', 'Use cases', 'Workflow', 'Conversion rail'],
  dashboard: ['Overview', 'Signal board', 'Pipeline', 'Alerts', 'Decision log'],
  mobile: ['Home', 'Capture', 'Detail', 'Progress', 'Settings'],
  deck: ['Opening claim', 'Market tension', 'Solution', 'Proof', 'Next step'],
  infographic: ['Core thesis', 'Data spine', 'Comparison', 'Implications', 'Action box'],
};

const featureBank: Record<ArtifactType, string[]> = {
  software: [
    'workspace navigation',
    'stateful task table',
    'inline review comments',
    'quick command bar',
    'export-ready file panel',
  ],
  web: [
    'clear first viewport',
    'proof modules',
    'interactive product strip',
    'pricing signal',
    'conversion footer',
  ],
  dashboard: [
    'live metric cards',
    'risk queue',
    'trend chart',
    'owner filters',
    'decision summary',
  ],
  mobile: [
    'realistic phone frame',
    'bottom navigation',
    'screen switching',
    'gesture-sized controls',
    'progress feedback',
  ],
  deck: [
    'slide rail',
    'speaker notes',
    'narrative arc',
    'visual proof slide',
    'editable section labels',
  ],
  infographic: [
    'data hierarchy',
    'comparison grid',
    'callout labels',
    'source strip',
    'print-friendly rhythm',
  ],
};

const keywordFeatures: Array<[RegExp, string]> = [
  [/ai|ia|agent|agente|automat/i, 'agent activity timeline'],
  [/crm|ventas|sales|pipeline/i, 'pipeline health view'],
  [/financ|bank|invoice|factura|pago/i, 'trust and compliance strip'],
  [/health|salud|clinic|medic/i, 'care-safe status markers'],
  [/learn|curso|educ|academy|school/i, 'learning progression map'],
  [/market|campaign|landing|growth/i, 'campaign experiment slots'],
  [/design|figma|prototype|prototipo/i, 'design review checklist'],
  [/team|equipo|operac|ops/i, 'team ownership lanes'],
];

function byId(id: DirectionId): DesignDirection {
  return designDirections.find((direction) => direction.id === id) ?? designDirections[0];
}

function stripNoise(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/[<>]/g, '').trim();
}

function titleCase(value: string): string {
  return stripNoise(value)
    .split(/\s+/)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function extractName(prompt: string, type: ArtifactType): string {
  const quoted = prompt.match(/["'`](.{3,64})["'`]/);
  if (quoted?.[1]) return titleCase(quoted[1]);

  if (/\b(disenador|diseñador|designer)\b/i.test(prompt)) {
    return 'Designme Studio';
  }

  const named = prompt.match(
    /\b(?:para|for|llamado|called|sobre|de)\s+([\p{L}0-9][\p{L}0-9 &.-]{2,58})/iu,
  );
  if (named?.[1]) {
    const cleaned = named[1].split(/[,.!?;:]/)[0];
    if (!/^(apps?|software|webs?|sitio|producto|herramienta|dashboard|panel)\b/i.test(cleaned)) {
      return titleCase(cleaned);
    }
  }

  const fallbacks: Record<ArtifactType, string> = {
    software: 'Designme OS',
    web: 'Designme Web',
    dashboard: 'Signal Desk',
    mobile: 'Focus App',
    deck: 'Launch Narrative',
    infographic: 'Signal Map',
  };
  return fallbacks[type];
}

function inferAudience(prompt: string, type: ArtifactType): string {
  if (/developer|dev|api|engineer|program/i.test(prompt)) return 'equipos tecnicos';
  if (/ceo|founder|director|executive|ejecut/i.test(prompt)) return 'decision makers';
  if (/cliente|customer|usuario|consumer/i.test(prompt)) return 'usuarios finales';
  if (/sales|ventas|marketing|growth/i.test(prompt)) return 'equipos comerciales';
  if (type === 'dashboard' || type === 'software') return 'equipos operativos';
  return 'personas que necesitan entender rapido';
}

function inferObjective(prompt: string, type: ArtifactType): string {
  if (/vender|convert|lead|demo|signup|registro/i.test(prompt)) return 'convertir interes en accion';
  if (/monitor|metric|kpi|seguimiento|control/i.test(prompt)) return 'hacer visible el estado real';
  if (/explicar|teach|curso|aprender|understand/i.test(prompt)) return 'explicar sin perder precision';
  if (/organizar|plan|task|tarea|workflow/i.test(prompt)) return 'coordinar trabajo sin friccion';
  if (type === 'deck') return 'defender una narrativa con pruebas';
  return 'pasar de idea vaga a prototipo revisable';
}

function deriveBrief(prompt: string, artifactType: ArtifactType): DerivedBrief {
  const rawPrompt = stripNoise(prompt) || fallbackPrompts[artifactType];
  const name = extractName(rawPrompt, artifactType);
  const topic = rawPrompt.length > 150 ? `${rawPrompt.slice(0, 147)}...` : rawPrompt;
  const audience = inferAudience(rawPrompt, artifactType);
  const objective = inferObjective(rawPrompt, artifactType);
  const sections = sectionBank[artifactType];
  const featureSet = new Set(featureBank[artifactType]);

  for (const [pattern, feature] of keywordFeatures) {
    if (pattern.test(rawPrompt)) featureSet.add(feature);
  }

  return {
    rawPrompt,
    name,
    topic,
    audience,
    objective,
    sections,
    features: Array.from(featureSet).slice(0, 8),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function renderMetricCards(brief: DerivedBrief): string {
  const metrics = [
    ['Clarity', '92', 'brief coverage'],
    ['Momentum', '+18%', 'next actions'],
    ['Risk', '3', 'items to resolve'],
  ];

  return metrics
    .map(
      ([label, value, caption]) => `
        <article class="metric-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <small>${escapeHtml(caption)} for ${escapeHtml(brief.name)}</small>
        </article>
      `,
    )
    .join('');
}

function renderFeatureList(brief: DerivedBrief): string {
  return brief.features
    .slice(0, 5)
    .map(
      (feature, index) => `
        <li>
          <span class="index">${String(index + 1).padStart(2, '0')}</span>
          <span>${escapeHtml(feature)}</span>
        </li>
      `,
    )
    .join('');
}

function renderTimeline(brief: DerivedBrief): string {
  return brief.sections
    .slice(0, 5)
    .map(
      (section, index) => `
        <button class="step-button ${index === 0 ? 'is-active' : ''}" data-screen="${index}">
          <span>${escapeHtml(section)}</span>
          <small>${index === 0 ? 'live' : 'queued'}</small>
        </button>
      `,
    )
    .join('');
}

function renderSoftware(brief: DerivedBrief): string {
  return `
    <div class="artifact-shell software-shell">
      <aside class="rail">
        <div class="mark">${escapeHtml(brief.name.slice(0, 2).toUpperCase())}</div>
        ${brief.sections
          .slice(0, 4)
          .map((section, index) => `<button class="${index === 0 ? 'active' : ''}">${escapeHtml(section)}</button>`)
          .join('')}
      </aside>
      <main class="workspace">
        <header class="hero-strip">
          <div>
            <p class="eyebrow">Local design workspace</p>
            <h1>${escapeHtml(brief.name)}</h1>
            <p>${escapeHtml(brief.objective)} for ${escapeHtml(brief.audience)}.</p>
          </div>
          <button class="primary-action">Ship review</button>
        </header>
        <section class="metric-grid">${renderMetricCards(brief)}</section>
        <section class="split-grid">
          <article class="module large">
            <div class="module-head">
              <span>Active work</span>
              <strong>${escapeHtml(brief.sections[1])}</strong>
            </div>
            <div class="task-table">
              ${brief.features
                .slice(0, 5)
                .map(
                  (feature, index) => `
                    <button class="task-row">
                      <span>${escapeHtml(feature)}</span>
                      <small>${index % 2 === 0 ? 'ready' : 'needs input'}</small>
                    </button>
                  `,
                )
                .join('')}
            </div>
          </article>
          <article class="module">
            <div class="module-head">
              <span>Design intent</span>
              <strong>Critique path</strong>
            </div>
            <ul class="feature-list">${renderFeatureList(brief)}</ul>
          </article>
        </section>
      </main>
    </div>
  `;
}

function renderDashboard(brief: DerivedBrief): string {
  return `
    <div class="artifact-shell dashboard-shell">
      <main class="workspace full">
        <header class="hero-strip compact">
          <div>
            <p class="eyebrow">Decision dashboard</p>
            <h1>${escapeHtml(brief.name)}</h1>
          </div>
          <div class="segmented">
            <button class="active">Week</button>
            <button>Month</button>
            <button>Quarter</button>
          </div>
        </header>
        <section class="metric-grid">${renderMetricCards(brief)}</section>
        <section class="analytics-grid">
          <article class="module chart-module">
            <div class="module-head">
              <span>${escapeHtml(brief.objective)}</span>
              <strong>Signal trend</strong>
            </div>
            <div class="bars">
              <i style="height: 46%"></i><i style="height: 68%"></i><i style="height: 58%"></i>
              <i style="height: 83%"></i><i style="height: 74%"></i><i style="height: 91%"></i>
            </div>
          </article>
          <article class="module">
            <div class="module-head">
              <span>Owner queue</span>
              <strong>Next actions</strong>
            </div>
            <ul class="feature-list">${renderFeatureList(brief)}</ul>
          </article>
        </section>
      </main>
    </div>
  `;
}

function renderWeb(brief: DerivedBrief): string {
  return `
    <div class="artifact-shell web-shell">
      <nav class="site-nav">
        <strong>${escapeHtml(brief.name)}</strong>
        <span>Product</span><span>Proof</span><span>Workflow</span>
        <button>Request demo</button>
      </nav>
      <main class="web-main">
        <section class="web-hero">
          <div>
            <p class="eyebrow">Built for ${escapeHtml(brief.audience)}</p>
            <h1>${escapeHtml(brief.objective)}.</h1>
            <p>${escapeHtml(brief.topic)}</p>
            <div class="hero-actions">
              <button class="primary-action">Start prototype</button>
              <button class="ghost-action">View system</button>
            </div>
          </div>
          <div class="product-shot" aria-label="Generated product preview">
            <div class="shot-top"></div>
            <div class="shot-grid">
              <span></span><span></span><span></span><span></span>
            </div>
            <div class="shot-panel">${renderMetricCards(brief)}</div>
          </div>
        </section>
        <section class="proof-row">
          ${brief.features
            .slice(0, 3)
            .map((feature) => `<article><strong>${escapeHtml(feature)}</strong><span>${escapeHtml(brief.objective)}</span></article>`)
            .join('')}
        </section>
      </main>
    </div>
  `;
}

function renderMobile(brief: DerivedBrief, showDevice: boolean): string {
  const phoneClass = showDevice ? 'phone-frame' : 'phone-frame no-device';
  return `
    <div class="artifact-shell mobile-shell">
      <section class="${phoneClass}">
        <div class="phone-top"></div>
        <main class="phone-screen">
          <p class="eyebrow">Today</p>
          <h1>${escapeHtml(brief.name)}</h1>
          <div class="focus-card">
            <span>${escapeHtml(brief.objective)}</span>
            <strong>3 actions ready</strong>
          </div>
          <div class="mini-list">
            ${brief.features
              .slice(0, 4)
              .map((feature, index) => `<button data-screen="${index}"><span>${escapeHtml(feature)}</span><small>${index + 1}</small></button>`)
              .join('')}
          </div>
        </main>
        <nav class="phone-nav">
          ${brief.sections
            .slice(0, 4)
            .map((section, index) => `<button class="${index === 0 ? 'active' : ''}" data-screen="${index}">${escapeHtml(section.split(' ')[0])}</button>`)
            .join('')}
        </nav>
      </section>
      <aside class="mobile-context">
        <p class="eyebrow">Prototype map</p>
        <h2>Clickable states</h2>
        <div class="timeline">${renderTimeline(brief)}</div>
      </aside>
    </div>
  `;
}

function renderDeck(brief: DerivedBrief): string {
  return `
    <div class="artifact-shell deck-shell">
      <aside class="slide-rail">
        ${brief.sections
          .slice(0, 5)
          .map((section, index) => `<button class="${index === 0 ? 'active' : ''}">${index + 1}. ${escapeHtml(section)}</button>`)
          .join('')}
      </aside>
      <main class="slide-stage">
        <p class="eyebrow">Narrative deck</p>
        <h1>${escapeHtml(brief.name)}</h1>
        <p>${escapeHtml(brief.topic)}</p>
        <div class="slide-proof">
          <span>${escapeHtml(brief.objective)}</span>
          <strong>${escapeHtml(brief.audience)}</strong>
        </div>
        <ul class="feature-list">${renderFeatureList(brief)}</ul>
      </main>
      <aside class="speaker-notes">
        <span>Speaker notes</span>
        <p>Open with the tension, show the system, then ask for one concrete next step.</p>
      </aside>
    </div>
  `;
}

function renderInfographic(brief: DerivedBrief): string {
  return `
    <div class="artifact-shell infographic-shell">
      <main class="poster">
        <p class="eyebrow">Visual explainer</p>
        <h1>${escapeHtml(brief.objective)}</h1>
        <p>${escapeHtml(brief.topic)}</p>
        <section class="poster-grid">
          ${brief.sections
            .slice(0, 4)
            .map(
              (section, index) => `
                <article>
                  <span>${String(index + 1).padStart(2, '0')}</span>
                  <strong>${escapeHtml(section)}</strong>
                  <p>${escapeHtml(brief.features[index] ?? brief.objective)}</p>
                </article>
              `,
            )
            .join('')}
        </section>
      </main>
    </div>
  `;
}

function renderArtifact(brief: DerivedBrief, type: ArtifactType, tweaks: DesignTweaks): string {
  if (type === 'dashboard') return renderDashboard(brief);
  if (type === 'web') return renderWeb(brief);
  if (type === 'mobile') return renderMobile(brief, tweaks.showDevice);
  if (type === 'deck') return renderDeck(brief);
  if (type === 'infographic') return renderInfographic(brief);
  return renderSoftware(brief);
}

function buildHtml(
  brief: DerivedBrief,
  type: ArtifactType,
  direction: DesignDirection,
  tweaks: DesignTweaks,
): string {
  const title = escapeHtml(brief.name);
  const artifact = renderArtifact(brief, type, tweaks);
  const palette = direction.palette;
  const motionMs = tweaks.motion === 'still' ? 0 : tweaks.motion === 'measured' ? 180 : 360;
  const densityGap = tweaks.density === 'calm' ? 22 : tweaks.density === 'dense' ? 10 : 16;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    :root {
      --ink: ${palette.ink};
      --paper: ${palette.paper};
      --surface: ${palette.surface};
      --subtle: ${palette.subtle};
      --accent: ${palette.accent};
      --secondary: ${palette.secondary};
      --highlight: ${palette.highlight};
      --radius: ${tweaks.radius}px;
      --gap: ${densityGap}px;
      --motion: ${motionMs}ms;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background: var(--paper);
      letter-spacing: 0;
    }
    * { box-sizing: border-box; }
    html, body { min-height: 100%; margin: 0; }
    body {
      background:
        linear-gradient(90deg, color-mix(in srgb, var(--accent) 7%, transparent), transparent 34%),
        repeating-linear-gradient(0deg, rgba(18, 20, 23, 0.035) 0 1px, transparent 1px 32px),
        var(--paper);
      padding: clamp(18px, 3vw, 34px);
    }
    button {
      font: inherit;
      color: inherit;
      border: 1px solid color-mix(in srgb, var(--ink) 14%, transparent);
      border-radius: var(--radius);
      background: color-mix(in srgb, var(--surface) 94%, var(--accent));
      cursor: pointer;
      transition: transform var(--motion) ease, border-color var(--motion) ease, background var(--motion) ease;
    }
    button:hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--accent) 55%, var(--ink)); }
    .artifact-shell {
      min-height: calc(100vh - clamp(36px, 6vw, 68px));
      display: grid;
      gap: var(--gap);
      color: var(--ink);
    }
    .rail, .module, .metric-card, .site-nav, .product-shot, .proof-row article, .phone-frame, .mobile-context, .slide-stage, .speaker-notes, .slide-rail, .poster, .tweak-dock {
      background: color-mix(in srgb, var(--surface) 94%, white);
      border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
      border-radius: var(--radius);
      box-shadow: 0 18px 50px rgba(16, 18, 20, 0.08);
    }
    .software-shell { grid-template-columns: 220px minmax(0, 1fr); }
    .dashboard-shell, .web-shell, .infographic-shell { grid-template-columns: 1fr; }
    .mobile-shell { grid-template-columns: minmax(320px, 430px) minmax(260px, 1fr); align-items: center; justify-content: center; }
    .deck-shell { grid-template-columns: 210px minmax(0, 1fr) 260px; align-items: stretch; }
    .rail, .slide-rail { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .mark { width: 44px; height: 44px; display: grid; place-items: center; border-radius: var(--radius); background: var(--ink); color: var(--paper); font-weight: 800; margin-bottom: 12px; }
    .rail button, .slide-rail button, .step-button { width: 100%; text-align: left; padding: 11px 12px; background: transparent; }
    .rail button.active, .slide-rail button.active, .step-button.is-active, .segmented .active, .phone-nav .active {
      background: color-mix(in srgb, var(--accent) 16%, var(--surface));
      border-color: color-mix(in srgb, var(--accent) 46%, var(--ink));
    }
    .workspace { display: grid; grid-template-rows: auto auto 1fr; gap: var(--gap); min-width: 0; }
    .workspace.full { grid-template-rows: auto auto 1fr; }
    .hero-strip, .site-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: clamp(18px, 3vw, 28px);
      background: color-mix(in srgb, var(--surface) 92%, var(--highlight));
      border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
      border-radius: var(--radius);
    }
    .hero-strip.compact { padding: 18px 22px; }
    .eyebrow { margin: 0 0 8px; color: var(--accent); text-transform: uppercase; font-size: 12px; font-weight: 800; }
    h1 { margin: 0; font-size: clamp(34px, 7vw, 82px); line-height: 0.96; max-width: 12ch; text-wrap: balance; }
    h2 { margin: 0; font-size: clamp(28px, 4vw, 48px); line-height: 1; }
    p { line-height: 1.55; max-width: 68ch; }
    .hero-strip p, .web-hero p, .poster > p, .slide-stage > p { color: color-mix(in srgb, var(--ink) 72%, var(--surface)); }
    .primary-action, .ghost-action { min-height: 42px; padding: 0 16px; font-weight: 800; }
    .primary-action { background: var(--ink); color: var(--paper); }
    .ghost-action { background: transparent; }
    .metric-grid, .proof-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--gap); }
    .metric-card, .proof-row article { padding: 16px; display: grid; gap: 8px; min-width: 0; }
    .metric-card strong { font-size: clamp(30px, 4vw, 56px); line-height: 1; }
    .metric-card span, .module-head span, .proof-row span, .speaker-notes span { color: color-mix(in srgb, var(--ink) 58%, var(--surface)); font-size: 12px; text-transform: uppercase; font-weight: 800; }
    .metric-card small, .task-row small, .step-button small { color: color-mix(in srgb, var(--ink) 58%, var(--surface)); }
    .split-grid, .analytics-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr); gap: var(--gap); }
    .module { padding: 18px; min-width: 0; }
    .module.large { min-height: 330px; }
    .module-head { display: flex; align-items: start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    .module-head strong { font-size: 20px; }
    .task-table, .feature-list, .timeline, .mini-list { display: grid; gap: 10px; padding: 0; margin: 0; list-style: none; }
    .task-row, .mini-list button { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px; text-align: left; background: color-mix(in srgb, var(--surface) 90%, var(--paper)); }
    .feature-list li { display: grid; grid-template-columns: 42px 1fr; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid color-mix(in srgb, var(--ink) 10%, transparent); }
    .index { color: var(--secondary); font-weight: 900; }
    .bars { height: 280px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; align-items: end; padding-top: 24px; }
    .bars i { display: block; border-radius: var(--radius) var(--radius) 0 0; background: linear-gradient(180deg, var(--accent), var(--secondary)); }
    .site-nav { margin-bottom: var(--gap); }
    .site-nav span { color: color-mix(in srgb, var(--ink) 60%, var(--surface)); }
    .web-hero { display: grid; grid-template-columns: minmax(0, 0.92fr) minmax(320px, 1.08fr); gap: var(--gap); align-items: center; }
    .web-hero > div:first-child { padding: clamp(18px, 4vw, 46px) 0; }
    .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 22px; }
    .product-shot { min-height: 470px; padding: 18px; display: grid; grid-template-rows: 44px 1fr auto; gap: 14px; }
    .shot-top { border-radius: var(--radius); background: var(--ink); }
    .shot-grid { display: grid; grid-template-columns: 1fr 1.3fr; grid-template-rows: 1fr 1fr; gap: 12px; }
    .shot-grid span { border-radius: var(--radius); background: color-mix(in srgb, var(--accent) 18%, var(--surface)); border: 1px solid color-mix(in srgb, var(--accent) 24%, transparent); }
    .shot-grid span:nth-child(2) { background: color-mix(in srgb, var(--secondary) 18%, var(--surface)); }
    .shot-grid span:nth-child(3) { background: color-mix(in srgb, var(--highlight) 34%, var(--surface)); }
    .shot-panel { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .shot-panel .metric-card { box-shadow: none; padding: 12px; }
    .phone-frame { width: min(100%, 390px); margin-inline: auto; padding: 16px; border-radius: 34px; background: #15171a; color: var(--paper); }
    .phone-frame.no-device { border-radius: var(--radius); background: transparent; color: var(--ink); }
    .phone-top { width: 110px; height: 28px; margin: 0 auto 12px; border-radius: 20px; background: #050607; }
    .no-device .phone-top { display: none; }
    .phone-screen { min-height: 570px; padding: 24px; border-radius: 24px; background: var(--paper); color: var(--ink); display: grid; align-content: start; gap: 18px; }
    .focus-card { padding: 18px; border-radius: var(--radius); background: var(--ink); color: var(--paper); display: grid; gap: 8px; }
    .focus-card strong { font-size: 32px; line-height: 1; }
    .phone-nav { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding-top: 12px; }
    .phone-nav button { min-height: 42px; color: var(--paper); background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.16); font-size: 12px; }
    .no-device .phone-nav button { color: var(--ink); background: var(--surface); border-color: color-mix(in srgb, var(--ink) 12%, transparent); }
    .mobile-context { padding: clamp(18px, 3vw, 28px); }
    .slide-stage { padding: clamp(24px, 5vw, 64px); display: grid; align-content: center; gap: 18px; }
    .slide-proof { display: flex; justify-content: space-between; gap: 18px; border-top: 2px solid var(--ink); padding-top: 18px; }
    .slide-proof strong { color: var(--accent); }
    .speaker-notes { padding: 18px; }
    .poster { padding: clamp(24px, 5vw, 70px); min-height: calc(100vh - 68px); }
    .poster-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--gap); margin-top: clamp(24px, 5vw, 70px); }
    .poster-grid article { min-height: 260px; border-top: 3px solid var(--ink); padding-top: 16px; display: grid; align-content: space-between; }
    .poster-grid span { font-size: 44px; font-weight: 900; color: var(--accent); }
    .poster-grid strong { font-size: 22px; }
    .segmented { display: flex; gap: 6px; padding: 4px; border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent); border-radius: var(--radius); background: color-mix(in srgb, var(--paper) 65%, var(--surface)); }
    .segmented button { border: 0; min-height: 34px; padding: 0 12px; }
    .tweak-dock { position: fixed; right: 16px; bottom: 16px; z-index: 20; display: flex; gap: 8px; padding: 8px; }
    .tweak-dock button { width: 38px; height: 38px; padding: 0; font-weight: 900; }
    body[data-scheme="contrast"] { --paper: #111417; --surface: #1b2025; --ink: #f6f0e6; --subtle: #33404a; }
    body[data-density="dense"] { --gap: 10px; }
    body[data-density="calm"] { --gap: 24px; }
    @media (max-width: 980px) {
      body { padding: 14px; }
      .software-shell, .mobile-shell, .deck-shell, .web-hero, .split-grid, .analytics-grid { grid-template-columns: 1fr; }
      .rail, .slide-rail, .speaker-notes { order: 2; }
      .metric-grid, .proof-row, .poster-grid, .shot-panel { grid-template-columns: 1fr; }
      .site-nav { flex-wrap: wrap; }
      h1 { max-width: 100%; }
    }
  </style>
</head>
<body data-density="${tweaks.density}" data-scheme="${tweaks.tone === 'ink' ? 'contrast' : 'light'}">
  ${artifact}
  <div class="tweak-dock" aria-label="Standalone tweaks">
    <button type="button" data-density-toggle title="Density">D</button>
    <button type="button" data-scheme-toggle title="Scheme">S</button>
  </div>
  <script>
    const savedDensity = localStorage.getItem('designme-density');
    const savedScheme = localStorage.getItem('designme-scheme');
    if (savedDensity) document.body.dataset.density = savedDensity;
    if (savedScheme) document.body.dataset.scheme = savedScheme;
    document.querySelector('[data-density-toggle]')?.addEventListener('click', () => {
      const order = ['calm', 'balanced', 'dense'];
      const current = document.body.dataset.density || 'balanced';
      const next = order[(order.indexOf(current) + 1) % order.length];
      document.body.dataset.density = next;
      localStorage.setItem('designme-density', next);
    });
    document.querySelector('[data-scheme-toggle]')?.addEventListener('click', () => {
      const next = document.body.dataset.scheme === 'contrast' ? 'light' : 'contrast';
      document.body.dataset.scheme = next;
      localStorage.setItem('designme-scheme', next);
    });
    document.querySelectorAll('[data-screen]').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('[data-screen]').forEach((el) => el.classList.remove('is-active', 'active'));
        button.classList.add(button.classList.contains('step-button') ? 'is-active' : 'active');
      });
    });
  <\/script>
</body>
</html>`;
}

function buildCritique(brief: DerivedBrief, direction: DesignDirection, tweaks: DesignTweaks): Critique {
  const promptDepth = Math.min(2, Math.floor(brief.rawPrompt.length / 90));
  const motionBonus = tweaks.motion === 'expressive' ? 1 : 0;
  const densityBonus = tweaks.density === 'balanced' ? 1 : 0;
  const scores = [
    { label: 'Coherence', value: 7 + promptDepth },
    { label: 'Hierarchy', value: 8 + densityBonus },
    { label: 'Craft', value: 7 + (direction.id === 'editorial' ? 1 : 0) },
    { label: 'Function', value: 8 + (brief.features.length > 6 ? 1 : 0) },
    { label: 'Novelty', value: 6 + motionBonus + (direction.id === 'kinetic' ? 1 : 0) },
  ].map((item) => ({ ...item, value: Math.min(10, item.value) }));

  const total = Math.round(scores.reduce((sum, score) => sum + score.value, 0) / scores.length);
  return {
    total,
    scores,
    keep: [
      `The ${direction.name.toLowerCase()} direction gives the concept a clear visual contract.`,
      `The generated modules are tied to "${brief.objective}" instead of generic filler.`,
      'Tweaks stay small enough to explore choices without becoming a settings maze.',
    ],
    fix: [
      'Replace any placeholder copy with real product language before shipping.',
      'Add actual brand assets when the product identity is known.',
      'Run click-through verification after changing the generated HTML.',
    ],
    quickWins: [
      'Pick one hero metric and remove competing numbers.',
      'Rename sections with the vocabulary your users already use.',
      'Export HTML, then ask Codex or Claude for one focused refinement pass.',
    ],
  };
}

function buildAssumptions(brief: DerivedBrief, direction: DesignDirection): string[] {
  return [
    `Audience: ${brief.audience}.`,
    `Goal: ${brief.objective}.`,
    `Direction: ${direction.name}, because it fits ${direction.bestFor.toLowerCase()}.`,
    'No API key is required; this pass is deterministic and local.',
  ];
}

function buildHandoffPrompt(
  brief: DerivedBrief,
  type: ArtifactType,
  direction: DesignDirection,
  tweaks: DesignTweaks,
): string {
  return [
    'Actua como disenador senior de producto y frontend.',
    '',
    `Brief: ${brief.rawPrompt}`,
    `Artefacto: ${type}`,
    `Nombre provisional: ${brief.name}`,
    `Audiencia: ${brief.audience}`,
    `Objetivo: ${brief.objective}`,
    `Direccion visual: ${direction.name} (${direction.school})`,
    `Tweaks: density=${tweaks.density}, tone=${tweaks.tone}, motion=${tweaks.motion}, radius=${tweaks.radius}px`,
    '',
    'Entrega un prototipo HTML/CSS/JS standalone, responsive, con estados interactivos reales, texto listo para revisar, y un pequeno panel de tweaks persistente en localStorage.',
    'Evita una landing generica si el brief pide software: construye la pantalla utilizable. Usa jerarquia clara, controles esperables, y deja notas breves solo donde ayuden a iterar.',
    '',
    `Modulos que ya propuso Designme Studio: ${brief.features.join(', ')}.`,
  ].join('\n');
}

export function buildDesignProject(input: BuildInput): DesignOutput {
  const direction = byId(input.directionId);
  const brief = deriveBrief(input.prompt, input.artifactType);
  const html = buildHtml(brief, input.artifactType, direction, input.tweaks);
  const critique = buildCritique(brief, direction, input.tweaks);
  return {
    name: brief.name,
    exportName: slugify(`${brief.name}-${input.artifactType}`),
    briefSummary: `${brief.objective} for ${brief.audience}.`,
    assumptions: buildAssumptions(brief, direction),
    sections: brief.sections,
    features: brief.features,
    html,
    handoffPrompt: buildHandoffPrompt(brief, input.artifactType, direction, input.tweaks),
    critique,
    direction,
  };
}
