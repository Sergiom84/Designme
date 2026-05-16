import { escapeHtml } from '../../utils';

export type ComponentAttributeValue = string | number | boolean | null | undefined;
export type ComponentAttributes = Record<string, ComponentAttributeValue>;

export interface RenderableItem {
  label: string;
  caption?: string;
  value?: string | number;
}

export interface ButtonProps {
  label: string;
  html?: string;
  variant?: 'primary' | 'ghost' | 'subtle' | 'step';
  active?: boolean;
  className?: string;
  attributes?: ComponentAttributes;
}

export interface CardProps {
  className?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  children?: string;
  attributes?: ComponentAttributes;
}

export function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function renderAttributes(attributes: ComponentAttributes = {}): string {
  return Object.entries(attributes)
    .filter(([, value]) => value !== false && value !== null && value !== undefined)
    .map(([name, value]) => {
      if (value === true) return ` ${escapeHtml(name)}`;
      return ` ${escapeHtml(name)}="${escapeHtml(String(value))}"`;
    })
    .join('');
}
