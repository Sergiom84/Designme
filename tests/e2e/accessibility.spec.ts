import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/');
});

test('has no serious or critical accessibility violations in the app shell', async ({ page }) => {
  const results = await new AxeBuilder({ page }).exclude('iframe').analyze();
  const blockingViolations = results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact ?? ''),
  );

  expect(blockingViolations).toEqual([]);
});
