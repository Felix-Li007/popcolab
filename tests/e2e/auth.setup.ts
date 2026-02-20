import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_FILE = path.join(__dirname, '.auth/session.json');

/**
 * Runs once before any authenticated test project.
 * Signs in via Clerk, then saves cookies + localStorage to a file so every
 * browser project can reuse the session without logging in again.
 *
 * Required env vars (add to .env.local or CI secrets):
 *   TEST_USER_EMAIL
 *   TEST_USER_PASSWORD
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing TEST_USER_EMAIL or TEST_USER_PASSWORD environment variables.'
    );
  }

  await page.goto('/sign-in');

  // Clerk renders either an embedded component or redirects to accounts.clerk.dev.
  // We target the email field by its common label / placeholder.
  await page
    .getByLabel(/email address/i)
    .or(page.getByPlaceholder(/email/i))
    .fill(email);

  await page.getByRole('button', { name: /continue/i }).click();

  await page
    .getByLabel(/password/i)
    .or(page.getByPlaceholder(/password/i))
    .fill(password);

  await page.getByRole('button', { name: /sign in|continue/i }).click();

  // Wait for the dashboard to appear — confirms auth succeeded.
  await page.waitForURL('**/admin**', { timeout: 15_000 });
  await expect(page).toHaveURL(/\/admin/);

  await page.context().storageState({ path: SESSION_FILE });
});
