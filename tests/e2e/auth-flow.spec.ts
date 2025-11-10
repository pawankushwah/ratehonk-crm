import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/TravelCRM|Login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Should show dashboard content
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill login form with wrong credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid')).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login|\/$/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Find and click logout button (might be in a dropdown or menu)
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]');
    await logoutButton.first().click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login|\/$/);
  });

  test('should redirect unauthorized users to login', async ({ page }) => {
    // Try to access protected route directly
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login|\/$/);
  });
});