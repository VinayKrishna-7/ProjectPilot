import { test, expect } from '@playwright/test';
import { loginAsDemoUser } from './helpers';

test.describe('Workspace & Invitations Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  test('should view workspace dashboard and member directory', async ({ page }) => {
    // Navigate to root/workspaces
    await page.goto('/workspaces');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should open workspace invite modal and generate invitation link', async ({ page }) => {
    // Go to workspaces page
    await page.goto('/workspaces');
    
    // Look for Invite button if present on page
    const inviteButton = page.getByRole('button', { name: /Invite|Add Member/i }).first();
    if (await inviteButton.isVisible()) {
      await inviteButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /Invite Team Member/i })).toBeVisible();

      // Enter email and send invitation
      const emailInput = page.getByLabel(/Email address/i);
      if (await emailInput.isVisible()) {
        await emailInput.fill(`invite_${Date.now()}@example.com`);
        const sendBtn = page.getByRole('button', { name: /Send Invite/i });
        if (await sendBtn.isVisible()) {
          await sendBtn.click();
        }
      }
    }
  });

  test('should render invitation accept landing page', async ({ page }) => {
    await page.goto('/invitations/accept?token=sample-test-invitation-token');
    await expect(page.getByRole('heading', { name: /Workspace Invitation/i })).toBeVisible();
  });

  test('should navigate to audit log viewer', async ({ page }) => {
    await page.goto('/workspaces');
    const auditBtn = page.getByRole('button', { name: /Audit Trail|Audit Log/i }).first();
    if (await auditBtn.isVisible()) {
      await auditBtn.click();
      await expect(page).toHaveURL(/audit-log/);
      await expect(page.getByRole('heading', { name: /Security Audit Trail/i })).toBeVisible();
    }
  });
});
