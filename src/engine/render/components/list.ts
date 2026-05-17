import { escapeHtml } from '../../utils';
import { renderButton } from './button';

export function renderFeatureList(items: string[], limit = 5): string {
  return items
    .slice(0, limit)
    .map(
      (item, index) => `
        <li>
          <span class="index">${String(index + 1).padStart(2, '0')}</span>
          <span>${escapeHtml(item)}</span>
        </li>
      `,
    )
    .join('');
}

export function renderTaskList(items: string[], states: string[] = ['listo', 'necesita input']): string {
  return items
    .slice(0, 5)
    .map((item, index) =>
      renderButton({
        label: item,
        html: `<span>${escapeHtml(item)}</span><small>${escapeHtml(states[index % states.length])}</small>`,
        className: 'task-row',
      }),
    )
    .join('');
}

export function renderTimeline(items: string[], limit = 5): string {
  return items
    .slice(0, limit)
    .map((item, index) =>
      renderButton({
        label: item,
        html: `<span>${escapeHtml(item)}</span><small>${index === 0 ? 'en vivo' : 'en cola'}</small>`,
        variant: 'step',
        active: index === 0,
        attributes: { 'data-screen': index },
      }),
    )
    .join('');
}
