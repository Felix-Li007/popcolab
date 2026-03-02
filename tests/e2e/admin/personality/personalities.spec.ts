import { test, expect } from '@playwright/test';

test.describe('Personalities page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/personalities');
  });

  test('page loads with core controls', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/personalities/);
    await expect(page.getByRole('button', { name: /new/i })).toBeVisible();
  });

  test('personality cards are rendered', async ({ page }) => {
    const cardGrid = page
      .locator('[class*="personalityGrid"], [class*="cardGrid"]')
      .first();
    await expect(cardGrid).toBeVisible();

    const editButtons = cardGrid.getByRole('button', { name: /edit/i });
    if ((await editButtons.count()) > 0) {
      await expect(editButtons.first()).toBeVisible();
    }
  });

  test('filter tabs render — All, Active, Draft', async ({ page }) => {
    for (const tab of ['All', 'Active', 'Draft']) {
      await expect(
        page.getByRole('button', { name: new RegExp(`^${tab}`, 'i') })
      ).toBeVisible();
    }
  });

  test('clicking "Active" filter does not crash the page', async ({ page }) => {
    await page.getByRole('button', { name: /active/i }).click();
    // Page should remain on the personalities route without error.
    await expect(page).toHaveURL(/\/admin\/personalities/);
    await expect(page.getByRole('button', { name: /active/i })).toBeVisible();
  });

  test('clicking "Draft" filter does not crash the page', async ({ page }) => {
    await page.getByRole('button', { name: /draft/i }).click();
    await expect(page).toHaveURL(/\/admin\/personalities/);
    await expect(page.getByRole('button', { name: /draft/i })).toBeVisible();
  });

  test('"New" button opens the create modal', async ({ page }) => {
    await page.getByRole('button', { name: /new/i }).click();
    await expect(
      page.getByRole('heading', { name: /new personality/i })
    ).toBeVisible();
  });

  test('edit button on a card opens the edit modal', async ({ page }) => {
    // The Edit button lives in the card footer and is always visible.
    // Scope to the personality card grid to avoid matching StatsCard elements.
    const cardGrid = page
      .locator('[class*="personalityGrid"], [class*="cardGrid"]')
      .first();
    const editBtn = cardGrid.getByRole('button', { name: /edit/i }).first();
    if ((await editBtn.count()) === 0) {
      await expect(cardGrid).toBeVisible();
      return;
    }

    await editBtn.click();
    await expect(
      page.getByRole('heading', { name: /edit personality/i })
    ).toBeVisible();
  });

  test('view button on a card opens the view modal', async ({ page }) => {
    const cardGrid = page
      .locator('[class*="personalityGrid"], [class*="cardGrid"]')
      .first();
    const viewBtn = cardGrid.getByRole('button', { name: /^view$/i }).first();
    if ((await viewBtn.count()) === 0) {
      await expect(cardGrid).toBeVisible();
      return;
    }

    await viewBtn.click();
    const modal = page.locator('[class*="modal"], [class*="backdrop"]').first();
    await expect(modal).toBeVisible();
  });
});
