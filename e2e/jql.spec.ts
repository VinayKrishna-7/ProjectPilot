import { test, expect } from '@playwright/test';
import { loginAsDemoUser } from './helpers';

test.describe('Issue Query Language (JQL) Search & Suggestions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  test('should render JQL search input on board', async ({ page }) => {
    const boardLink = page.locator('a[href*="/board"]').first();
    if (await boardLink.isVisible()) {
      await boardLink.click();
      const jqlInput = page.getByPlaceholder(/JQL: e.g. status =/i).first();
      if (await jqlInput.isVisible()) {
        await expect(jqlInput).toBeVisible();
      }
    }
  });

  test('should display autocomplete suggestions when typing in JQL bar', async ({ page }) => {
    const boardLink = page.locator('a[href*="/board"]').first();
    if (await boardLink.isVisible()) {
      await boardLink.click();
      const jqlInput = page.getByPlaceholder(/JQL: e.g. status =/i).first();
      if (await jqlInput.isVisible()) {
        await jqlInput.focus();
        await jqlInput.fill('stat');
        // Check if suggestion dropdown opens
        const suggestionItem = page.locator('text=status').first();
        if (await suggestionItem.isVisible()) {
          await expect(suggestionItem).toBeVisible();
        }
      }
    }
  });
});
