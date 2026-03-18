import type { Page } from '@playwright/test';

function primaryAuthButton(page: Page) {
  return page.getByRole('button', { name: /^(Continue|Sign in)$/i }).first();
}

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
  await primaryAuthButton(page).click();
  const passwordInput = page.locator('input[name="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 8000 });
  await passwordInput.fill(process.env.TEST_INDIVIDUAL_PASSWORD!);
  await primaryAuthButton(page).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

export const SKIP_REASON =
  'Requires TEST_INDIVIDUAL_EMAIL and TEST_INDIVIDUAL_PASSWORD env vars';

export function needsUserCreds(): boolean {
  return (
    !process.env.TEST_INDIVIDUAL_EMAIL || !process.env.TEST_INDIVIDUAL_PASSWORD
  );
}
