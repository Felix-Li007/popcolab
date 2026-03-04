import { expect, test, type Page, type TestInfo } from '@playwright/test';

async function typeIntoSearch(page: Page, value: string): Promise<void> {
  const searchInput = page.getByTestId('intake-form-search');
  await expect(searchInput).toBeVisible();
  await searchInput.click();
  await searchInput.selectText();
  if (value.length > 0) {
    await page.keyboard.type(value, { delay: 20 });
  }
}

function makeUniqueFormName(testInfo: TestInfo): string {
  return `E2E Intake ${testInfo.project.name}-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;
}

test.describe('Intake forms page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/questions/forms');
  });

  test('page loads with core controls', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/questions\/forms/);
    await expect(page.getByTestId('intake-form-search')).toBeVisible();
    await expect(page.getByRole('button', { name: /Add/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^All/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Active/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Draft/i })).toBeVisible();
    await expect(
      page
        .getByTestId('intake-form-card')
        .first()
        .or(page.getByTestId('intake-form-empty'))
    ).toBeVisible();
  });

  test('create, edit, and delete flow works end-to-end', async ({
    page,
  }, testInfo) => {
    const formName = makeUniqueFormName(testInfo);
    const editedName = `${formName} Updated`;

    await page.getByRole('button', { name: /Add/i }).click();
    await expect(page.getByTestId('intake-edit-modal-root')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /new form/i })
    ).toBeVisible();

    const formModal = page.getByTestId('intake-edit-form');
    await formModal.locator('input[name="name"]').fill(formName);
    await formModal
      .locator('textarea[name="description"]')
      .fill('E2E created intake form description');
    await formModal
      .locator('select[name="formType"]')
      .selectOption('onboarding');
    await formModal.locator('select[name="status"]').selectOption('1');

    await formModal.getByTestId('intake-edit-tab-questions').click();
    const questionOptions = formModal.getByTestId(
      'intake-edit-question-option'
    );
    await expect(questionOptions.first()).toBeVisible();
    await questionOptions.first().click();

    await formModal.getByRole('button', { name: /^Create Form$/i }).click();
    await expect(page.getByTestId('intake-edit-modal-root')).toHaveCount(0);

    await typeIntoSearch(page, formName);
    const createdCard = page
      .getByTestId('intake-form-card')
      .filter({ hasText: formName })
      .first();
    await expect(createdCard).toBeVisible();

    await createdCard.getByTestId('intake-card-edit').click();
    await expect(page.getByTestId('intake-edit-modal-root')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /edit intake form/i })
    ).toBeVisible();

    const editForm = page.getByTestId('intake-edit-form');
    await editForm.locator('input[name="name"]').fill(editedName);
    await editForm.getByRole('button', { name: /^Save Changes$/i }).click();
    await expect(page.getByTestId('intake-edit-modal-root')).toHaveCount(0);

    await typeIntoSearch(page, editedName);
    const editedCard = page
      .getByTestId('intake-form-card')
      .filter({ hasText: editedName })
      .first();
    await expect(editedCard).toBeVisible();

    let deleteDialogMessage = '';
    page.once('dialog', async dialog => {
      deleteDialogMessage = dialog.message();
      await dialog.accept();
    });
    await editedCard.getByTestId('intake-card-delete').click();
    await expect
      .poll(() => deleteDialogMessage, { timeout: 8000 })
      .toContain('Delete this intake form?');
    await expect(page.getByTestId('intake-form-empty')).toBeVisible();
  });

  test('view modal opens and supports dimension filtering', async ({
    page,
  }) => {
    const cards = page.getByTestId('intake-form-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('intake-form-empty')).toBeVisible();
      return;
    }

    await cards.first().getByTestId('intake-card-view').click();
    const viewModal = page.getByTestId('intake-view-modal');
    await expect(viewModal).toBeVisible();
    await expect(viewModal.getByText(/^Questions \(\d+\)$/)).toBeVisible();

    const questionItems = viewModal.getByTestId('intake-view-question-item');
    const allCount = await questionItems.count();

    const filters = viewModal.getByTestId('intake-view-dimension-filter');
    const filterCount = await filters.count();
    if (filterCount > 1 && allCount > 0) {
      await filters.nth(1).click();
      const filteredCount = await questionItems.count();
      expect(filteredCount).toBeLessThanOrEqual(allCount);

      await filters.first().click();
      await expect
        .poll(async () => questionItems.count(), { timeout: 8000 })
        .toBe(allCount);
    }

    await page.getByRole('button', { name: /^Close$/i }).click();
    await expect(viewModal).toHaveCount(0);
  });
});
