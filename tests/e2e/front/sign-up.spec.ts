import { test, expect } from '@playwright/test';

test.describe('Sign-up page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up');
  });

  test('page loads at the correct URL', async ({ page }) => {
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test('Pop CoLab brand eyebrow is visible', async ({ page }) => {
    await expect(page.getByText('Pop CoLab').first()).toBeVisible();
  });

  test('"Join Pop CoLab" heading is visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /join pop colab/i })
    ).toBeVisible();
  });

  test('sign-up subtext is visible', async ({ page }) => {
    await expect(
      page.getByText(/create your account to get started/i)
    ).toBeVisible();
  });

  test('Clerk sign-up form renders with email input', async ({ page }) => {
    await expect(
      page.getByLabel(/email address/i).or(page.getByPlaceholder(/email/i))
    ).toBeVisible({ timeout: 8000 });
  });

  test('"Sign in" cross-link is visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('"Sign in" cross-link points to /sign-in', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/sign-in'
    );
  });
});
