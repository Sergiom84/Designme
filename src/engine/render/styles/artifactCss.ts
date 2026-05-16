export function renderArtifactCss(): string {
  return `
    .artifact-shell {
      min-height: calc(100vh - clamp(36px, 6vw, 68px));
      display: grid;
      gap: var(--gap);
      color: var(--ink);
    }
    .variation-lane-board {
      --gap: clamp(16px, 2vw, 24px);
    }
    .variation-narrative-stack .hero-strip,
    .variation-narrative-stack .web-hero,
    .variation-narrative-stack .slide-stage {
      align-content: start;
    }
    .variation-command-center .metric-grid {
      order: -1;
    }
    .variation-lane-board .split-grid,
    .variation-lane-board .analytics-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .variation-narrative-stack .split-grid,
    .variation-narrative-stack .analytics-grid,
    .variation-narrative-stack .web-hero {
      grid-template-columns: minmax(0, 1fr);
    }
    .software-shell { grid-template-columns: 220px minmax(0, 1fr); }
    .dashboard-shell, .web-shell, .infographic-shell { grid-template-columns: 1fr; }
    .mobile-shell { grid-template-columns: minmax(320px, 430px) minmax(260px, 1fr); align-items: center; justify-content: center; }
    .deck-shell { grid-template-columns: 210px minmax(0, 1fr) 260px; align-items: stretch; }
    .workspace { display: grid; grid-template-rows: auto auto 1fr; gap: var(--gap); min-width: 0; }
    .workspace.full { grid-template-rows: auto auto 1fr; }
    .split-grid, .analytics-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr); gap: var(--gap); }
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
    @media (max-width: 980px) {
      body { padding: 14px; }
      .software-shell, .mobile-shell, .deck-shell, .web-hero, .split-grid, .analytics-grid { grid-template-columns: 1fr; }
      .rail, .slide-rail, .speaker-notes { order: 2; }
      .metric-grid, .proof-row, .poster-grid, .shot-panel { grid-template-columns: 1fr; }
      .site-nav { flex-wrap: wrap; }
      h1 { max-width: 100%; }
    }
  `;
}
