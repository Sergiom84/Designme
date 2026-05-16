import { getThemeById, renderThemeCssVars } from '../../design-system/tokens';
import type { ArtifactType, DerivedBrief, DesignDirection, DesignTweaks } from '../types';
import { escapeHtml } from '../utils';
import { renderArtifact } from './index';

export function buildHtml(
  brief: DerivedBrief,
  type: ArtifactType,
  direction: DesignDirection,
  tweaks: DesignTweaks,
): string {
  const title = escapeHtml(brief.name);
  const artifact = renderArtifact(brief, type, tweaks);
  const theme = getThemeById(direction.themeId);
  const themeCssVars = renderThemeCssVars(theme, tweaks);
  const dataScheme = tweaks.tone === 'light' ? 'light' : 'contrast';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    :root {
${themeCssVars}
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
    body[data-scheme="contrast"] { --paper: #111417; --surface: #1b2025; --ink: #f6f0e6; --text: #f6f0e6; --subtle: #33404a; }
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
<body data-density="${tweaks.density}" data-scheme="${dataScheme}">
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
