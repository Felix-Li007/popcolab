import { expect, test, type Page } from '@playwright/test';

async function hasUserCards(page: Page) {
  return (await page.getByTestId('user-card').count()) > 0;
}

test.describe('Users page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users');
  });

  test('page loads with core controls', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByTestId('user-search')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Search$/i })).toBeVisible();
    await expect(page.getByTestId('user-status-tab-all')).toBeVisible();
    await expect(page.getByTestId('user-status-tab-active')).toBeVisible();
    await expect(page.getByTestId('user-status-tab-inactive')).toBeVisible();
    await expect(page.getByTestId('user-status-tab-blocked')).toBeVisible();

    await expect(
      page.getByTestId('user-card').first().or(page.getByTestId('user-empty'))
    ).toBeVisible();
  });

  test('search with no match shows empty state', async ({ page }) => {
    const searchTerm = 'zz_user_no_match_2026';
    const searchInput = page.getByTestId('user-search');
    await expect(searchInput).toBeVisible();

    await searchInput.fill(searchTerm);
    await Promise.all([
      page.waitForURL(
        url =>
          /^\/admin\/users\/?$/.test(url.pathname) &&
          url.searchParams.get('q') === searchTerm
      ),
      page.getByRole('button', { name: /^Search$/i }).click(),
    ]);
    const url = new URL(page.url());
    expect(url.searchParams.get('q')).toBe(searchTerm);

    await expect(page.getByTestId('user-empty')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: /^Clear$/i })).toBeVisible();
  });

  test('status tabs navigate with expected query params', async ({ page }) => {
    await Promise.all([
      page.waitForURL(
        url =>
          /^\/admin\/users\/?$/.test(url.pathname) &&
          url.searchParams.get('status') === 'blocked'
      ),
      page.getByTestId('user-status-tab-blocked').click(),
    ]);
    const blockedUrl = new URL(page.url());
    expect(blockedUrl.pathname).toMatch(/^\/admin\/users\/?$/);
    expect(blockedUrl.searchParams.get('status')).toBe('blocked');

    await Promise.all([
      page.waitForURL(
        url =>
          /^\/admin\/users\/?$/.test(url.pathname) &&
          !url.searchParams.has('status')
      ),
      page.getByTestId('user-status-tab-all').click(),
    ]);
    const allUrl = new URL(page.url());
    expect(allUrl.pathname).toMatch(/^\/admin\/users\/?$/);
    expect(allUrl.searchParams.has('status')).toBeFalsy();
  });

  test('view action opens detail modal', async ({ page }) => {
    if (!(await hasUserCards(page))) {
      await expect(page.getByTestId('user-empty')).toBeVisible();
      return;
    }

    const firstCard = page.getByTestId('user-card').first();
    await firstCard.getByTestId('user-card-view').click();

    await expect(page.getByTestId('user-detail-modal')).toBeVisible();
    await expect(page.getByText('Corporate', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Privacy Notes', { exact: true })
    ).toBeVisible();

    await page.getByRole('button', { name: /^Close$/i }).click();
    await expect(page.getByTestId('user-detail-modal')).toHaveCount(0);
  });

  test('edit action opens editable form and validates required username', async ({
    page,
  }) => {
    if (!(await hasUserCards(page))) {
      await expect(page.getByTestId('user-empty')).toBeVisible();
      return;
    }

    const firstCard = page.getByTestId('user-card').first();
    await firstCard.getByTestId('user-card-edit').click();

    await expect(page.getByTestId('user-detail-modal')).toBeVisible();
    await expect(page.getByTestId('user-edit-form')).toBeVisible();
    await expect(page.getByLabel('User Name')).toBeVisible();
    await expect(page.getByLabel('Status')).toBeVisible();
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Company')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Save Changes$/i })
    ).toBeVisible();

    await expect(page.getByLabel(/^Email$/i)).toHaveCount(0);

    await page.getByLabel('User Name').fill('');
    await page.getByRole('button', { name: /^Save Changes$/i }).click();
    await expect(page.getByText('Username is required.')).toBeVisible();
  });

  test('pagination next/previous navigation works when multiple pages exist', async ({
    page,
  }) => {
    const nextControl = page.locator('[title="Next page"]');
    if ((await nextControl.count()) === 0) return;

    await Promise.all([
      page.waitForURL(
        url =>
          /^\/admin\/users\/?$/.test(url.pathname) &&
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
          /^\/admin\/users\/?$/.test(url.pathname) &&
          !url.searchParams.has('page')
      ),
      prevControl.click(),
    ]);
    const page1Url = new URL(page.url());
    expect(page1Url.pathname).toMatch(/^\/admin\/users\/?$/);
    expect(page1Url.searchParams.has('page')).toBeFalsy();
  });
});
