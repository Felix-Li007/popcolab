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
      page.getByRole('heading', { name: 'Experience library overview' })
    ).toBeVisible();
    await expect(
      page.getByText('Total Experiences', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText('New This Week', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Status Mix' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'New Experiences Trend' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Top Categories' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Request matching overview' })
    ).toBeVisible();
    await expect(
      page.getByText('Total Requests', { exact: true })
    ).toBeVisible();
    await expect(page.getByText('Match Rate', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Avg Time To Match', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Top Requested Categories' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Top Matched Experiences' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Question health overview' })
    ).toBeVisible();
    await expect(
      page.getByText('Mapped To Dimensions', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'By Form Usage' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'By Question Type' })
    ).toBeVisible();
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
});
