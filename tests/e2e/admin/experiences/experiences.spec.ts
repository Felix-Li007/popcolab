import { expect, test } from '@playwright/test';

test.describe('Experiences page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/experiences');
  });

  test('page loads with core controls', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/experiences/);
    await expect(page.getByTestId('experience-search')).toBeVisible();
    await expect(page.getByRole('button', { name: /^add$/i })).toBeVisible();
    await expect(page.getByLabel(/filter by capacity/i)).toBeVisible();
    await expect(page.getByLabel(/filter by lead type/i)).toBeVisible();
    await expect(page.getByLabel(/filter by delivery methods/i)).toBeVisible();
    await expect(page.getByLabel(/filter by duration/i)).toBeVisible();
    await expect(page.getByLabel(/filter by experience status/i)).toBeVisible();
    await expect(page.getByLabel(/new this week/i)).toBeVisible();
  });

  test('cards render or empty state is shown', async ({ page }) => {
    const firstCard = page.getByTestId('experience-card').first();
    const emptyState = page.getByTestId('experience-empty');
    await expect(firstCard.or(emptyState)).toBeVisible();
  });

  test('search shows empty state when no match', async ({ page }) => {
    const searchInput = page.getByTestId('experience-search');
    await expect(searchInput).toBeVisible();

    await searchInput.click();
    await searchInput.selectText();
    await page.keyboard.type('zz_experience_no_match_2026', { delay: 20 });

    await expect(page.getByTestId('experience-empty')).toBeVisible({
      timeout: 8000,
    });
  });

  test('filters can be changed and cleared without navigation errors', async ({
    page,
  }) => {
    const statusFilter = page.getByLabel(/filter by experience status/i);
    const newOnlyCheckbox = page.getByLabel(/new this week/i);

    await statusFilter.selectOption('active');
    await expect(statusFilter).toHaveValue('active');

    await newOnlyCheckbox.check();
    await expect(newOnlyCheckbox).toBeChecked();
    await expect(
      page.getByRole('button', { name: /clear filters/i })
    ).toBeVisible();

    await page.getByRole('button', { name: /clear filters/i }).click();
    await expect(statusFilter).toHaveValue('all');
    await expect(newOnlyCheckbox).not.toBeChecked();
    await expect(page).toHaveURL(/\/admin\/experiences/);
  });

  test('"Add" opens create modal', async ({ page }) => {
    await page.getByRole('button', { name: /^add$/i }).click();
    const formModal = page.getByTestId('experience-form-modal');
    await expect(formModal).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /create experience/i })
    ).toBeVisible();
    await expect(formModal.locator('select[name="leadType"]')).toBeVisible();
    await expect(
      formModal.locator('select[name="deliveryMethods"]')
    ).toBeVisible();
    await expect(
      formModal.locator('select[name="experienceStatus"]')
    ).toBeVisible();
    await formModal.getByRole('button', { name: /^cancel$/i }).click();
    await expect(page.getByTestId('experience-form-modal')).toHaveCount(0);
  });

  test('clicking a card opens edit modal', async ({ page }) => {
    const cards = page.getByTestId('experience-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('experience-empty')).toBeVisible();
      return;
    }

    await cards.first().click();
    const formModal = page.getByTestId('experience-form-modal');
    await expect(formModal).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /edit experience/i })
    ).toBeVisible();
    await expect(formModal.locator('select[name="leadType"]')).toBeVisible();
  });

  test('view action opens detail modal and supports close/edit actions', async ({
    page,
  }) => {
    const cards = page.getByTestId('experience-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('experience-empty')).toBeVisible();
      return;
    }

    await cards
      .first()
      .getByRole('button', { name: /^view$/i })
      .click();
    const detailModal = page.getByTestId('experience-view-modal');
    await expect(detailModal).toBeVisible();
    await expect(detailModal.getByText(/^Created:/)).toBeVisible();
    await expect(detailModal.getByText(/^Updated:/)).toBeVisible();
    await detailModal.getByRole('button', { name: /^close$/i }).click();
    await expect(page.getByTestId('experience-view-modal')).toHaveCount(0);

    await cards
      .first()
      .getByRole('button', { name: /^view$/i })
      .click();
    await expect(detailModal).toBeVisible();
    await detailModal.getByRole('button', { name: /^edit$/i }).click();
    await expect(page.getByTestId('experience-view-modal')).toHaveCount(0);
    await expect(page.getByTestId('experience-form-modal')).toBeVisible();
  });

  test('delete action opens confirmation dialog', async ({ page }) => {
    const cards = page.getByTestId('experience-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('experience-empty')).toBeVisible();
      return;
    }

    let dialogMessage = '';
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    await cards
      .first()
      .getByRole('button', { name: /^delete$/i })
      .click();
    expect(dialogMessage).toContain('Delete this experience?');
  });

  test('navigating with ?id= opens matching edit modal', async ({ page }) => {
    const cards = page.getByTestId('experience-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('experience-empty')).toBeVisible();
      return;
    }

    await cards.first().click();
    const formModal = page.getByTestId('experience-form-modal');
    await expect(formModal).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /edit experience/i })
    ).toBeVisible();

    const titleText = (
      await formModal.locator('input[name="experienceTitle"]').inputValue()
    ).trim();
    expect(titleText).not.toHaveLength(0);
    const selectedId = new URL(page.url()).searchParams.get('id');
    expect(selectedId).toMatch(/^\d+$/);

    await page.goto(`/admin/experiences?id=${selectedId}`);
    const url = new URL(page.url());
    expect(url.pathname).toMatch(/^\/admin\/experiences\/?$/);
    expect(url.searchParams.get('id')).toBe(selectedId);
    await expect(
      page.getByRole('heading', { name: /edit experience/i })
    ).toBeVisible();
    await expect(
      page
        .getByTestId('experience-form-modal')
        .locator('input[name="experienceTitle"]')
    ).toHaveValue(titleText);
  });
});
