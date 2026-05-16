export type ColorRole =
  | 'background'
  | 'surface'
  | 'surfaceRaised'
  | 'text'
  | 'textMuted'
  | 'border'
  | 'accent'
  | 'accentText'
  | 'secondary'
  | 'highlight'
  | 'danger'
  | 'success'
  | 'warning'
  | 'focusRing';

export type ThemeId = 'systems' | 'editorial' | 'kinetic';

export interface ColorTokens extends Record<ColorRole, string> {
  ink: string;
  paper: string;
  subtle: string;
}

export interface TypographyTokens {
  familySans: string;
  familyMono: string;
  size: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'display', string>;
  lineHeight: Record<'tight' | 'normal' | 'relaxed', string>;
  weight: Record<'regular' | 'medium' | 'semibold' | 'bold' | 'black', number>;
}

export interface SpacingTokens {
  scale: Record<'0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16', string>;
}

export interface RadiusTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  round: string;
}

export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
}

export interface MotionTokens {
  still: string;
  fast: string;
  normal: string;
  expressive: string;
  easingStandard: string;
  easingEmphasized: string;
}

export interface DesignTheme {
  id: ThemeId;
  name: string;
  color: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  shadow: ShadowTokens;
  motion: MotionTokens;
}
