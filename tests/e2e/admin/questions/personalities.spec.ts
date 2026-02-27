import { test, expect } from '@playwright/test';

test.describe('Personalities page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/personalities');
  });

  test('page loads with "Play Personalities" heading', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/personalities/);
    await expect(
      page.getByRole('heading', { name: /play personalities/i })
    ).toBeVisible();
  });

  test('personality cards are rendered', async ({ page }) => {
    const cardGrid = page.locator('[class*="cardGrid"]').first();
    await expect(cardGrid).toBeVisible();
    await expect(
      cardGrid.getByRole('button', { name: /^edit$/i }).first()
    ).toBeVisible();
  });

  test('filter tabs render — All, Active, Draft', async ({ page }) => {
    for (const tab of ['All', 'Active', 'Draft']) {
      await expect(
        page.getByRole('button', { name: new RegExp(`^${tab}`, 'i') })
      ).toBeVisible();
    }
  });

  test('clicking "Active" filter does not crash the page', async ({ page }) => {
    await page.getByRole('button', { name: /^Active/i }).click();
    // Page should remain on the personalities route without error.
    await expect(page).toHaveURL(/\/admin\/personalities/);
    await expect(page.getByRole('button', { name: /^Active/i })).toBeVisible();
  });

  test('clicking "Draft" filter does not crash the page', async ({ page }) => {
    await page.getByRole('button', { name: /^Draft/i }).click();
    await expect(page).toHaveURL(/\/admin\/personalities/);
    await expect(page.getByRole('button', { name: /^Draft/i })).toBeVisible();
  });

  test('"New Personality" button opens the create modal', async ({ page }) => {
    await page.getByRole('button', { name: /new personality/i }).click();
    // The modal backdrop or modal container should become visible.
    const modal = page.locator('[class*="modal"], [class*="backdrop"]').first();
    await expect(modal).toBeVisible();
  });

  test('edit button on a card opens the edit modal', async ({ page }) => {
    // The Edit button lives in the card footer and is always visible.
    // Scope to the personality card grid to avoid matching StatsCard elements.
    const cardGrid = page.locator('[class*="cardGrid"]').first();
    const editBtn = cardGrid.getByRole('button', { name: /^edit$/i }).first();

    await editBtn.click();
    const modal = page.locator('[class*="modal"], [class*="backdrop"]').first();
    await expect(modal).toBeVisible();
  });

  test('view button on a card opens the view modal', async ({ page }) => {
    const cardGrid = page.locator('[class*="cardGrid"]').first();
    const viewBtn = cardGrid.getByRole('button', { name: /^view$/i }).first();

    await viewBtn.click();
    const modal = page.locator('[class*="modal"], [class*="backdrop"]').first();
    await expect(modal).toBeVisible();
  });
});
