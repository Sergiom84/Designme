import { escapeHtml } from '../../utils';
import { renderButton } from './button';

export interface PhoneFrameProps {
  showDevice: boolean;
  eyebrow: string;
  title: string;
  focusLabel: string;
  focusValue: string;
  listItems: string[];
  navItems: string[];
}

export function renderPhoneFrame({
  showDevice,
  eyebrow,
  title,
  focusLabel,
  focusValue,
  listItems,
  navItems,
}: PhoneFrameProps): string {
  const phoneClass = showDevice ? 'phone-frame' : 'phone-frame no-device';

  return `
    <section class="${phoneClass}">
      <div class="phone-top"></div>
      <main class="phone-screen">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1>${escapeHtml(title)}</h1>
        <div class="focus-card">
          <span>${escapeHtml(focusLabel)}</span>
          <strong>${escapeHtml(focusValue)}</strong>
        </div>
        <div class="mini-list">
          ${listItems
            .slice(0, 4)
            .map((item, index) =>
              renderButton({
                label: item,
                html: `<span>${escapeHtml(item)}</span><small>${index + 1}</small>`,
                attributes: { 'data-screen': index },
              }),
            )
            .join('')}
        </div>
      </main>
      <nav class="phone-nav" aria-label="Mobile sections">
        ${navItems
          .slice(0, 4)
          .map((item, index) =>
            renderButton({
              label: item.split(' ')[0],
              active: index === 0,
              attributes: { 'data-screen': index },
            }),
          )
          .join('')}
      </nav>
    </section>
  `;
}
