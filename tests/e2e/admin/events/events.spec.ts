import { expect, test, type Page, type TestInfo } from '@playwright/test';

function makeUniqueEventTitle(testInfo: TestInfo): string {
  return `E2E Event ${testInfo.project.name}-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function searchForEvent(page: Page, value: string) {
  const searchInput = page.getByPlaceholder('Search title or address...');
  await expect(searchInput).toBeVisible();
  await searchInput.click();
  await searchInput.fill(value);
  await page.getByRole('button', { name: /^search$/i }).click();
}

test.describe('Events page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/events');
  });

  test('create, view, edit, and delete flow works end-to-end', async ({
    page,
  }, testInfo) => {
    const eventTitle = makeUniqueEventTitle(testInfo);
    const updatedTitle = `${eventTitle} Updated`;
    const location = 'E2E Winnipeg Studio';
    const updatedLocation = 'E2E Winnipeg HQ';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowValue = formatDateInputValue(tomorrow);

    await expect(
      page.getByRole('button', { name: /new event/i })
    ).toBeVisible();

    await page.getByRole('button', { name: /new event/i }).click();
    await expect(page).toHaveURL(/\/admin\/events\/create$/);
    await expect(
      page.getByRole('heading', { name: /create event/i })
    ).toBeVisible();

    await page.locator('#eventTitle').fill(eventTitle);
    await page.locator('#eventLocation').fill(location);
    await page
      .locator('#eventNotes')
      .fill('E2E notes for the event management flow.');
    await page.locator('#capacity_max').fill('24');
    await page.locator('#eventStatus').selectOption('ACTIVE');

    await page.getByRole('button', { name: /^about$/i }).click();
    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    await editor.fill('E2E description for the created event.');

    await page.getByRole('button', { name: /^time$/i }).click();
    await page.getByLabel('Event date').fill(tomorrowValue);
    await page.getByLabel('Start time').first().fill('09:00');
    await page.getByLabel('End time').first().fill('11:30');
    await page.getByRole('button', { name: /^create event$/i }).click();

    await expect(page).toHaveURL(/\/admin\/events\/\d+$/);
    await expect(page.locator('#eventTitleView')).toHaveValue(eventTitle);
    await expect(page.locator('#eventLocationView')).toHaveValue(location);

    await page.getByRole('button', { name: /^back to events$/i }).click();
    await expect(page).toHaveURL(/\/admin\/events$/);

    await searchForEvent(page, eventTitle);

    const createdCard = page
      .getByTestId('event-card')
      .filter({ hasText: eventTitle })
      .first();
    await expect(createdCard).toBeVisible();
    await expect(createdCard.getByText(/upcoming/i).first()).toBeVisible();
    await expect(createdCard.getByText(location)).toBeVisible();

    await createdCard.getByRole('button', { name: /^view$/i }).click();
    await expect(page).toHaveURL(/\/admin\/events\/\d+$/);
    await expect(page.locator('#eventTitleView')).toHaveValue(eventTitle);
    await expect(page.locator('#eventLocationView')).toHaveValue(location);

    await page.getByRole('button', { name: /^edit event$/i }).click();
    await expect(page).toHaveURL(/\/admin\/events\/\d+\/edit$/);
    await expect(
      page.getByRole('heading', { name: /edit event/i })
    ).toBeVisible();

    await page.locator('#eventTitle').fill(updatedTitle);
    await page.locator('#eventLocation').fill(updatedLocation);
    await page.getByRole('button', { name: /^save changes$/i }).click();
    await expect(page).toHaveURL(/\/admin\/events\/\d+$/);

    await page.getByRole('button', { name: /^back to events$/i }).click();
    await expect(page).toHaveURL(/\/admin\/events$/);

    await searchForEvent(page, updatedTitle);

    const updatedCard = page
      .getByTestId('event-card')
      .filter({ hasText: updatedTitle })
      .first();
    await expect(updatedCard).toBeVisible();
    await expect(updatedCard.getByText(updatedLocation)).toBeVisible();

    let deleteDialogMessage = '';
    page.once('dialog', async dialog => {
      deleteDialogMessage = dialog.message();
      await dialog.accept();
    });

    await updatedCard.getByRole('button', { name: /^delete$/i }).click();
    await expect
      .poll(() => deleteDialogMessage, { timeout: 8000 })
      .toContain('Are you sure you want to delete this event?');

    await searchForEvent(page, updatedTitle);
    await expect(
      page.getByTestId('event-card').filter({ hasText: updatedTitle }).first()
    ).toHaveCount(0);
  });
});
