import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // In CI emit both the GitHub annotations reporter (for inline failure
  // surfacing on the PR) and the HTML report (uploaded as an artifact by the
  // `e2e` workflow job). Locally keep the lightweight list reporter.
  reporter: process.env.CI
    ? ([
        ['github'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ] as const)
    : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run web:e2e',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
