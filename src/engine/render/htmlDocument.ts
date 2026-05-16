import { getThemeById, renderThemeCssVars } from '../../design-system/tokens';
import type { UXIntent } from '../intent/types';
import type { ArtifactType, DerivedBrief, DesignDirection, DesignTweaks } from '../types';
import { escapeHtml } from '../utils';
import { renderArtifact } from './index';
import { renderArtifactCss, renderGeneratedComponentCss } from './styles';

export function buildHtml(
  brief: DerivedBrief,
  type: ArtifactType,
  direction: DesignDirection,
  tweaks: DesignTweaks,
  intent: UXIntent,
): string {
  const title = escapeHtml(brief.name);
  const artifact = renderArtifact(brief, type, tweaks, intent);
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
${renderGeneratedComponentCss()}
${renderArtifactCss()}
  </style>
</head>
<body data-density="${tweaks.density}" data-scheme="${dataScheme}" data-ux-domain="${intent.domain}" data-ux-goal="${intent.goal}">
  ${artifact}
  <div class="tweak-dock" aria-label="Standalone tweaks">
    <button type="button" data-density-toggle title="Density">D</button>
    <button type="button" data-scheme-toggle title="Scheme">S</button>
  </div>
  <script>
    const designmeStorage = {
      get(key) {
        try {
          return window.localStorage?.getItem(key);
        } catch {
          return null;
        }
      },
      set(key, value) {
        try {
          window.localStorage?.setItem(key, value);
        } catch {
          // Sandboxed previews may not have storage access.
        }
      },
    };
    const savedDensity = designmeStorage.get('designme-density');
    const savedScheme = designmeStorage.get('designme-scheme');
    if (savedDensity) document.body.dataset.density = savedDensity;
    if (savedScheme) document.body.dataset.scheme = savedScheme;
    document.querySelector('[data-density-toggle]')?.addEventListener('click', () => {
      const order = ['calm', 'balanced', 'dense'];
      const current = document.body.dataset.density || 'balanced';
      const next = order[(order.indexOf(current) + 1) % order.length];
      document.body.dataset.density = next;
      designmeStorage.set('designme-density', next);
    });
    document.querySelector('[data-scheme-toggle]')?.addEventListener('click', () => {
      const next = document.body.dataset.scheme === 'contrast' ? 'light' : 'contrast';
      document.body.dataset.scheme = next;
      designmeStorage.set('designme-scheme', next);
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
