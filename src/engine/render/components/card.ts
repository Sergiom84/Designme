import { escapeHtml } from '../../utils';
import type { CardProps } from './types';
import { joinClasses, renderAttributes } from './types';

export function renderCard({
  className,
  eyebrow,
  title,
  body,
  children = '',
  attributes,
}: CardProps): string {
  return `
    <article class="${escapeHtml(joinClasses('module', className))}"${renderAttributes(attributes)}>
      ${
        eyebrow || title
          ? `<div class="module-head">
              <span>${escapeHtml(eyebrow ?? '')}</span>
              <strong>${escapeHtml(title ?? '')}</strong>
            </div>`
          : ''
      }
      ${body ? `<p>${escapeHtml(body)}</p>` : ''}
      ${children}
    </article>
  `;
}

export function renderSectionHeader(eyebrow: string, title: string): string {
  return `
    <div class="module-head">
      <span>${escapeHtml(eyebrow)}</span>
      <strong>${escapeHtml(title)}</strong>
    </div>
  `;
}

export function renderMetricCard(label: string, value: string | number, caption: string): string {
  return `
    <article class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      <small>${escapeHtml(caption)}</small>
    </article>
  `;
}

export function renderNumberedCard(index: number, title: string, body: string): string {
  return `
    <article>
      <span>${String(index + 1).padStart(2, '0')}</span>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(body)}</p>
    </article>
  `;
}
