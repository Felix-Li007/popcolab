import type { Page } from '@playwright/test';

/**
 * Signs in as the individual test user.
 * Requires TEST_INDIVIDUAL_EMAIL and TEST_INDIVIDUAL_PASSWORD env vars.
 */
export async function signInAsUser(page: Page): Promise<void> {
  await page.goto('/sign-in');
  const emailInput = page
    .getByLabel(/email address/i)
    .or(page.getByPlaceholder(/email/i));
  await emailInput.waitFor({ state: 'visible', timeout: 8000 });
  await emailInput.fill(process.env.TEST_INDIVIDUAL_EMAIL!);
  await page.getByRole('button', { name: /continue/i }).click();
  const passwordInput = page
    .getByLabel(/password/i)
    .or(page.getByPlaceholder(/password/i));
  await passwordInput.waitFor({ state: 'visible', timeout: 8000 });
  await passwordInput.fill(process.env.TEST_INDIVIDUAL_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

export const SKIP_REASON =
  'Requires TEST_INDIVIDUAL_EMAIL and TEST_INDIVIDUAL_PASSWORD env vars';

export function needsUserCreds(): boolean {
  return (
    !process.env.TEST_INDIVIDUAL_EMAIL || !process.env.TEST_INDIVIDUAL_PASSWORD
  );
}
