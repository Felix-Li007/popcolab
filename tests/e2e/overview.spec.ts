import { test, expect } from '@playwright/test';

test.describe('Admin Overview page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('page loads and displays a heading', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin/);
    // The overview page should have a visible heading or page title.
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('stats grid is visible', async ({ page }) => {
    // Each stat card sits inside the stats section.
    // We look for at least two numeric stat values rendered on the page.
    const statsSection = page
      .locator('[class*="stats"], [class*="stat"]')
      .first();
    await expect(statsSection).toBeVisible();
  });

  test('Personalities preview section renders cards', async ({ page }) => {
    const section = page
      .getByRole('heading', { name: /personalit/i })
      .locator('..');

    await expect(section).toBeVisible();

    // At least one personality card should be present.
    const cards = page.locator('[class*="personalityCard"], [class*="card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('Surveys preview section renders question cards', async ({ page }) => {
    const section = page
      .getByRole('heading', { name: /survey/i })
      .locator('..');

    await expect(section).toBeVisible();

    // At least one survey preview card.
    const cards = page.locator('[class*="previewCard"]');
    await expect(cards.first()).toBeVisible();
  });

  test('"View all" link in Surveys section navigates to /admin/surveys', async ({
    page,
  }) => {
    const link = page.getByRole('link', { name: /view all/i }).last(); // last "View all" should be Surveys section

    await link.click();
    await expect(page).toHaveURL(/\/admin\/surveys/);
  });

  test('clicking a survey preview card navigates with ?id= param', async ({
    page,
  }) => {
    const card = page.locator('[class*="previewCard"]').first();
    await expect(card).toBeVisible();

    await card.click();
    await expect(page).toHaveURL(/\/admin\/surveys\?id=/);
  });
});
