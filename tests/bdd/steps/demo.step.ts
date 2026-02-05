import { Given, Then, After, Before } from "@cucumber/cucumber";
import { chromium, Browser, Page } from "@playwright/test";
import { expect } from "@playwright/test";

let browser: Browser;
let page: Page;

Before(async () => {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();
});

After(async () => {
    await browser.close();
});

Given("I open the home page", async () => {
    await page.goto("http://www.google.ca");
});

Then("I should see {string}", async (text: string) => {
    await expect(page.getByRole("button", { name: text })).toBeVisible();
});
