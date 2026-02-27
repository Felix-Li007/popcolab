import { expect, test } from '@playwright/test';

test.describe('Dimension categories page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/dimensions/categories');
  });

  test('page loads with core controls', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/dimensions\/categories/);
    await expect(page.getByTestId('dimension-category-search')).toBeVisible();
    await expect(page.getByRole('button', { name: /add/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Delete/i }).first()
    ).toBeVisible();
  });

  test('cards render or empty state is shown', async ({ page }) => {
    const firstCard = page.getByTestId('dimension-category-card').first();
    const emptyState = page.getByTestId('category-empty');
    await expect(firstCard.or(emptyState)).toBeVisible();
  });

  test('search shows empty state when no match', async ({ page }) => {
    const searchInput = page.getByTestId('dimension-category-search');
    await expect(searchInput).toBeVisible();

    await searchInput.click();
    await searchInput.selectText();
    await page.keyboard.type('zz_category_no_match_2026', { delay: 20 });

    await expect(page.getByTestId('category-empty')).toBeVisible({
      timeout: 8000,
    });
  });

  test('"Add" opens create modal', async ({ page }) => {
    await page.getByRole('button', { name: /add/i }).click();
    await expect(
      page.getByRole('heading', { name: /new category/i })
    ).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test('clicking a card opens edit modal', async ({ page }) => {
    const cards = page.getByTestId('dimension-category-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('category-empty')).toBeVisible();
      return;
    }

    await cards.first().click();
    await expect(
      page.getByRole('heading', { name: /edit category/i })
    ).toBeVisible();
    await expect(page.getByText(/^#\d+$/).first()).toBeVisible();
  });

  test('delete action opens browser dialog', async ({ page }) => {
    const cards = page.getByTestId('dimension-category-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('category-empty')).toBeVisible();
      return;
    }

    let message = '';
    page.once('dialog', async dialog => {
      message = dialog.message();
      await dialog.dismiss();
    });

    await cards
      .first()
      .getByRole('button', { name: /^Delete$/i })
      .click();

    expect(
      message.includes('Delete this category?') ||
        message.includes('currently in use')
    ).toBeTruthy();
  });

  test('bulk selection enables delete count', async ({ page }) => {
    const cards = page.getByTestId('dimension-category-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('category-empty')).toBeVisible();
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

  test('bulk delete button triggers dialog when item selected', async ({
    page,
  }) => {
    const cards = page.getByTestId('dimension-category-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('category-empty')).toBeVisible();
      return;
    }

    await cards
      .first()
      .getByRole('button', { name: /select for bulk actions/i })
      .click();

    let message = '';
    page.once('dialog', async dialog => {
      message = dialog.message();
      await dialog.dismiss();
    });
    await page.getByRole('button', { name: /delete \(1\)/i }).click();
    expect(message.length).toBeGreaterThan(0);
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
    const cards = page.getByTestId('dimension-category-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('category-empty')).toBeVisible();
      return;
    }

    await cards.first().click();
    await expect(
      page.getByRole('heading', { name: /edit category/i })
    ).toBeVisible();

    const idBadge = page.getByText(/^#\d+$/).first();
    const idText = (await idBadge.textContent())?.trim() ?? '';
    expect(idText).toMatch(/^#\d+$/);
    const id = idText.slice(1);

    await page.goto(`/admin/dimensions/categories?id=${id}`);
    await expect(page).toHaveURL(
      new RegExp(`/admin/dimensions/categories\\?id=${id}$`)
    );
    await expect(
      page.getByRole('heading', { name: /edit category/i })
    ).toBeVisible();
    const editForm = page
      .locator('form')
      .filter({
        has: page.getByRole('heading', { name: /edit category/i }),
      })
      .first();
    await expect(editForm.getByText(new RegExp(`^#${id}$`))).toBeVisible();
  });
});
