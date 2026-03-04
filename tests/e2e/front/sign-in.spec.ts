import { test, expect } from '@playwright/test';

test.describe('Sign-in page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
  });

  test('page loads at the correct URL', async ({ page }) => {
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('Pop CoLab brand eyebrow is visible', async ({ page }) => {
    await expect(page.getByText('Pop CoLab').first()).toBeVisible();
  });

  test('"Welcome back" heading is visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /welcome back/i })
    ).toBeVisible();
  });

  test('sign-in subtext is visible', async ({ page }) => {
    await expect(
      page.getByText(/sign in to your account to continue/i)
    ).toBeVisible();
  });

  test('Clerk sign-in form renders with email input', async ({ page }) => {
    await expect(
      page.getByLabel(/email address/i).or(page.getByPlaceholder(/email/i))
    ).toBeVisible({ timeout: 8000 });
  });

  test('"Sign up free" cross-link is visible', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /sign up free/i })
    ).toBeVisible();
  });

  test('"Sign up free" link points to /sign-up', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /sign up free/i })
    ).toHaveAttribute('href', '/sign-up');
  });
});
