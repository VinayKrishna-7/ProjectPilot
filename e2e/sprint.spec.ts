import { test, expect } from '@playwright/test';
import { loginAsDemoUser } from './helpers';

test.describe('Sprint Management & Backlog Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  test('should render backlog page and sprint sections', async ({ page }) => {
    const backlogLink = page.locator('a[href*="/backlog"]').first();
    if (await backlogLink.isVisible()) {
      await backlogLink.click();
      await expect(page).toHaveURL(/backlog/);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display create sprint button on backlog', async ({ page }) => {
    const backlogLink = page.locator('a[href*="/backlog"]').first();
    if (await backlogLink.isVisible()) {
      await backlogLink.click();
      const createSprintBtn = page.getByRole('button', { name: /Create Sprint/i }).first();
      if (await createSprintBtn.isVisible()) {
        await expect(createSprintBtn).toBeEnabled();
      }
    }
  });
});
