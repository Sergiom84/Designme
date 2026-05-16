import { escapeHtml } from '../../utils';
import type { ButtonProps } from './types';
import { joinClasses, renderAttributes } from './types';

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'primary-action',
  ghost: 'ghost-action',
  subtle: 'soft-action',
  step: 'step-button',
};

export function renderButton({
  label,
  html,
  variant = 'subtle',
  active = false,
  className,
  attributes = {},
}: ButtonProps): string {
  const activeClass = active ? (variant === 'step' ? 'is-active' : 'active') : undefined;
  const ariaAttributes = active ? { 'aria-pressed': 'true', ...attributes } : attributes;
  const classes = joinClasses(variantClass[variant], activeClass, className);

  return `<button class="${escapeHtml(classes)}"${renderAttributes({ type: 'button', ...ariaAttributes })}>${html ?? escapeHtml(label)}</button>`;
}
