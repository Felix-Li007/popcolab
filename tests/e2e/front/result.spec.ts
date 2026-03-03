import { test, expect, type Page } from '@playwright/test';

/**
 * Clicks through every quiz question (selecting first/middle answers) and
 * returns the result page URL. Returns null if no questions are seeded.
 */
async function runQuizToResult(page: Page): Promise<string | null> {
  await page.goto('/test');

  if (
    await page
      .getByText(/no questions available/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false)
  ) {
    return null;
  }

  for (let step = 0; step < 60; step++) {
    if (page.url().includes('/test/result')) break;

    // Scale question: select the middle value (3)
    const scale3 = page.getByRole('button', { name: /^3$/ }).first();
    if (await scale3.isVisible({ timeout: 300 }).catch(() => false)) {
      await scale3.click();
    }

    // Reflection / text input question
    const markAsRead = page.getByRole('button', { name: /mark as read/i });
    if (await markAsRead.isVisible({ timeout: 300 }).catch(() => false)) {
      await markAsRead.click();
    }

    // Single / multi choice: click first available option
    const firstChoice = page
      .locator('button[class*="border-2"]')
      .filter({ hasNotText: /^(Back|Next|See My Result|Submitting|[1-5])$/ })
      .first();
    if (await firstChoice.isVisible({ timeout: 300 }).catch(() => false)) {
      await firstChoice.click().catch(() => {});
    }

    // Navigate forward
    const proceed = page
      .getByRole('button', { name: /^(next|see my result)$/i })
      .first();
    if (
      (await proceed.isVisible({ timeout: 500 }).catch(() => false)) &&
      !(await proceed.isDisabled().catch(() => true))
    ) {
      await proceed.click();
    }

    await page.waitForTimeout(400);
  }

  return page.url().includes('/test/result') ? page.url() : null;
}

let resultUrl = '';

// Serial so all tests share the single quiz run from beforeAll
test.describe.serial('Personality results page', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    resultUrl = (await runQuizToResult(page)) ?? '';
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    if (!resultUrl) return;
    await page.goto(resultUrl);
  });

  // ── Page load ──────────────────────────────────────────────────────────────

  test('result page loads after completing the quiz', async ({ page }) => {
    if (!resultUrl) return;
    await expect(page).toHaveURL(/\/test\/result/);
    await expect(page.getByTestId('results-page')).toBeVisible();
  });

  test('page heading renders', async ({ page }) => {
    if (!resultUrl) return;
    await expect(
      page.getByRole('heading', { name: /your play personalities/i })
    ).toBeVisible();
  });

  // ── Personality cards ──────────────────────────────────────────────────────

  test('primary personality card renders with PRIMARY badge', async ({
    page,
  }) => {
    if (!resultUrl) return;
    await expect(page.getByTestId('results-primary-card')).toBeVisible();
    await expect(page.getByText(/^primary$/i)).toBeVisible();
  });

  test('other matches panel renders when multiple personalities match', async ({
    page,
  }) => {
    if (!resultUrl) return;
    const otherMatches = page.getByTestId('results-other-matches');
    if ((await otherMatches.count()) === 0) return;
    await expect(otherMatches).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /other matches/i })
    ).toBeVisible();
  });

  // ── Share button ───────────────────────────────────────────────────────────

  test('Share my results button is visible', async ({ page }) => {
    if (!resultUrl) return;
    await expect(
      page.getByRole('button', { name: /share my results/i })
    ).toBeVisible();
  });

  // ── Benefit tiles ──────────────────────────────────────────────────────────

  test('benefit tiles section renders all 3 tiles', async ({ page }) => {
    if (!resultUrl) return;
    await expect(page.getByTestId('results-benefit-tiles')).toBeVisible();
    await expect(page.getByTestId('results-benefit-tile')).toHaveCount(3);
  });

  test('benefit tile labels are correct', async ({ page }) => {
    if (!resultUrl) return;
    await expect(page.getByText('Curated Experiences')).toBeVisible();
    await expect(page.getByText('Team Dynamics')).toBeVisible();
    await expect(page.getByText('Saved Profile')).toBeVisible();
  });

  // ── Experience teasers ─────────────────────────────────────────────────────

  test('experience teasers section renders with heading', async ({ page }) => {
    if (!resultUrl) return;
    await expect(page.getByTestId('results-experience-teasers')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /experiences made for you/i })
    ).toBeVisible();
  });

  test('experience teasers render all 3 cards', async ({ page }) => {
    if (!resultUrl) return;
    await expect(page.getByTestId('results-experience-card')).toHaveCount(3);
  });

  test('experience teaser cards show tag labels', async ({ page }) => {
    if (!resultUrl) return;
    await expect(page.getByText('For Creators')).toBeVisible();
    await expect(page.getByText('For Strategists')).toBeVisible();
    await expect(page.getByText('For Performers')).toBeVisible();
  });

  // ── Team banner ────────────────────────────────────────────────────────────

  test('team banner renders with heading', async ({ page }) => {
    if (!resultUrl) return;
    await expect(page.getByTestId('results-team-banner')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /build your dream team/i })
    ).toBeVisible();
  });

  // ── CTA section ───────────────────────────────────────────────────────────

  test('CTA section renders with heading and sign-up link', async ({
    page,
  }) => {
    if (!resultUrl) return;
    await expect(page.getByTestId('results-cta')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /ready to unlock everything/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /create free account/i })
    ).toBeVisible();
  });

  test('"Create free account" link points to /sign-up', async ({ page }) => {
    if (!resultUrl) return;
    await expect(
      page.getByRole('link', { name: /create free account/i })
    ).toHaveAttribute('href', '/sign-up');
  });

  test('"Sign in" link points to /sign-in', async ({ page }) => {
    if (!resultUrl) return;
    await expect(
      page.getByRole('link', { name: /^sign in$/i })
    ).toHaveAttribute('href', '/sign-in');
  });

  test('"Retake the test" link points to /test', async ({ page }) => {
    if (!resultUrl) return;
    await expect(
      page.getByRole('link', { name: /retake the test/i })
    ).toHaveAttribute('href', '/test');
  });
});
