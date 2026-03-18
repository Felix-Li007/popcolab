import { test, expect, type Page } from '@playwright/test';

/**
 * Route protection and role-based routing tests.
 *
 * Unauthenticated tests run without a session.
 * Authenticated tests require env vars:
 *   TEST_INDIVIDUAL_EMAIL / TEST_INDIVIDUAL_PASSWORD — an INDIVIDUAL role test user
 *   TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD           — an admin role test user
 */

function primaryAuthButton(page: Page) {
  return page.getByRole('button', { name: /^(Continue|Sign in)$/i }).first();
}

async function signInAs(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  const emailInput = page
    .getByLabel(/email address/i)
    .or(page.getByPlaceholder(/email/i));
  await emailInput.waitFor({ state: 'visible', timeout: 8000 });
  await emailInput.fill(email);
  await primaryAuthButton(page).click();
  const passwordInput = page.locator('input[name="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 8000 });
  await passwordInput.fill(password);
  await primaryAuthButton(page).click();
}

test.describe('Unauthenticated route protection', () => {
  test('/dashboard redirects to /sign-in when not logged in', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('/admin redirects to /sign-in when not logged in', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe('Public routes are accessible without authentication', () => {
  test('/ (home) loads without auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/^\//);
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test('/sign-in loads without auth', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('/sign-up loads without auth', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test('/test loads without auth', async ({ page }) => {
    await page.goto('/test');
    await expect(page).toHaveURL(/\/test/);
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

test.describe('Authenticated role-based routing — individual user', () => {
  test('individual user is redirected to /dashboard after sign-in', async ({
    page,
  }) => {
    test.skip(
      !process.env.TEST_INDIVIDUAL_EMAIL ||
        !process.env.TEST_INDIVIDUAL_PASSWORD,
      'Requires TEST_INDIVIDUAL_EMAIL and TEST_INDIVIDUAL_PASSWORD env vars'
    );
    await signInAs(
      page,
      process.env.TEST_INDIVIDUAL_EMAIL!,
      process.env.TEST_INDIVIDUAL_PASSWORD!
    );
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('individual user cannot access /admin', async ({ page }) => {
    test.skip(
      !process.env.TEST_INDIVIDUAL_EMAIL ||
        !process.env.TEST_INDIVIDUAL_PASSWORD,
      'Requires TEST_INDIVIDUAL_EMAIL and TEST_INDIVIDUAL_PASSWORD env vars'
    );
    await signInAs(
      page,
      process.env.TEST_INDIVIDUAL_EMAIL!,
      process.env.TEST_INDIVIDUAL_PASSWORD!
    );
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin/);
  });
});

test.describe('Authenticated role-based routing — admin user', () => {
  test('admin user is redirected to /admin after sign-in', async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD,
      'Requires TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD env vars'
    );
    await signInAs(
      page,
      process.env.TEST_ADMIN_EMAIL!,
      process.env.TEST_ADMIN_PASSWORD!
    );
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/admin/);
  });
});
