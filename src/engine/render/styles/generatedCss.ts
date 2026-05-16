export function renderGeneratedComponentCss(): string {
  return `
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
    button:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--accent) 70%, white);
      outline-offset: 3px;
    }
    .rail, .module, .metric-card, .site-nav, .product-shot, .proof-row article, .phone-frame, .mobile-context, .slide-stage, .speaker-notes, .slide-rail, .poster, .tweak-dock {
      background: color-mix(in srgb, var(--surface) 94%, white);
      border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
      border-radius: var(--radius);
      box-shadow: 0 18px 50px rgba(16, 18, 20, 0.08);
    }
    .rail, .slide-rail { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .mark { width: 44px; height: 44px; display: grid; place-items: center; border-radius: var(--radius); background: var(--ink); color: var(--paper); font-weight: 800; margin-bottom: 12px; }
    .rail button, .slide-rail button, .step-button { width: 100%; text-align: left; padding: 11px 12px; background: transparent; }
    .rail button.active, .slide-rail button.active, .step-button.is-active, .segmented .active, .phone-nav .active {
      background: color-mix(in srgb, var(--accent) 16%, var(--surface));
      border-color: color-mix(in srgb, var(--accent) 46%, var(--ink));
    }
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
    .primary-action, .ghost-action, .soft-action { min-height: 42px; padding: 0 16px; font-weight: 800; }
    .primary-action { background: var(--ink); color: var(--paper); }
    .ghost-action { background: transparent; }
    .soft-action { background: color-mix(in srgb, var(--surface) 94%, var(--accent)); }
    .metric-grid, .proof-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--gap); }
    .metric-card, .proof-row article { padding: 16px; display: grid; gap: 8px; min-width: 0; }
    .metric-card strong { font-size: clamp(30px, 4vw, 56px); line-height: 1; }
    .metric-card span, .module-head span, .proof-row span, .speaker-notes span { color: color-mix(in srgb, var(--ink) 58%, var(--surface)); font-size: 12px; text-transform: uppercase; font-weight: 800; }
    .metric-card small, .task-row small, .step-button small { color: color-mix(in srgb, var(--ink) 58%, var(--surface)); }
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
    .segmented { display: flex; gap: 6px; padding: 4px; border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent); border-radius: var(--radius); background: color-mix(in srgb, var(--paper) 65%, var(--surface)); }
    .segmented button { border: 0; min-height: 34px; padding: 0 12px; }
    .state-block { display: grid; gap: 8px; padding: 16px; border-radius: var(--radius); border: 1px dashed color-mix(in srgb, var(--ink) 20%, transparent); background: color-mix(in srgb, var(--surface) 86%, var(--paper)); }
    .state-block p { margin: 0; color: color-mix(in srgb, var(--ink) 64%, var(--surface)); }
    .loading-state span { width: 24px; height: 24px; border-radius: 50%; border: 3px solid color-mix(in srgb, var(--accent) 24%, transparent); border-top-color: var(--accent); }
    .tweak-dock { position: fixed; right: 16px; bottom: 16px; z-index: 20; display: flex; gap: 8px; padding: 8px; }
    .tweak-dock button { width: 38px; height: 38px; padding: 0; font-weight: 900; }
    body[data-scheme="contrast"] { --paper: #111417; --surface: #1b2025; --ink: #f6f0e6; --text: #f6f0e6; --subtle: #33404a; }
    body[data-density="dense"] { --gap: 10px; }
    body[data-density="calm"] { --gap: 24px; }
  `;
}
