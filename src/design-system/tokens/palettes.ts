import type { ThemeId } from './types';

export interface RawPalette {
  ink: string;
  paper: string;
  surface: string;
  subtle: string;
  accent: string;
  secondary: string;
  highlight: string;
}

export const palettes: Record<ThemeId, RawPalette> = {
  systems: {
    ink: '#17191c',
    paper: '#f5f1e8',
    surface: '#fffdf8',
    subtle: '#dfd8c8',
    accent: '#0f766e',
    secondary: '#be5b3d',
    highlight: '#d9b84f',
  },
  editorial: {
    ink: '#161412',
    paper: '#f8f4ec',
    surface: '#ffffff',
    subtle: '#e3ded3',
    accent: '#9b3f31',
    secondary: '#1e6f9f',
    highlight: '#d8b53f',
  },
  kinetic: {
    ink: '#121417',
    paper: '#f2f5ef',
    surface: '#fbfcf8',
    subtle: '#d8dfd6',
    accent: '#a84226',
    secondary: '#16858f',
    highlight: '#b6cf50',
  },
};
