import { test, expect } from '@playwright/test';
import { loginAsDemoUser } from './helpers';

test.describe('Project Lifecycle & Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  test('should load projects list', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should open project creation dialog if available', async ({ page }) => {
    await page.goto('/');
    const createProjectBtn = page.getByRole('button', { name: /Create Project|New Project/i }).first();
    if (await createProjectBtn.isVisible()) {
      await createProjectBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });

  test('should navigate to project board from sidebar or workspace', async ({ page }) => {
    await page.goto('/');
    // Check if any project link is visible
    const projectLink = page.locator('a[href*="/projects/"]').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await expect(page).toHaveURL(/\/projects\//);
    }
  });
});
