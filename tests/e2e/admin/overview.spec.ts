import { test, expect } from '@playwright/test';

test.describe('Admin Overview page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('page loads and displays a heading', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin/);
    // The overview page should have a visible heading or page title.
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('overview analytics sections are visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Request status distribution' })
    ).toBeVisible();
    await expect(
      page.getByText('Total Requests', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Users and teams over the last 6 months',
      })
    ).toBeVisible();
    await expect(page.getByText('Total Users', { exact: true })).toBeVisible();
    await expect(page.getByText('Total Teams', { exact: true })).toBeVisible();
  });

  test('Personalities preview section renders cards', async ({ page }) => {
    const section = page
      .getByRole('heading', { name: /personalit/i })
      .locator('xpath=ancestor::section[1]');

    await expect(section).toBeVisible();
    const editButtons = section.getByRole('button', { name: /^edit$/i });
    if ((await editButtons.count()) > 0) {
      await expect(editButtons.first()).toBeVisible();
      return;
    }

    await expect(
      section.getByRole('link', { name: /view all/i })
    ).toBeVisible();
  });

  test('Questions preview section renders question cards', async ({ page }) => {
    const section = page
      .getByRole('heading', { name: /questions/i })
      .locator('xpath=ancestor::section[1]');

    await expect(section).toBeVisible();
    const cards = section.locator('a[href^="/admin/questions?id="]');
    if ((await cards.count()) > 0) {
      await expect(cards.first()).toBeVisible();
      return;
    }

    await expect(section.getByText(/no questions yet/i)).toBeVisible();
  });

  test('"View all" link in Questions section navigates to /admin/questions', async ({
    page,
  }) => {
    const questionsSection = page
      .getByRole('heading', { name: /questions/i })
      .locator('xpath=ancestor::section[1]');
    const link = questionsSection.getByRole('link', { name: /view all/i });

    await expect(link).toHaveAttribute('href', '/admin/questions');
    await Promise.all([
      page.waitForURL(url => /^\/admin\/questions\/?$/.test(url.pathname)),
      link.click(),
    ]);
    const url = new URL(page.url());
    expect(url.pathname).toMatch(/^\/admin\/questions\/?$/);
  });

  test('clicking a question preview card navigates with ?id= param', async ({
    page,
  }) => {
    const cards = page.locator('a[href^="/admin/questions?id="]');
    if ((await cards.count()) === 0) {
      await expect(page.getByText(/no questions yet/i)).toBeVisible();
      return;
    }
    const card = cards.first();
    await expect(card).toBeVisible();

    const href = await card.getAttribute('href');
    expect(href).toMatch(/^\/admin\/questions\?id=\d+$/);

    await Promise.all([
      page.waitForURL(
        url =>
          /^\/admin\/questions\/?$/.test(url.pathname) &&
          /^\d+$/.test(url.searchParams.get('id') ?? '')
      ),
      card.click(),
    ]);

    const url = new URL(page.url());
    expect(url.pathname).toMatch(/^\/admin\/questions\/?$/);
    expect(url.searchParams.get('id')).toMatch(/^\d+$/);
  });
});
