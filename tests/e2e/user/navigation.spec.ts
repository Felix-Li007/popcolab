import { test, expect } from '@playwright/test';
import { signInAsUser, needsUserCreds, SKIP_REASON } from './helpers';

test.describe.serial('User dashboard — sidenav navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(needsUserCreds(), SKIP_REASON);
    await signInAsUser(page);
    await page.goto('/dashboard');
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  // ── Sidenav link destinations ──────────────────────────────────────────────

  test('Overview link points to /dashboard', async ({ page }) => {
    const nav = page.getByTestId('dashboard-sidenav');
    await expect(
      nav.getByRole('link', { name: /^overview$/i })
    ).toHaveAttribute('href', '/dashboard');
  });

  test('Personality link points to /dashboard/personality', async ({
    page,
  }) => {
    const nav = page.getByTestId('dashboard-sidenav');
    await expect(
      nav.getByRole('link', { name: /^personality$/i })
    ).toHaveAttribute('href', '/dashboard/personality');
  });

  test('My Teams link points to /dashboard/teams', async ({ page }) => {
    const nav = page.getByTestId('dashboard-sidenav');
    await expect(
      nav.getByRole('link', { name: /^my teams$/i })
    ).toHaveAttribute('href', '/dashboard/teams');
  });

  test('Requests link points to /dashboard/requests', async ({ page }) => {
    const nav = page.getByTestId('dashboard-sidenav');
    await expect(
      nav.getByRole('link', { name: /^requests$/i })
    ).toHaveAttribute('href', '/dashboard/requests');
  });

  test('Experiences link points to /dashboard/experiences', async ({
    page,
  }) => {
    const nav = page.getByTestId('dashboard-sidenav');
    await expect(
      nav.getByRole('link', { name: /^experiences$/i })
    ).toHaveAttribute('href', '/dashboard/experiences');
  });

  // ── Navigation works ───────────────────────────────────────────────────────

  test('clicking Personality navigates to /dashboard/personality', async ({
    page,
  }) => {
    await page
      .getByTestId('dashboard-sidenav')
      .getByRole('link', { name: /^personality$/i })
      .click();
    await expect(page).toHaveURL(/\/dashboard\/personality/);
    await expect(
      page.getByRole('heading', { name: /^play personality$/i })
    ).toBeVisible();
  });

  test('clicking My Teams navigates to /dashboard/teams', async ({ page }) => {
    await page
      .getByTestId('dashboard-sidenav')
      .getByRole('link', { name: /^my teams$/i })
      .click();
    await expect(page).toHaveURL(/\/dashboard\/teams/);
    await expect(
      page.getByRole('heading', { name: /my teams/i })
    ).toBeVisible();
  });

  test('clicking Requests navigates to /dashboard/requests', async ({
    page,
  }) => {
    await page
      .getByTestId('dashboard-sidenav')
      .getByRole('link', { name: /^requests$/i })
      .click();
    await expect(page).toHaveURL(/\/dashboard\/requests/);
    await expect(
      page.getByRole('heading', { name: /experience requests/i })
    ).toBeVisible();
  });

  test('clicking Experiences navigates to /dashboard/experiences', async ({
    page,
  }) => {
    await page
      .getByTestId('dashboard-sidenav')
      .getByRole('link', { name: /^experiences$/i })
      .click();
    await expect(page).toHaveURL(/\/dashboard\/experiences/);
    await expect(
      page.getByRole('heading', { name: /experiences/i })
    ).toBeVisible();
  });

  // ── Active state ───────────────────────────────────────────────────────────

  test('Overview link is highlighted as active on /dashboard', async ({
    page,
  }) => {
    const overviewLink = page
      .getByTestId('dashboard-sidenav')
      .getByRole('link', { name: /^overview$/i });
    await expect(overviewLink).toHaveClass(/bg-white\/15/);
  });

  test('Personality link is highlighted as active on /dashboard/personality', async ({
    page,
  }) => {
    await page.goto('/dashboard/personality');
    const personalityLink = page
      .getByTestId('dashboard-sidenav')
      .getByRole('link', { name: /^personality$/i });
    await expect(personalityLink).toHaveClass(/bg-white\/15/);
  });
});
