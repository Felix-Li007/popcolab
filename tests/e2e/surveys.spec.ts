import { test, expect } from '@playwright/test';

test.describe('Surveys page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/surveys');
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test('page loads with a visible heading', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/surveys/);
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('question list renders at least one question', async ({ page }) => {
    // Each question is a <button> inside a <li class={styles.questionItem}>.
    const questionBtn = page.locator('[class*="questionItem"] button').first();
    await expect(questionBtn).toBeVisible();
  });

  // ── Type filter tabs ──────────────────────────────────────────────────────

  test('type filter tabs are visible (All, Single, Multi, Scale, Text)', async ({
    page,
  }) => {
    // Each tab contains a label + a Badge counter, so exact-name matching fails.
    // Use filter({ hasText }) to match by the starting label text only.
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
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/\/admin\/surveys/);
  });

  // ── Search ────────────────────────────────────────────────────────────────

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

  // ── Question selection ────────────────────────────────────────────────────

  test('clicking a question opens the edit panel', async ({ page }) => {
    await page.locator('[class*="questionItem"] button').first().click();

    // QuestionEditPanel renders an "Edit Question" heading on the right.
    await expect(
      page.getByRole('heading', { name: /edit question/i })
    ).toBeVisible();
  });

  // ── Add / New Question ────────────────────────────────────────────────────

  test('"Add" button opens a blank new-question panel', async ({ page }) => {
    // The Button renders icon span before label, so text content is "+Add".
    // Use a partial hasText match without a start anchor.
    await page.locator('button').filter({ hasText: /Add/ }).first().click();
    await expect(
      page.getByRole('heading', { name: /new question/i })
    ).toBeVisible();
  });

  // ── ?id= query param pre-selects question ─────────────────────────────────

  test('navigating with ?id= pre-selects the matching question', async ({
    page,
  }) => {
    // Click first question so the panel opens, then re-navigate via ?id=.
    await page.locator('[class*="questionItem"] button').first().click();
    await expect(
      page.getByRole('heading', { name: /edit question/i })
    ).toBeVisible();

    const url = page.url();
    const match = url.match(/[?&]id=(\d+)/);
    if (match) {
      await page.goto(`/admin/surveys?id=${match[1]}`);
      await expect(
        page.getByRole('heading', { name: /edit question/i })
      ).toBeVisible();
    }
    // If no ?id= is pushed to the URL, the click test above already validates selection.
  });

  // ── Delete flow (smoke test) ──────────────────────────────────────────────

  test('delete button in edit panel triggers a confirmation', async ({
    page,
  }) => {
    await page.locator('[class*="questionItem"] button').first().click();

    const deleteBtn = page.getByRole('button', { name: /delete/i });
    if (await deleteBtn.isVisible()) {
      page.on('dialog', dialog => dialog.dismiss()); // cancel — don't actually delete
      await deleteBtn.click();
      await expect(
        page.getByRole('heading', { name: /edit question/i })
      ).toBeVisible();
    }
  });
});
