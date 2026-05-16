import { motion, radius, shadow, spacing, typography } from './base';
import { palettes } from './palettes';
import type { DesignTheme, ThemeId } from './types';

const themeNames: Record<ThemeId, string> = {
  systems: 'Sistema operativo',
  editorial: 'Editorial funcional',
  kinetic: 'Prototipo cinético',
};

export function createTheme(id: ThemeId): DesignTheme {
  const palette = palettes[id];
  return {
    id,
    name: themeNames[id],
    color: {
      background: palette.paper,
      surface: palette.surface,
      surfaceRaised: palette.surface,
      text: palette.ink,
      textMuted: 'color-mix(in srgb, var(--ink) 58%, var(--surface))',
      border: 'color-mix(in srgb, var(--ink) 12%, transparent)',
      accent: palette.accent,
      accentText: palette.paper,
      secondary: palette.secondary,
      highlight: palette.highlight,
      danger: '#a33d35',
      success: '#16795f',
      warning: '#a66f1f',
      focusRing: 'color-mix(in srgb, var(--accent) 48%, transparent)',
      ink: palette.ink,
      paper: palette.paper,
      subtle: palette.subtle,
    },
    typography,
    spacing,
    radius,
    shadow,
    motion,
  };
}

export const themes: Record<ThemeId, DesignTheme> = {
  systems: createTheme('systems'),
  editorial: createTheme('editorial'),
  kinetic: createTheme('kinetic'),
};

export function getThemeById(id: ThemeId): DesignTheme {
  return themes[id] ?? themes.systems;
}
