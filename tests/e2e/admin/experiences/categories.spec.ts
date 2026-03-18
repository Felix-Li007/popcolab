import { expect, test, type Page } from '@playwright/test';

function uniqueSuffix(testName: string) {
  return `${testName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
}

async function createRootCategory(page: Page, title: string) {
  await page.getByRole('button', { name: /new root/i }).click();
  const modal = page.getByTestId('experience-category-form');
  await expect(modal).toBeVisible();
  await modal.locator('input[name="title"]').fill(title);
  await modal.getByRole('button', { name: /create root/i }).click();
  await expect(modal).toHaveCount(0, { timeout: 10000 });
  await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });
}

async function createChildCategory(page: Page, title: string) {
  await page.getByRole('button', { name: /add child/i }).click();
  const modal = page.getByTestId('experience-category-form');
  await expect(modal).toBeVisible();
  await modal.locator('input[name="title"]').fill(title);
  await modal.getByRole('button', { name: /create child/i }).click();
  await expect(modal).toHaveCount(0, { timeout: 10000 });
  await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });
}

test.describe('Experience categories page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/experiences/categories');
  });

  test('page loads with core controls', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/experiences\/categories/);
    await expect(
      page.getByTestId('experience-category-search-global')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /new root/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /add child/i })
    ).toBeVisible();
    await expect(
      page.getByTestId('experience-category-tree-panel')
    ).toBeVisible();
    await expect(
      page.getByTestId('experience-category-detail-panel')
    ).toBeVisible();
  });

  test('search can show tree empty state', async ({ page }) => {
    const searchInput = page.getByTestId('experience-category-search-global');
    await searchInput.fill('zz_experience_category_no_match_2026');
    await expect(
      page.getByTestId('experience-category-tree-empty')
    ).toBeVisible({ timeout: 8000 });
  });

  test('new root opens create modal', async ({ page }) => {
    await page.getByRole('button', { name: /new root/i }).click();
    const modal = page.getByTestId('experience-category-form');
    await expect(modal).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /new root category/i })
    ).toBeVisible();
    await expect(modal.locator('input[name="title"]')).toBeVisible();
    await modal.getByRole('button', { name: /^cancel$/i }).click();
    await expect(page.getByTestId('experience-category-form')).toHaveCount(0);
  });

  test('clicking a tree node updates the details panel', async ({ page }) => {
    const treeNodes = page.getByTestId('experience-category-tree-node');
    if ((await treeNodes.count()) === 0) {
      await expect(
        page.getByTestId('experience-category-tree-empty')
      ).toBeVisible();
      return;
    }

    const firstNode = treeNodes.first();
    const firstTitle = (
      await firstNode
        .locator('[data-testid^="experience-category-title-"]')
        .first()
        .textContent()
    )?.trim();

    await firstNode
      .locator('[data-testid^="experience-category-select-"]')
      .click();
    await expect(
      page.getByTestId('experience-category-detail-panel')
    ).toContainText(/Parent|Level|Children|Linked/);

    if (firstTitle) {
      await expect(
        page.getByTestId('experience-category-detail-title')
      ).toHaveText(firstTitle);
    }
  });

  test('tree toggle collapses submenu immediately', async ({ page }) => {
    const toggles = page.locator(
      '[data-testid^="experience-category-toggle-"]'
    );
    if ((await toggles.count()) === 0) {
      await expect(page.getByTestId('experience-category-tree')).toBeVisible();
      return;
    }

    const toggle = toggles.first();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('can create a root category and then a child category', async ({
    page,
  }, testInfo) => {
    const rootTitle = `E2E Root ${uniqueSuffix(testInfo.title)}`;
    const childTitle = `E2E Child ${uniqueSuffix(testInfo.title)}`;

    await createRootCategory(page, rootTitle);
    await page.locator(`text=${rootTitle}`).first().click();
    await expect(
      page.getByTestId('experience-category-detail-title')
    ).toHaveText(rootTitle);

    await createChildCategory(page, childTitle);
    await expect(page.getByText(childTitle).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('delete button opens browser confirmation dialog', async ({ page }) => {
    const deleteButton = page
      .getByTestId('experience-category-tree-node')
      .first()
      .getByRole('button', { name: /^delete$/i });

    if ((await deleteButton.count()) === 0) {
      await expect(
        page.getByTestId('experience-category-tree-empty')
      ).toBeVisible();
      return;
    }

    let dialogMessage = '';
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    await deleteButton.click();
    expect(dialogMessage).toContain('Delete this category?');
  });
});
