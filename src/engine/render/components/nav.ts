import { escapeHtml } from '../../utils';
import { renderButton } from './button';

export function renderSideRail(
  mark: string,
  items: string[],
  options: { className?: string; numbered?: boolean; activeIndex?: number } = {},
): string {
  const { className = 'rail', numbered = false, activeIndex = 0 } = options;

  return `
    <aside class="${escapeHtml(className)}">
      ${className === 'rail' ? `<div class="mark">${escapeHtml(mark)}</div>` : ''}
      ${items
        .map((item, index) =>
          renderButton({
            label: `${numbered ? `${index + 1}. ` : ''}${item}`,
            active: index === activeIndex,
          }),
        )
        .join('')}
    </aside>
  `;
}

export function renderSegmentedControl(label: string, items: string[], activeIndex = 0): string {
  return `
    <div class="segmented" role="group" aria-label="${escapeHtml(label)}">
      ${items
        .map((item, index) =>
          renderButton({
            label: item,
            active: index === activeIndex,
            attributes: { 'aria-pressed': index === activeIndex ? 'true' : 'false' },
          }),
        )
        .join('')}
    </div>
  `;
}

export function renderNav(brand: string, links: string[], actionLabel: string): string {
  return `
    <nav class="site-nav" aria-label="Primary">
      <strong>${escapeHtml(brand)}</strong>
      ${links.map((link) => `<span>${escapeHtml(link)}</span>`).join('')}
      ${renderButton({ label: actionLabel })}
    </nav>
  `;
}
