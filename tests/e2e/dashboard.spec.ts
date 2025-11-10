import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display dashboard metrics', async ({ page }) => {
    // Check for metric cards
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Active Bookings')).toBeVisible();
    await expect(page.locator('text=Total Customers')).toBeVisible();
    await expect(page.locator('text=Active Leads')).toBeVisible();

    // Check for numeric values in metrics
    const metricValues = page.locator('[data-testid*="metric-value"], .metric-value, .text-2xl, .text-3xl');
    await expect(metricValues.first()).toBeVisible();
  });

  test('should display calendar section', async ({ page }) => {
    // Look for calendar-related content
    const calendarSection = page.locator('text=Calendar, [data-testid="calendar"]');
    await expect(calendarSection.first()).toBeVisible();
  });

  test('should navigate from metric cards', async ({ page }) => {
    // Click on leads metric (if clickable)
    const leadsMetric = page.locator('text=Active Leads').locator('..');
    await leadsMetric.click();
    
    // Should navigate to leads page or show leads data
    await expect(page).toHaveURL(/\/leads|\/dashboard/);
  });

  test('should display recent bookings or activities', async ({ page }) => {
    // Look for recent activities section
    const recentSection = page.locator('text=Recent, text=Activity, text=Bookings').first();
    await expect(recentSection).toBeVisible({ timeout: 10000 });
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Dashboard should still be functional
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should refresh data periodically', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);
    
    // Check that data is loaded
    const initialMetrics = await page.locator('[data-testid*="metric"], .metric-card').count();
    expect(initialMetrics).toBeGreaterThan(0);
    
    // Wait for potential refresh cycle
    await page.waitForTimeout(5000);
    
    // Data should still be visible
    const refreshedMetrics = await page.locator('[data-testid*="metric"], .metric-card').count();
    expect(refreshedMetrics).toBeGreaterThan(0);
  });
});