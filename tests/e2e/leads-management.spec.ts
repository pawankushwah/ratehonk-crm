import { test, expect } from '@playwright/test';

test.describe('Leads Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to leads page
    await page.goto('/');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Navigate to leads page
    await page.click('a[href*="/leads"], text=Leads');
    await expect(page).toHaveURL(/\/leads/);
  });

  test('should display leads list', async ({ page }) => {
    // Check for leads table/list
    await expect(page.locator('text=Lead Pipeline, text=Leads')).toBeVisible();
    
    // Should show table headers or lead cards
    const tableHeaders = page.locator('th, .table-header, [data-testid*="header"]');
    const leadCards = page.locator('.lead-card, [data-testid*="lead"]');
    
    // Either table headers or lead cards should be visible
    await expect(async () => {
      const headerCount = await tableHeaders.count();
      const cardCount = await leadCards.count();
      expect(headerCount + cardCount).toBeGreaterThan(0);
    }).toPass();
  });

  test('should open create lead form', async ({ page }) => {
    // Look for create/add button
    const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New Lead"), [data-testid*="create"], [data-testid*="add"]');
    await createButton.first().click();
    
    // Should show form or modal
    await expect(page.locator('input[placeholder*="First Name"], input[name*="firstName"], input[placeholder*="Name"]')).toBeVisible();
    await expect(page.locator('input[type="email"], input[placeholder*="Email"]')).toBeVisible();
  });

  test('should create a new lead', async ({ page }) => {
    // Open create form
    const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New Lead"), [data-testid*="create"]');
    await createButton.first().click();
    
    // Fill out form
    await page.fill('input[placeholder*="First Name"], input[name*="firstName"]', 'Test');
    await page.fill('input[placeholder*="Last Name"], input[name*="lastName"]', 'Lead');
    await page.fill('input[type="email"], input[placeholder*="Email"]', 'testlead@example.com');
    await page.fill('input[placeholder*="Phone"], input[name*="phone"]', '+1-555-TEST');
    
    // Select source if dropdown exists
    const sourceSelect = page.locator('select[name*="source"], [data-testid*="source"]');
    if (await sourceSelect.count() > 0) {
      await sourceSelect.selectOption('website');
    }
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    
    // Should see success message or return to list
    await expect(page.locator('text=Test Lead, text=testlead@example.com')).toBeVisible({ timeout: 5000 });
  });

  test('should search/filter leads', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], [data-testid*="search"]');
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000); // Wait for search results
      
      // Results should update
      const resultsContainer = page.locator('.leads-list, .table-body, [data-testid*="leads"]');
      await expect(resultsContainer).toBeVisible();
    }
  });

  test('should edit an existing lead', async ({ page }) => {
    // Wait for leads to load
    await page.waitForTimeout(2000);
    
    // Find first edit button
    const editButton = page.locator('button:has-text("Edit"), [data-testid*="edit"], .edit-button').first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Should show edit form
      await expect(page.locator('input[type="email"], input[placeholder*="Email"]')).toBeVisible();
      
      // Make a change
      await page.fill('input[placeholder*="Phone"], input[name*="phone"]', '+1-555-UPDATED');
      
      // Save changes
      await page.click('button:has-text("Save"), button:has-text("Update"), button[type="submit"]');
      
      // Should see updated data
      await expect(page.locator('text=+1-555-UPDATED')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should convert lead to customer', async ({ page }) => {
    // Wait for leads to load
    await page.waitForTimeout(2000);
    
    // Look for convert button
    const convertButton = page.locator('button:has-text("Convert"), [data-testid*="convert"]').first();
    
    if (await convertButton.count() > 0) {
      await convertButton.click();
      
      // Should show confirmation or conversion form
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Convert")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
      
      // Should see success message
      await expect(page.locator('text=converted, text=customer')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle pagination', async ({ page }) => {
    // Look for pagination controls
    const paginationNext = page.locator('button:has-text("Next"), .pagination-next, [data-testid*="next"]');
    const paginationPrev = page.locator('button:has-text("Previous"), .pagination-prev, [data-testid*="prev"]');
    
    if (await paginationNext.count() > 0) {
      // Check if next button is enabled
      const isEnabled = await paginationNext.isEnabled();
      if (isEnabled) {
        await paginationNext.click();
        await page.waitForTimeout(1000);
        
        // Should show different leads
        await expect(page.locator('.leads-list, .table-body')).toBeVisible();
      }
    }
  });
});