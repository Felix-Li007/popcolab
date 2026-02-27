import { expect, test } from '@playwright/test';

test.describe('Dimensions page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/dimensions');
  });

  test('page loads with core controls', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/dimensions/);
    await expect(page.getByTestId('dimension-search')).toBeVisible();
    await expect(page.getByRole('button', { name: /add/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Delete/i }).first()
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^All/i })).toBeVisible();
    await expect(
      page.locator('label:has-text("HARD FILTER")').first()
    ).toBeVisible();
  });

  test('cards render or empty state is shown', async ({ page }) => {
    const firstCard = page.getByTestId('dimension-card').first();
    const emptyState = page.getByTestId('dimension-empty');
    await expect(firstCard.or(emptyState)).toBeVisible();
  });

  test('search shows empty state when no match', async ({ page }) => {
    const searchInput = page.getByTestId('dimension-search');
    await expect(searchInput).toBeVisible();

    await searchInput.click();
    await searchInput.selectText();
    await page.keyboard.type('zz_dimension_no_match_2026', { delay: 20 });

    await expect(page.getByTestId('dimension-empty')).toBeVisible({
      timeout: 8000,
    });
  });

  test('hard filter switch toggles without navigation errors', async ({
    page,
  }) => {
    const hardFilterSwitch = page
      .locator('label:has-text("HARD FILTER") input[type="checkbox"]')
      .first();
    await expect(hardFilterSwitch).not.toBeChecked();

    await page.locator('label:has-text("HARD FILTER")').first().click();
    await expect(hardFilterSwitch).toBeChecked();
    await expect(page).toHaveURL(/\/admin\/dimensions/);
  });

  test('"Add" opens create modal', async ({ page }) => {
    await page.getByRole('button', { name: /add/i }).click();
    await expect(
      page.getByRole('heading', { name: /new dimension/i })
    ).toBeVisible();
    await expect(page.getByText('ALLOW VALUE')).toBeVisible();
  });

  test('clicking a card opens edit modal', async ({ page }) => {
    const cards = page.getByTestId('dimension-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('dimension-empty')).toBeVisible();
      return;
    }

    await cards.first().click();
    await expect(
      page.getByRole('heading', { name: /edit dimension/i })
    ).toBeVisible();
    await expect(page.getByText(/^#\d+$/).first()).toBeVisible();
  });

  test('view action opens detail modal', async ({ page }) => {
    const cards = page.getByTestId('dimension-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('dimension-empty')).toBeVisible();
      return;
    }

    await cards
      .first()
      .getByRole('button', { name: /^View$/i })
      .click();
    await expect(page.getByText(/^Created:/)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Edit$/i }).last()
    ).toBeVisible();
  });

  test('delete action opens confirmation dialog', async ({ page }) => {
    const cards = page.getByTestId('dimension-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('dimension-empty')).toBeVisible();
      return;
    }

    let dialogMessage = '';
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    await cards
      .first()
      .getByRole('button', { name: /^Delete$/i })
      .click();
    expect(dialogMessage).toContain('Delete this dimension?');
  });

  test('bulk selection enables delete count', async ({ page }) => {
    const cards = page.getByTestId('dimension-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('dimension-empty')).toBeVisible();
      return;
    }

    await cards
      .first()
      .getByRole('button', { name: /select for bulk actions/i })
      .click();
    await expect(
      page.getByRole('button', { name: /Delete \(1\)/i })
    ).toBeVisible();
  });

  test('pagination controls work when multiple pages exist', async ({
    page,
  }) => {
    const nextPageBtn = page.locator('button[title="Next page"]');
    if ((await nextPageBtn.count()) === 0) return;

    const prevPageBtn = page.locator('button[title="Previous page"]');
    await expect(prevPageBtn).toBeDisabled();
    await nextPageBtn.click();
    await expect(prevPageBtn).toBeEnabled();
  });

  test('navigating with ?id= opens matching edit modal', async ({ page }) => {
    const cards = page.getByTestId('dimension-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('dimension-empty')).toBeVisible();
      return;
    }

    await cards.first().click();
    await expect(
      page.getByRole('heading', { name: /edit dimension/i })
    ).toBeVisible();

    const idBadge = page.getByText(/^#\d+$/).first();
    const idText = (await idBadge.textContent())?.trim() ?? '';
    expect(idText).toMatch(/^#\d+$/);
    const id = idText.slice(1);

    await page.goto(`/admin/dimensions?id=${id}`);
    await expect(page).toHaveURL(new RegExp(`/admin/dimensions\\?id=${id}$`));
    await expect(
      page.getByRole('heading', { name: /edit dimension/i })
    ).toBeVisible();
    await expect(page.getByText(new RegExp(`^#${id}$`))).toBeVisible();
  });
});
