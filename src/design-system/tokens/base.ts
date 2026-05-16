import type { MotionTokens, RadiusTokens, ShadowTokens, SpacingTokens, TypographyTokens } from './types';

export const typography: TypographyTokens = {
  familySans:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  familyMono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  size: {
    xs: '12px',
    sm: '13px',
    md: '15px',
    lg: '18px',
    xl: '22px',
    '2xl': '28px',
    '3xl': '40px',
    '4xl': '56px',
    display: 'clamp(34px, 7vw, 82px)',
  },
  lineHeight: {
    tight: '1',
    normal: '1.35',
    relaxed: '1.55',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 650,
    bold: 800,
    black: 900,
  },
};

export const spacing: SpacingTokens = {
  scale: {
    '0': '0',
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '8': '32px',
    '10': '40px',
    '12': '48px',
    '16': '64px',
  },
};

export const radius: RadiusTokens = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '24px',
  round: '999px',
};

export const shadow: ShadowTokens = {
  sm: '0 8px 24px rgba(16, 18, 20, 0.08)',
  md: '0 18px 50px rgba(16, 18, 20, 0.08)',
  lg: '0 24px 80px rgba(20, 20, 20, 0.12)',
};

export const motion: MotionTokens = {
  still: '0ms',
  fast: '120ms',
  normal: '180ms',
  expressive: '360ms',
  easingStandard: 'ease',
  easingEmphasized: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
};
