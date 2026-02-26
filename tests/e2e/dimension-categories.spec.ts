import { expect, test } from '@playwright/test';

test.describe('Dimension categories page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/dimensions/categories');
  });

  test('page loads with heading', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/dimensions\/categories/);
    await expect(
      page.getByRole('heading', { name: /dimension categories/i })
    ).toBeVisible();
  });

  test('search input is visible', async ({ page }) => {
    await expect(page.getByTestId('dimension-category-search')).toBeVisible();
  });

  test('new category button opens create panel', async ({ page }) => {
    await page.getByRole('button', { name: /new category/i }).click();
    await expect(
      page.getByRole('heading', { name: /new category/i })
    ).toBeVisible();
  });
});
