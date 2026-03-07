import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4321';
const useExternalBaseUrl = process.env.PLAYWRIGHT_EXTERNAL_BASE_URL === '1';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI
    ? Number(process.env.PLAYWRIGHT_CI_WORKERS ?? '2')
    : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: useExternalBaseUrl
    ? undefined
    : {
        command: 'pnpm run build && pnpm run preview',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
      },
  projects: [
    {
      name: 'chrome-desktop',
      testMatch: '**/*.desktop.spec.ts',
      use: {
        browserName: 'chromium',
        viewport: { width: 1366, height: 900 },
      },
    },
    {
      name: 'firefox-desktop',
      testMatch: '**/*.desktop.spec.ts',
      use: {
        browserName: 'firefox',
        viewport: { width: 1366, height: 900 },
      },
    },
    {
      name: 'chrome-mobile',
      testMatch: '**/*.mobile.spec.ts',
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
      },
    },
    {
      name: 'firefox-mobile',
      testMatch: '**/*.mobile.spec.ts',
      use: {
        browserName: 'firefox',
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
