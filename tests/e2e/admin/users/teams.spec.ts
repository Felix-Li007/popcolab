import { expect, test, type Page } from '@playwright/test';

async function hasTeamCards(page: Page) {
  return (await page.getByTestId('team-card').count()) > 0;
}

test.describe('Teams page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users/teams');
  });

  test('page loads with core controls', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/users\/teams/);
    await expect(page.getByTestId('team-search')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Search$/i })).toBeVisible();

    await expect(
      page.getByTestId('team-card').first().or(page.getByTestId('team-empty'))
    ).toBeVisible();
  });

  test('search with no match shows empty state', async ({ page }) => {
    const searchTerm = 'zz_team_no_match_2026';
    const searchInput = page.getByTestId('team-search');
    await expect(searchInput).toBeVisible();

    await searchInput.fill(searchTerm);
    await Promise.all([
      page.waitForURL(
        url =>
          /^\/admin\/users\/teams\/?$/.test(url.pathname) &&
          url.searchParams.get('q') === searchTerm
      ),
      page.getByRole('button', { name: /^Search$/i }).click(),
    ]);

    const url = new URL(page.url());
    expect(url.searchParams.get('q')).toBe(searchTerm);
    await expect(page.getByTestId('team-empty')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: /^Clear$/i })).toBeVisible();
  });

  test('view action opens team modal and supports in-modal filtering', async ({
    page,
  }) => {
    if (!(await hasTeamCards(page))) {
      await expect(page.getByTestId('team-empty')).toBeVisible();
      return;
    }

    const firstCard = page.getByTestId('team-card').first();
    await firstCard.getByTestId('team-card-view').first().click();

    const modal = page.getByTestId('team-detail-modal');
    await expect(modal).toBeVisible();
    const memberSearch = page.getByTestId('team-member-search');
    await expect(memberSearch).toBeVisible();

    await memberSearch.fill('zz_member_no_match_2026');
    await expect(
      page
        .getByText('No matched team members found')
        .or(page.getByText('No team members found'))
    ).toBeVisible();

    await page.getByRole('button', { name: /^Close$/i }).click();
    await expect(page.getByTestId('team-detail-modal')).toHaveCount(0);
  });

  test('pagination next/previous navigation works when multiple pages exist', async ({
    page,
  }) => {
    const nextControl = page.locator('[title="Next page"]');
    if ((await nextControl.count()) === 0) return;

    await Promise.all([
      page.waitForURL(
        url =>
          /^\/admin\/users\/teams\/?$/.test(url.pathname) &&
          url.searchParams.get('page') === '2'
      ),
      nextControl.click(),
    ]);

    const page2Url = new URL(page.url());
    expect(page2Url.searchParams.get('page')).toBe('2');

    const prevControl = page.locator('[title="Previous page"]');
    await expect(prevControl).toBeVisible();
    await Promise.all([
      page.waitForURL(
        url =>
          /^\/admin\/users\/teams\/?$/.test(url.pathname) &&
          !url.searchParams.has('page')
      ),
      prevControl.click(),
    ]);

    const page1Url = new URL(page.url());
    expect(page1Url.pathname).toMatch(/^\/admin\/users\/teams\/?$/);
    expect(page1Url.searchParams.has('page')).toBeFalsy();
  });
});

test.describe('Users to teams navigation', () => {
  test('clicking teams count in user card navigates to teams page with owner email filter', async ({
    page,
  }) => {
    await page.goto('/admin/users');

    const teamLinks = page.getByTestId('user-card-teams-link');
    if ((await teamLinks.count()) === 0) {
      await expect(page.getByTestId('user-empty')).toBeVisible();
      return;
    }

    const href = await teamLinks.first().getAttribute('href');
    expect(href).toMatch(/^\/admin\/users\/teams\?q=.+/);

    await Promise.all([
      page.waitForURL(
        url =>
          /^\/admin\/users\/teams\/?$/.test(url.pathname) &&
          (url.searchParams.get('q') ?? '').length > 0
      ),
      teamLinks.first().click(),
    ]);

    await expect(page.getByTestId('team-search')).toBeVisible();
    const url = new URL(page.url());
    expect(url.pathname).toMatch(/^\/admin\/users\/teams\/?$/);
    expect((url.searchParams.get('q') ?? '').length).toBeGreaterThan(0);
  });
});
