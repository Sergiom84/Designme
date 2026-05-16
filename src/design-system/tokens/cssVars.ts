import type { Density, DesignTweaks } from '../../engine/types';
import type { DesignTheme } from './types';

function densityGap(density: Density): string {
  if (density === 'calm') return '22px';
  if (density === 'dense') return '10px';
  return '16px';
}

function motionDuration(tweaks: DesignTweaks, theme: DesignTheme): string {
  if (tweaks.motion === 'still') return theme.motion.still;
  if (tweaks.motion === 'expressive') return theme.motion.expressive;
  return theme.motion.normal;
}

export function renderThemeCssVars(theme: DesignTheme, tweaks: DesignTweaks): string {
  const lines = [
    `--ink: ${theme.color.ink};`,
    `--paper: ${theme.color.paper};`,
    `--surface: ${theme.color.surface};`,
    `--surface-raised: ${theme.color.surfaceRaised};`,
    `--subtle: ${theme.color.subtle};`,
    `--text: ${theme.color.text};`,
    `--text-muted: ${theme.color.textMuted};`,
    `--border: ${theme.color.border};`,
    `--accent: ${theme.color.accent};`,
    `--accent-text: ${theme.color.accentText};`,
    `--secondary: ${theme.color.secondary};`,
    `--highlight: ${theme.color.highlight};`,
    `--danger: ${theme.color.danger};`,
    `--success: ${theme.color.success};`,
    `--warning: ${theme.color.warning};`,
    `--focus-ring: ${theme.color.focusRing};`,
    `--radius: ${tweaks.radius}px;`,
    `--radius-sm: ${theme.radius.sm};`,
    `--radius-md: ${theme.radius.md};`,
    `--radius-lg: ${theme.radius.lg};`,
    `--gap: ${densityGap(tweaks.density)};`,
    `--shadow-sm: ${theme.shadow.sm};`,
    `--shadow-md: ${theme.shadow.md};`,
    `--shadow-lg: ${theme.shadow.lg};`,
    `--motion: ${motionDuration(tweaks, theme)};`,
    `--easing: ${theme.motion.easingStandard};`,
    `font-family: ${theme.typography.familySans};`,
  ];

  return lines.map((line) => `      ${line}`).join('\n');
}
