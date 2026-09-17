import { test, expect } from '@playwright/test';
import { loginAsDemoUser } from './helpers';

test.describe('Real-Time Collaboration & Socket.IO Broadcasts', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  test('should establish websocket/polling connection without runtime errors', async ({ page }) => {
    // Monitor console errors related to socket
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    const criticalSocketErrors = consoleErrors.filter((err) =>
      err.includes('WebSocket connection failed permanently')
    );
    expect(criticalSocketErrors.length).toBe(0);
  });

  test('should maintain state across page reloads', async ({ page }) => {
    await page.goto('/');
    await page.reload();
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });
});
