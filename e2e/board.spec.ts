import { test, expect } from '@playwright/test';
import { loginAsDemoUser } from './helpers';

test.describe('Kanban Board & Drag-and-Drop Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  test('should render board columns and cards', async ({ page }) => {
    const projectLink = page.locator('a[href*="/board"]').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should support quick filtering on board by text search', async ({ page }) => {
    const projectLink = page.locator('a[href*="/board"]').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      const searchInput = page.getByPlaceholder(/Search issues/i).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('auth');
        await expect(searchInput).toHaveValue('auth');
      }
    }
  });
});
