import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:3317';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: `npm run ${process.env.E2E_DEV === '1' ? 'dev' : 'start'} -- --hostname localhost --port 3317`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { NEXT_PUBLIC_GA_MEASUREMENT_ID: '', NEXT_TELEMETRY_DISABLED: '1' },
  },
});
