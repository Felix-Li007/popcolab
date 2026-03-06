import { test, expect } from '@playwright/test';

test.describe('Sign-in page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
  });

  test('page loads at the correct URL', async ({ page }) => {
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('"Back to Home" button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /back to home/i })
    ).toBeVisible();
  });

  test('clicking "Back to Home" navigates to home page', async ({ page }) => {
    await page.getByRole('button', { name: /back to home/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('"Sign in to Popcolab" heading is visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /sign in to popcolab/i })
    ).toBeVisible();
  });

  test('sign-in subtext is visible', async ({ page }) => {
    await expect(page.getByText(/sign in to continue/i)).toBeVisible();
  });

  test('Clerk sign-in form renders with email input', async ({ page }) => {
    await expect(
      page.getByLabel(/email address/i).or(page.getByPlaceholder(/email/i))
    ).toBeVisible({ timeout: 8000 });
  });

  test('"Sign up" cross-link is visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /^sign up$/i })).toBeVisible();
  });

  test('"Sign up" link points to /sign-up', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /^sign up$/i })
    ).toHaveAttribute('href', /\/sign-up$/);
  });
});
