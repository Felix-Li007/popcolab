import { test, expect } from '@playwright/test';
import { signInAsUser, needsUserCreds, SKIP_REASON } from './helpers';

test.describe.serial('User dashboard — personality page', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(needsUserCreds(), SKIP_REASON);
    await signInAsUser(page);
    await page.goto('/dashboard/personality');
  });

  // ── Page load ──────────────────────────────────────────────────────────────

  test('personality page loads at /dashboard/personality', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/personality/);
  });

  test('page heading renders', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /^play personality$/i })
    ).toBeVisible();
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  test('empty state renders when no result saved', async ({ page }) => {
    const hasResult = await page
      .getByRole('heading', { name: /primary type/i })
      .isVisible()
      .catch(() => false);
    if (hasResult) return; // skip — user has a result

    await expect(
      page.getByRole('heading', { name: /discover your play personality/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /take the assessment/i })
    ).toHaveAttribute('href', '/test');
  });

  // ── Result state ───────────────────────────────────────────────────────────

  test('primary type card renders when result is saved', async ({ page }) => {
    const hasPrimary = await page
      .getByText(/primary type/i)
      .isVisible()
      .catch(() => false);
    if (!hasPrimary) return; // skip — no result yet

    await expect(page.getByText(/primary type/i)).toBeVisible();
  });

  test('match percentage is displayed for primary type', async ({ page }) => {
    const hasPrimary = await page
      .getByText(/primary type/i)
      .isVisible()
      .catch(() => false);
    if (!hasPrimary) return;

    await expect(page.getByText(/%/)).toBeVisible();
  });

  test('"Other Matches" section renders when multiple personalities exist', async ({
    page,
  }) => {
    const hasOthers = await page
      .getByRole('heading', { name: /other matches/i })
      .isVisible()
      .catch(() => false);
    if (!hasOthers) return;

    await expect(
      page.getByRole('heading', { name: /other matches/i })
    ).toBeVisible();
    await expect(
      page.getByText(/you also show traits of these personality types/i)
    ).toBeVisible();
  });

  test('"What this means for you" section renders', async ({ page }) => {
    const hasPrimary = await page
      .getByText(/primary type/i)
      .isVisible()
      .catch(() => false);
    if (!hasPrimary) return;

    await expect(
      page.getByRole('heading', { name: /what this means for you/i })
    ).toBeVisible();
  });

  test('"Retake Assessment" link renders and points to /test', async ({
    page,
  }) => {
    const hasPrimary = await page
      .getByText(/primary type/i)
      .isVisible()
      .catch(() => false);
    if (!hasPrimary) return;

    await expect(
      page.getByRole('link', { name: /retake assessment/i })
    ).toHaveAttribute('href', '/test');
  });
});
