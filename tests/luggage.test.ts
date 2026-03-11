/**
 * Luggage Management Feature Test Suite
 * 
 * NOTE: These tests require:
 * 1. Dev server running on localhost:3000
 * 2. User authentication (guest mode or logged in)
 * 3. Test database with sample data
 * 
 * Run: npm run test:luggage
 */

import { test, expect } from '@playwright/test'

// Skip auth for now - assumes guest mode or existing session
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Luggage Management - Basic Navigation', () => {
  test('should load luggage page', async ({ page }) => {
    await page.goto('/luggage')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check if we're on luggage page or redirected to login
    const url = page.url()
    
    if (url.includes('/login')) {
      console.log('⚠️  Test requires authentication. Enable guest mode or login.')
      test.skip()
    } else {
      await expect(page.getByText('My Luggage')).toBeVisible()
    }
  })

  test('should show add luggage button or empty state', async ({ page }) => {
    await page.goto('/luggage')
    await page.waitForLoadState('networkidle')
    
    if (page.url().includes('/login')) {
      test.skip()
    }
    
    // Either has luggage or shows empty state
    const hasAddButton = await page.getByRole('button', { name: /Add Luggage/i }).isVisible()
    const hasEmptyState = await page.getByText('No luggage yet').isVisible()
    
    // If the page is still loading, neither might be visible initially depending on hydration
    // Wait for at least one to be visible if neither is
    if (!hasAddButton && !hasEmptyState) {
        await Promise.any([
            page.waitForSelector('text="Add Luggage"'),
            page.waitForSelector('text="No luggage yet"')
        ]).catch(() => {});
    }

    const finalHasAddButton = await page.getByRole('button', { name: /Add Luggage/i }).isVisible()
    const finalHasEmptyState = await page.getByText('No luggage yet').isVisible()

    expect(finalHasAddButton || finalHasEmptyState).toBeTruthy()
  })
})

test.describe('Luggage Management - Create Flow', () => {
  test.skip('should create new luggage item', async ({ page }) => {
    // Skip by default - requires auth and clean database
    await page.goto('/luggage')
    
    // Click Add Luggage
    await page.getByRole('button', { name: '+ Add Luggage' }).click()
    
    // Fill form
    await page.getByPlaceholder('e.g., 20L Aer Pro Pack').fill('Test Backpack')
    await page.locator('select').first().selectOption('backpack')
    await page.getByPlaceholder('e.g., 20').fill('20')
    
    // Submit
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    
    // Verify
    await expect(page.getByText('Test Backpack')).toBeVisible()
  })
})

test.describe('Navigation - Inventory to Luggage', () => {
  test('should have luggage button on inventory page', async ({ page }) => {
    await page.goto('/inventory')
    await page.waitForLoadState('networkidle')
    
    if (page.url().includes('/login')) {
      test.skip()
    }
    
    // Check if luggage button exists
    const luggageButton = page.getByRole('link', { name: /Luggage/i })
    await expect(luggageButton).toBeVisible()
  })

  test('luggage button should navigate to /luggage', async ({ page }) => {
    await page.goto('/inventory')
    await page.waitForLoadState('networkidle')
    
    if (page.url().includes('/login')) {
      test.skip()
    }
    
    await page.getByRole('link', { name: /Luggage/i }).click()
    await expect(page).toHaveURL(/\/luggage/)
  })
})

test.describe('Manual Test Instructions', () => {
  test('print manual test checklist', async () => {
    console.log(`
    ✅ MANUAL TEST CHECKLIST - Luggage Feature
    
    Prerequisites:
    - Dev server running: npm run dev
    - Logged in or guest mode enabled
    
    Test 1: Create Luggage
    1. Go to /luggage
    2. Click "+ Add Luggage"
    3. Enter name: "20L Aer Pro Pack"
    4. Select type: "Backpack"
    5. Enter capacity: "20"
    6. Click "Add"
    7. ✓ Verify luggage card appears with 🎒 icon
    
    Test 2: Navigate from Inventory
    1. Go to /inventory
    2. Click "🧳 Luggage" button (top-right)
    3. ✓ Verify navigates to /luggage
    
    Test 3: Select Luggage for Trip
    1. Go to /dashboard
    2. Click on any trip
    3. Scroll to "Luggage for this trip" section
    4. Click on a luggage checkbox
    5. ✓ Verify checkbox turns blue
    
    Test 4: Assign Item to Bag
    1. On trip page, scroll to packing list
    2. Find dropdown next to any item
    3. Select a bag from dropdown
    4. ✓ Verify icon appears next to item
    
    Test 5: Delete Luggage
    1. Go to /luggage
    2. Click "Delete" on any luggage
    3. Confirm deletion
    4. ✓ Verify luggage removed
    `)
  })
})
