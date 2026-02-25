import { test, expect } from '@playwright/test';

test.describe('Questions page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/questions');
  });

  // -- Page load -------------------------------------------------------------

  test('page loads with a visible heading', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/questions/);
    await expect(
      page.getByRole('heading', { name: /questions/i })
    ).toBeVisible();
  });

  test('question list renders at least one question', async ({ page }) => {
    const questionBtn = page.locator('[class*="questionItem"] button').first();
    await expect(questionBtn).toBeVisible();
  });

  // -- Type filter tabs ------------------------------------------------------

  test('type filter tabs are visible (All, Single, Multi, Scale, Text)', async ({
    page,
  }) => {
    for (const label of ['All', 'Single', 'Multi', 'Scale', 'Text']) {
      await expect(
        page.locator('button').filter({ hasText: new RegExp(`^${label}`) })
      ).toBeVisible();
    }
  });

  test('clicking the "Single" filter does not crash the page', async ({
    page,
  }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Single/ })
      .click();
    await expect(page).toHaveURL(/\/admin\/questions/);
    await expect(page.getByTestId('survey-search')).toBeVisible();
  });

  // -- Search ----------------------------------------------------------------

  test('search input is visible and shows empty state on no match', async ({
    page,
  }) => {
    const searchInput = page.getByTestId('survey-search');
    await expect(searchInput).toBeVisible();

    // fill() sets the DOM value but WebKit doesn't fire the input event React
    // needs for onChange. Click to focus, then type via real keyboard events.
    await searchInput.click();
    await searchInput.selectText();
    await page.keyboard.type('xyz_no_match_expected_42', { delay: 30 });

    await expect(page.getByTestId('survey-empty')).toBeVisible({
      timeout: 8000,
    });
  });

  // -- Question selection ----------------------------------------------------

  test('clicking a question opens the edit panel', async ({ page }) => {
    await page.locator('[class*="questionItem"] button').first().click();

    await expect(
      page.getByRole('heading', { name: /edit question/i })
    ).toBeVisible();
  });

  // -- Add / New Question ----------------------------------------------------

  test('"Add" button opens a blank new-question panel', async ({ page }) => {
    await page.locator('button').filter({ hasText: /Add/ }).first().click();
    await expect(
      page.getByRole('heading', { name: /new question/i })
    ).toBeVisible();
  });

  // -- ?id= query param pre-selects question ---------------------------------

  test('navigating with ?id= pre-selects the matching question', async ({
    page,
  }) => {
    await page.locator('[class*="questionItem"] button').first().click();
    await expect(
      page.getByRole('heading', { name: /edit question/i })
    ).toBeVisible();

    const idBadge = page.getByText(/^#\d+$/).first();
    await expect(idBadge).toBeVisible();
    const idText = (await idBadge.textContent())?.trim() ?? '';
    expect(idText).toMatch(/^#\d+$/);
    const id = idText.slice(1);

    await page.goto(`/admin/questions?id=${id}`);
    await expect(page).toHaveURL(new RegExp(`/admin/questions\\?id=${id}$`));
    await expect(
      page.getByRole('heading', { name: /edit question/i })
    ).toBeVisible();
    await expect(page.getByText(new RegExp(`^#${id}$`))).toBeVisible();
  });

  // -- Delete flow (smoke test) ----------------------------------------------

  test('delete button in edit panel triggers a confirmation', async ({
    page,
  }) => {
    await page.locator('[class*="questionItem"] button').first().click();
    await expect(
      page.getByRole('heading', { name: /edit question/i })
    ).toBeVisible();

    const deleteBtn = page.getByRole('button', { name: /^delete$/i });
    await expect(deleteBtn).toBeVisible();
    let dialogMessage = '';
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await deleteBtn.click();
    expect(dialogMessage).toContain('Delete this question?');
    await expect(
      page.getByRole('heading', { name: /edit question/i })
    ).toBeVisible();
  });
});
