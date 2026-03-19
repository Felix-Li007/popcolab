import { test, expect, type Page } from '@playwright/test';
import { signInAsUser, needsUserCreds, SKIP_REASON } from './helpers';

async function savePersonalProfile(page: Page) {
  await page
    .getByRole('button', { name: /^save$/i })
    .first()
    .click();
  await expect(page.getByText(/profile saved successfully\./i)).toBeVisible();
}

async function saveCompanyProfile(page: Page) {
  await page
    .getByRole('button', { name: /^save$/i })
    .nth(1)
    .click();
  await expect(page.getByText(/company information saved\./i)).toBeVisible();
}

test.describe.serial('User dashboard — profile page', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(needsUserCreds(), SKIP_REASON);
    await signInAsUser(page);
    await page.goto('/dashboard/profile');
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('profile page loads with personal and company sections', async ({
    page,
  }) => {
    await expect(page).toHaveURL(/\/dashboard\/profile/);
    await expect(
      page.getByRole('heading', { name: /my profile/i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /personal information/i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /company information/i })
    ).toBeVisible();
  });

  test('email address is read-only on the profile form', async ({ page }) => {
    await expect(page.getByLabel(/email address/i)).toHaveAttribute(
      'readonly',
      ''
    );
  });

  test('personal profile changes persist after saving and refresh', async ({
    page,
  }) => {
    const shortBioInput = page.getByLabel(/short bio/i);
    const consentCheckbox = page.getByRole('checkbox', {
      name: /consent given/i,
    });

    const originalShortBio = await shortBioInput.inputValue();
    const originalConsent = await consentCheckbox.isChecked();
    const nextShortBio = `Profile e2e ${Date.now()}`;

    try {
      await shortBioInput.fill(nextShortBio);
      if (originalConsent === false) {
        await consentCheckbox.click();
      }

      await savePersonalProfile(page);
      await page.reload();

      await expect(shortBioInput).toHaveValue(nextShortBio);
      await expect(consentCheckbox).toBeChecked();
    } finally {
      await shortBioInput.fill(originalShortBio);
      if ((await consentCheckbox.isChecked()) !== originalConsent) {
        await consentCheckbox.click();
      }
      await savePersonalProfile(page);
    }
  });

  test('company profile changes persist after saving and refresh', async ({
    page,
  }) => {
    const companyWebsiteInput = page.getByLabel(/company website/i);
    const originalWebsite = await companyWebsiteInput.inputValue();
    const nextWebsite = `https://example.com/profile-e2e-${Date.now()}`;

    try {
      await companyWebsiteInput.fill(nextWebsite);
      await saveCompanyProfile(page);
      await page.reload();

      await expect(companyWebsiteInput).toHaveValue(nextWebsite);
    } finally {
      await companyWebsiteInput.fill(originalWebsite);
      await saveCompanyProfile(page);
    }
  });
});
