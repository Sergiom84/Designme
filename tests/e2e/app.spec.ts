import { expect, test } from 'playwright/test';

const crmPrompt = 'Dashboard para un CRM de ventas B2B con pipeline, riesgos, deals bloqueados y siguientes acciones.';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/');
});

test('runs the main design workflow in the browser app', async ({ page }) => {
  const briefInput = page.getByRole('textbox', { name: 'Brief' });
  const artifactGroup = page.getByRole('group', { name: 'Artefacto' });

  await expect(page.getByRole('heading', { name: 'Designme Studio' })).toBeVisible();

  await briefInput.fill(crmPrompt);
  await artifactGroup.getByRole('button', { name: /^Dashboard/i }).click();

  const preview = page.frameLocator('iframe[title="Vista previa del diseño"]');
  await expect(preview.locator('body')).toHaveAttribute('data-ux-domain', 'crm');
  await expect(preview.locator('body')).toHaveAttribute('data-ux-goal', /decide|monitor/);

  await page.getByLabel('Guardar versión').click();
  await expect(page.getByRole('list', { name: 'Versiones guardadas' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Comparar con/i })).toBeVisible();

  await briefInput.fill('App móvil de hábitos para fundadores ocupados con foco diario y revisión semanal.');
  await artifactGroup.getByRole('button', { name: /^App/i }).click();
  await expect(preview.locator('.phone-frame')).toBeVisible();

  await page.locator('.version-item button').first().click();
  await expect(briefInput).toHaveValue(crmPrompt);

  await page.getByRole('button', { name: 'Vista previa móvil' }).click();
  await expect(page.locator('.preview-stage')).toHaveClass(/mode-mobile/);

  await page.getByRole('tab', { name: 'Crítica' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Crítica' })).toContainText('Revisión experta');

  await page.getByRole('tab', { name: 'Referencias' }).click();
  await page.getByLabel('Notas de referencia').fill('Dashboard enterprise denso con alto contraste y tablas sobrias.');
  await expect(page.getByRole('tabpanel', { name: 'Referencias' })).toContainText('Referencia detectada');
  await page.getByRole('button', { name: 'Mejorar brief' }).click();
  await expect(briefInput).toHaveValue(/Dirección de referencia/);
});

test('exports standalone HTML through the web fallback', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Brief' }).fill(crmPrompt);
  await page.getByRole('group', { name: 'Artefacto' }).getByRole('button', { name: /^Dashboard/i }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar HTML' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.html$/);
});
