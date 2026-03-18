import { test as setup, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_FILE = path.join(__dirname, '.auth/admin.json');

function primaryAuthButton(page: Page) {
  return page.getByRole('button', { name: /^(Continue|Sign in)$/i }).first();
}

async function completeSecondFactorIfNeeded(page: Page) {
  await page.waitForLoadState('domcontentloaded');

  if (!page.url().includes('/sign-in/factor-two')) {
    return;
  }

  const verificationCode =
    process.env.TEST_USER_OTP ??
    process.env.TEST_USER_EMAIL_CODE ??
    process.env.TEST_ADMIN_OTP ??
    process.env.TEST_ADMIN_EMAIL_CODE;

  if (!verificationCode) {
    throw new Error(
      'Sign-in reached /sign-in/factor-two and requires an email verification code. Set TEST_USER_OTP (or TEST_USER_EMAIL_CODE) for this test account, or use a test account without email-based second factor.'
    );
  }

  const codeInput = page
    .getByLabel(/enter verification code/i)
    .or(page.getByPlaceholder(/verification code/i))
    .first();

  await expect(codeInput).toBeVisible({ timeout: 8000 });
  await codeInput.fill(verificationCode);
  await primaryAuthButton(page).click();
}

/**
 * Runs once before any authenticated test project.
 * Signs in via Clerk, then saves cookies + localStorage to a file so every
 * browser project can reuse the session without logging in again.
 *
 * Required env vars (add to .env.local or CI secrets):
 *   TEST_USER_EMAIL
 *   TEST_USER_PASSWORD
 *
 * Optional when this account requires email verification:
 *   TEST_USER_OTP
 *   TEST_USER_EMAIL_CODE
 *
 * Backward compatible fallback:
 *   TEST_ADMIN_EMAIL
 *   TEST_ADMIN_PASSWORD
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL ?? process.env.TEST_ADMIN_EMAIL;
  const password =
    process.env.TEST_USER_PASSWORD ?? process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing TEST_USER_EMAIL / TEST_USER_PASSWORD (or fallback TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD) environment variables.'
    );
  }

  await page.goto('/sign-in');

  // Clerk renders either an embedded component or redirects to accounts.clerk.dev.
  // We target the email field by its common label / placeholder.
  await page
    .getByLabel(/email address/i)
    .or(page.getByPlaceholder(/email/i))
    .fill(email);

  await primaryAuthButton(page).click();

  const passwordInput = page.locator('input[name="password"]').first();
  await expect(passwordInput).toBeVisible({ timeout: 8000 });
  await expect(passwordInput).toBeEnabled({ timeout: 8000 });
  await passwordInput.fill(password);

  await primaryAuthButton(page).click();
  await completeSecondFactorIfNeeded(page);

  // Wait for the dashboard to appear — confirms auth succeeded.
  await page.waitForURL('**/admin**', { timeout: 20_000 });
  await expect(page).toHaveURL(/\/admin/);

  await page.context().storageState({ path: SESSION_FILE });
});
