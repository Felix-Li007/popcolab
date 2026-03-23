import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_SESSION_FILE = path.join(__dirname, 'tests/e2e/.auth/admin.json');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'test-reports/e2e' }]],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    /* ── Admin auth setup — runs once, saves session to file ── */
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },

    // /* ── Authenticated admin browsers ── */
    // {
    //   name: 'admin-chromium',
    //   testMatch: '**/admin/**/*.spec.ts',
    //   dependencies: ['setup'],
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     storageState: ADMIN_SESSION_FILE,
    //   },
    // },
    // {
    //   name: 'admin-firefox',
    //   testMatch: '**/admin/**/*.spec.ts',
    //   dependencies: ['setup'],
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: ADMIN_SESSION_FILE,
    //   },
    // },
    // {
    //   name: 'admin-webkit',
    //   testMatch: '**/admin/**/*.spec.ts',
    //   dependencies: ['setup'],
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: ADMIN_SESSION_FILE,
    //   },
    // },

    /* ── General browsers for front/user flows ── */
    {
      name: 'chromium',
      // testIgnore: ['**/admin/**/*.spec.ts', '**/auth.setup.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      // testIgnore: ['**/admin/**/*.spec.ts', '**/auth.setup.ts'],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      // testIgnore: ['**/admin/**/*.spec.ts', '**/auth.setup.ts'],
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
