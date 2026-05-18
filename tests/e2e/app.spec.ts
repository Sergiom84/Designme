import { expect, test } from 'playwright/test';

const crmPrompt = 'Dashboard para un CRM de ventas B2B con pipeline, riesgos y siguientes acciones.';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/');
});

test('runs the v2 design workflow in the browser app', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Describe, pregunta, genera variantes.' })).toBeVisible();

  await page.getByRole('button', { name: 'Generate 3 ideas' }).click();

  await expect(page.getByRole('heading', { name: 'Minimal editorial' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bold campaignready' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dense professionalready' })).toBeVisible();

  const preview = page.frameLocator('iframe[title="Minimal editorial"]');
  await expect(preview.locator('body')).toHaveAttribute('data-ux-goal', 'monitor');
});

test('sends a chat prompt and regenerates v2 ideas', async ({ page }) => {
  await page.getByLabel('Prompt').fill(crmPrompt);
  await page.getByTitle('Send').click();

  await expect(page.getByText(crmPrompt)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Minimal editorial' })).toBeVisible();

  const preview = page.frameLocator('iframe[title="Minimal editorial"]');
  await expect(preview.locator('body')).toHaveAttribute('data-ux-domain', 'crm');
});
