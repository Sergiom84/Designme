import { expect, test } from 'playwright/test';

type SecretWrite = { key: string; value: string };

function installDesktopStubs(activeProviderId?: string) {
  window.localStorage.clear();
  if (activeProviderId) {
    window.localStorage.setItem('designme.activeProviderId', activeProviderId);
  }

  const secretWrites: SecretWrite[] = [];
  let detectCount = 0;

  (window as unknown as { __secretWrites: SecretWrite[] }).__secretWrites = secretWrites;
  (window as unknown as { __detectCount: number }).__detectCount = detectCount;
  window.designme = {
    exportBundle: async () => ({ filePath: '', directory: '' }),
    exportHtml: async () => ({ filePath: '', directory: '' }),
    openExports: async () => ({ directory: '' }),
    copyText: async () => undefined,
    codeWorkspacePick: async () => ({ canceled: true }),
    codeWorkspaceIndex: async () => ({ rootPath: '', files: [], stats: { fileCount: 0, bytes: 0 } }),
    codeWorkspaceReadFile: async () => ({ content: '' }),
    codeWorkspaceWatch: async () => ({ watching: false }),
    codeWorkspaceUnwatch: async () => ({ stopped: true }),
    providerStart: async () => ({ runId: '00000000-0000-4000-8000-000000000000' }),
    providerStop: async () => ({ stopped: true }),
    providerStatus: async ({ providerId }) => ({
      providerId,
      status:
        providerId === 'anthropic-api' && secretWrites.some((write) => write.key === 'anthropic-api.apiKey')
          ? 'ready'
          : providerId === 'deterministic'
            ? 'ready'
            : 'error',
    }),
    detectLocalSetup: async () => {
      detectCount += 1;
      (window as unknown as { __detectCount: number }).__detectCount = detectCount;
      return {
        generatedAt: new Date().toISOString(),
        providers: [
          {
            id: 'claude-code-cli',
            label: 'Claude Code',
            detected: true,
            ready: true,
            configFound: true,
            cliFound: true,
            command: 'C:\\Tools\\claude.exe',
            version: 'claude 1.2.3',
            detail: 'CLI detected.',
          },
          {
            id: 'codex-cli',
            label: 'Codex',
            detected: false,
            ready: false,
            configFound: false,
            cliFound: false,
            authFound: false,
            command: 'codex',
            detail: 'No local setup detected.',
          },
        ],
        localOpenAI: {
          id: 'ollama',
          label: 'Ollama',
          detected: false,
          ready: false,
          configFound: false,
          baseUrl: 'http://127.0.0.1:11434/v1',
          detail: 'Not reachable.',
        },
      };
    },
    setCspState: async (payload) => payload,
    getCspState: async () => ({ allowLocalProvider: false }),
    secretStatus: async () => ({ ready: true }),
    setSecret: async (payload) => {
      secretWrites.push(payload);
      return { stored: true };
    },
    getSecret: async () => ({ value: null }),
    deleteSecret: async () => ({ deleted: true }),
    onProviderEvent: () => () => undefined,
    onCodeWorkspaceChange: () => () => undefined,
  };
}

test('configures providers from the settings dialog', async ({ page }) => {
  await page.addInitScript(installDesktopStubs);
  await page.goto('/');

  await page.getByTitle('Provider settings').click();
  await expect(page.getByRole('dialog', { name: 'Provider configuration' })).toBeVisible();

  await page.getByRole('tab', { name: 'Claude Code' }).click();
  await expect(page.getByLabel('CLI path')).toHaveValue('C:\\Tools\\claude.exe');
  await page.getByRole('button', { name: 'Re-check' }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __detectCount: number }).__detectCount))
    .toBeGreaterThan(1);

  await page.getByRole('tab', { name: 'Anthropic API' }).click();
  await page.getByLabel('API key').fill('sk-ant-test');
  await page.getByLabel('Base URL').fill('https://api.anthropic.com');
  await page.getByLabel('Model').fill('claude-test-model');
  await page.getByRole('button', { name: 'Save provider' }).click();

  await expect(page.getByText('Anthropic API settings saved.')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __secretWrites: SecretWrite[] }).__secretWrites))
    .toContainEqual({ key: 'anthropic-api.apiKey', value: 'sk-ant-test' });

  const storedSettings = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('designme.apiProviderSettings') || '{}'),
  );
  expect(storedSettings['anthropic-api']).toMatchObject({
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-test-model',
  });
});

test('opens provider config on first generate when the active provider is not ready', async ({ page }) => {
  await page.addInitScript(installDesktopStubs, 'openai-api');
  await page.goto('/');

  await page.getByRole('button', { name: 'Generate 3 ideas' }).click();

  await expect(page.getByRole('dialog', { name: 'Provider configuration' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'OpenAI API' })).toHaveAttribute('aria-selected', 'true');
});
