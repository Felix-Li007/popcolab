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
    await expect(
      page.getByText('Quiz Completions', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText('Bookings / Month', { exact: true })
    ).toBeVisible();
  });

  test('Personalities preview section renders cards', async ({ page }) => {
    const section = page
      .getByRole('heading', { name: /personalit/i })
      .locator('xpath=ancestor::section[1]');

    await expect(section).toBeVisible();
    await expect(
      section.getByRole('button', { name: /^edit$/i }).first()
    ).toBeVisible();
  });

  test('Questions preview section renders question cards', async ({ page }) => {
    const section = page
      .getByRole('heading', { name: /questions/i })
      .locator('xpath=ancestor::section[1]');

    await expect(section).toBeVisible();

    await expect(
      section.locator('a[href^="/admin/questions?id="]').first()
    ).toBeVisible();
  });

  test('"View all" link in Questions section navigates to /admin/questions', async ({
    page,
  }) => {
    const questionsSection = page
      .getByRole('heading', { name: /questions/i })
      .locator('xpath=ancestor::section[1]');
    const link = questionsSection.getByRole('link', { name: /view all/i });

    await expect(link).toHaveAttribute('href', '/admin/questions');
    await Promise.all([
      page.waitForURL(/\/admin\/questions(?:\?.*)?$/),
      link.click(),
    ]);
  });

  test('clicking a question preview card navigates with ?id= param', async ({
    page,
  }) => {
    const card = page.locator('a[href^="/admin/questions?id="]').first();
    await expect(card).toBeVisible();

    await card.click();
    await expect(page).toHaveURL(/\/admin\/questions\?id=\d+/);
  });
});
