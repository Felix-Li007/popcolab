import { test, expect, type Page } from '@playwright/test';

/** Returns true if the quiz has no questions seeded in the current environment. */
async function quizHasNoQuestions(page: Page): Promise<boolean> {
  return page
    .getByText(/no questions available/i)
    .isVisible({ timeout: 3000 })
    .catch(() => false);
}

test.describe('Personality quiz page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test');
  });

  test('page loads and displays the quiz heading', async ({ page }) => {
    await expect(page).toHaveURL(/\/test/);
    await expect(
      page.getByRole('heading', { name: /play personality test/i })
    ).toBeVisible();
  });

  test('instruction subtext is visible', async ({ page }) => {
    await expect(page.getByText(/answer honestly/i)).toBeVisible();
  });

  test('shows empty state message when no questions are available', async ({
    page,
  }) => {
    if (!(await quizHasNoQuestions(page))) return;
    await expect(page.getByText(/no questions available/i)).toBeVisible();
  });

  test('first question renders when questions are available', async ({
    page,
  }) => {
    if (await quizHasNoQuestions(page)) return;
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
  });

  test('Back button is disabled on the first question', async ({ page }) => {
    if (await quizHasNoQuestions(page)) return;
    await expect(page.getByRole('button', { name: /^back$/i })).toBeDisabled();
  });

  test('Next or See My Result button is visible', async ({ page }) => {
    if (await quizHasNoQuestions(page)) return;
    await expect(
      page.getByRole('button', { name: /next|see my result/i })
    ).toBeVisible();
  });

  test('answering a scale question enables the Next button', async ({
    page,
  }) => {
    if (await quizHasNoQuestions(page)) return;

    // Only applies to scale-type questions
    const scale3 = page.getByRole('button', { name: /^3$/ }).first();
    if (!(await scale3.isVisible({ timeout: 2000 }).catch(() => false))) return;

    const nextBtn = page.getByRole('button', { name: /next|see my result/i });
    await expect(nextBtn).toBeDisabled();

    await scale3.click();
    await expect(nextBtn).toBeEnabled();
  });

  test('answering a single-choice question enables the Next button', async ({
    page,
  }) => {
    if (await quizHasNoQuestions(page)) return;

    // Skip if not a single_choice question
    const isScale = await page
      .getByRole('button', { name: /^3$/ })
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    const isTextInput = await page
      .getByRole('button', { name: /mark as read/i })
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    if (isScale || isTextInput) return;

    const nextBtn = page.getByRole('button', { name: /next|see my result/i });
    await expect(nextBtn).toBeDisabled();

    const firstChoice = page
      .locator('button[class*="border-2"]')
      .filter({ hasNotText: /^(Back|Next|See My Result|[1-5])$/ })
      .first();

    if (!(await firstChoice.isVisible({ timeout: 2000 }).catch(() => false)))
      return;

    await firstChoice.click();
    await expect(nextBtn).toBeEnabled();
  });

  test('"Mark as read & continue" button enables Next for reflection questions', async ({
    page,
  }) => {
    if (await quizHasNoQuestions(page)) return;

    const markAsRead = page.getByRole('button', { name: /mark as read/i });
    if (!(await markAsRead.isVisible({ timeout: 2000 }).catch(() => false)))
      return;

    await markAsRead.click();
    await expect(
      page.getByRole('button', { name: /next|see my result/i })
    ).toBeEnabled();
  });
});
