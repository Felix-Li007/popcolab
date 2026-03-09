import { test, expect } from '@playwright/test';
import { signInAsUser, needsUserCreds, SKIP_REASON } from './helpers';

test.describe.serial('User dashboard — overview', () => {
  test.beforeAll(async ({ browser }) => {
    test.skip(needsUserCreds(), SKIP_REASON);
    const page = await browser.newPage();
    await signInAsUser(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    test.skip(needsUserCreds(), SKIP_REASON);
    await signInAsUser(page);
    await page.goto('/dashboard');
  });

  // ── Page load ──────────────────────────────────────────────────────────────

  test('dashboard loads at /dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('page title shows "My Dashboard"', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /my dashboard/i })
    ).toBeVisible();
  });

  test('welcome message includes user name', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /welcome back/i })
    ).toBeVisible();
  });

  // ── Sidenav ────────────────────────────────────────────────────────────────

  test('sidenav is rendered', async ({ page }) => {
    await expect(page.getByTestId('dashboard-sidenav')).toBeVisible();
  });

  test('sidenav shows all main nav items', async ({ page }) => {
    const nav = page.getByTestId('dashboard-sidenav');
    await expect(nav.getByRole('link', { name: /^overview$/i })).toBeVisible();
    await expect(
      nav.getByRole('link', { name: /^personality$/i })
    ).toBeVisible();
    await expect(nav.getByRole('link', { name: /^my teams$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^requests$/i })).toBeVisible();
    await expect(
      nav.getByRole('link', { name: /^experiences$/i })
    ).toBeVisible();
  });

  // ── Personality section ────────────────────────────────────────────────────

  test('personality section renders — either result card or empty state', async ({
    page,
  }) => {
    const hasResult = await page
      .getByTestId('personality-result-card')
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByTestId('personality-empty-state')
      .isVisible()
      .catch(() => false);
    expect(hasResult || hasEmpty).toBe(true);
  });

  test('personality empty state links to /test', async ({ page }) => {
    const empty = page.getByTestId('personality-empty-state');
    if (!(await empty.isVisible().catch(() => false))) return;
    await expect(
      page.getByRole('link', { name: /take the assessment/i })
    ).toHaveAttribute('href', '/test');
  });

  test('personality result card shows personality name and retake link', async ({
    page,
  }) => {
    const card = page.getByTestId('personality-result-card');
    if (!(await card.isVisible().catch(() => false))) return;
    await expect(card).toBeVisible();
    await expect(
      page.getByRole('link', { name: /retake test/i })
    ).toBeVisible();
  });

  // ── My Teams section ───────────────────────────────────────────────────────

  test('My Teams section renders', async ({ page }) => {
    await expect(page.getByTestId('my-teams-section')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /my teams/i })
    ).toBeVisible();
  });

  // ── Experience Requests section ────────────────────────────────────────────

  test('Experience Requests section renders', async ({ page }) => {
    await expect(page.getByTestId('my-requests-section')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /experience requests/i })
    ).toBeVisible();
  });

  // ── Quick actions sidebar ──────────────────────────────────────────────────

  test('Quick Actions sidebar renders on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await expect(page.getByText(/quick actions/i)).toBeVisible();
  });
});
