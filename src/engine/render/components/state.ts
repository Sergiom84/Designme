import { escapeHtml } from '../../utils';

export function renderEmptyState(title: string, body: string): string {
  return `<div class="state-block empty-state"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></div>`;
}

export function renderLoadingState(label = 'Cargando'): string {
  return `<div class="state-block loading-state" role="status"><span></span><strong>${escapeHtml(label)}</strong></div>`;
}

export function renderErrorState(title: string, body: string): string {
  return `<div class="state-block error-state" role="alert"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></div>`;
}

export function renderSuccessState(title: string, body: string): string {
  return `<div class="state-block success-state"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></div>`;
}
