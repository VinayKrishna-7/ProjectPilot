import { Page } from '@playwright/test';

export async function loginAsDemoUser(page: Page) {
  await page.goto('/login');
  const emailInput = page.getByLabel(/Email address/i);
  try {
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill('demo@projectpilot.dev');
    await page.getByLabel(/Password/i).fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  } catch {
    // Already logged in or navigated away
  }
}
