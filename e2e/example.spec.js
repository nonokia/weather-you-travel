import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/weather-you-travel/);
});

test('shows header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Weather You Travel');
});
