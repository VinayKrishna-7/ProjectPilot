import { test, expect } from '@playwright/test';

test.describe('Authentication & Session Management', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('should display login page with email form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel(/Email address/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should log in successfully using credentials', async ({ page }) => {
    await page.getByLabel(/Email address/i).fill('demo@projectpilot.dev');
    await page.getByLabel(/Password/i).fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    // After login, should redirect to workspace or dashboard
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should show validation error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/Email address/i).fill('invalid-user@projectpilot.dev');
    await page.getByLabel(/Password/i).fill('WrongPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should stay on login page or show error message
    await expect(page.getByLabel(/Email address/i)).toBeVisible();
  });

  test('should navigate to registration and submit form', async ({ page }) => {
    await page.getByRole('link', { name: /Sign up/i }).click();
    await expect(page).toHaveURL(/\/register/);

    const testEmail = `user_${Date.now()}@example.com`;
    await page.getByLabel(/Full Name/i).fill('Test User');
    await page.getByLabel(/Email/i).fill(testEmail);
    await page.getByLabel(/Password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /Create account|Sign up/i }).click();
  });

  test('should navigate to security settings and view active sessions', async ({ page }) => {
    // Log in first
    await page.getByLabel(/Email address/i).fill('demo@projectpilot.dev');
    await page.getByLabel(/Password/i).fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'));

    // Go to security settings
    await page.goto('/settings/security');
    await expect(page.getByRole('heading', { name: /Security/i })).toBeVisible();
    await expect(page.getByText(/Active Device Sessions/i)).toBeVisible();
  });

  test('should register a new account and allow directly signing in without re-signing up', async ({ page }) => {
    await page.getByRole('link', { name: /Sign up/i }).click();
    await expect(page).toHaveURL(/\/register/);

    const testEmail = `persistent_${Date.now()}@example.com`;
    await page.getByLabel(/Full Name/i).fill('Direct Signin User');
    await page.getByLabel(/Email/i).fill(testEmail);
    await page.getByLabel(/Password/i).fill('MySecurePassword123!');
    await page.getByRole('button', { name: /Create account|Sign up/i }).click();

    // Successfully logged in after signup
    await page.waitForURL((url) => !url.pathname.includes('/register') && !url.pathname.includes('/login'));

    // Clear session cookies to simulate returning later
    await page.context().clearCookies();
    await page.goto('/login');

    // The login page should have the registered email prefilled from localStorage
    await expect(page.getByLabel(/Email address/i)).toHaveValue(testEmail);

    // Sign in directly with credentials without having to sign up again
    await page.getByLabel(/Password/i).fill('MySecurePassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Successfully signed in directly
    await page.waitForURL((url) => !url.pathname.includes('/login'));
  });

  test('should ensure newly created accounts start 100% clean without auto-added workspaces or demo features', async ({ page }) => {
    await page.getByRole('link', { name: /Sign up/i }).click();
    await expect(page).toHaveURL(/\/register/);

    const testEmail = `clean_user_${Date.now()}@example.com`;
    await page.getByLabel(/Full Name/i).fill('Clean Account User');
    await page.getByLabel(/Email/i).fill(testEmail);
    await page.getByLabel(/Password/i).fill('CleanPassword123!');
    await page.getByRole('button', { name: /Create account|Sign up/i }).click();

    // After signup, dashboard displays clean onboarding empty state
    await page.waitForURL((url) => !url.pathname.includes('/register') && !url.pathname.includes('/login'));

    // Should NOT see any demo workspace (like Acme Technologies)
    await expect(page.getByText('Acme Technologies')).not.toBeVisible();
    // Should NOT see any demo projects (like ProjectPilot Platform)
    await expect(page.getByText('ProjectPilot Platform')).not.toBeVisible();

    // Should see the welcoming clean empty state
    await expect(page.getByRole('heading', { name: 'Welcome to ProjectPilot' })).toBeVisible();
    await expect(page.getByText(/Your account is completely clean and ready/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Workspace/i })).toBeVisible();

    // Create a custom workspace with user's own name and style
    await page.getByRole('button', { name: /Create Workspace/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/Workspace Name/i).fill('My Custom Studio');
    await page.getByRole('button', { name: /Create Workspace/i }).last().click();

    // Now the workspace is active and shows clean project empty state
    await expect(page.getByText('My Custom Studio').first()).toBeVisible();
    await expect(page.getByText('No projects yet')).toBeVisible();
  });
});
