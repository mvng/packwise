/**
 * Luggage Management Feature Test Suite
 * 
 * Tests the complete luggage workflow:
 * 1. Create luggage items
 * 2. Select luggage for trips
 * 3. Assign packing items to luggage
 */

import { test, expect } from '@playwright/test'

test.describe('Luggage Management', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is logged in
    await page.goto('/luggage')
  })

  test('should display luggage page', async ({ page }) => {
    await expect(page).toHaveURL('/luggage')
    await expect(page.getByRole('heading', { name: 'My Luggage' })).toBeVisible()
  })

  test('should create new luggage item', async ({ page }) => {
    // Click Add Luggage button
    await page.getByRole('button', { name: '+ Add Luggage' }).click()

    // Fill out form
    await page.getByPlaceholder('e.g., 20L Aer Pro Pack').fill('20L Aer Pro Pack')
    await page.getByRole('combobox').selectOption('backpack')
    await page.getByPlaceholder('e.g., 20').fill('20')

    // Submit
    await page.getByRole('button', { name: 'Add' }).click()

    // Verify luggage was created
    await expect(page.getByText('20L Aer Pro Pack')).toBeVisible()
    await expect(page.getByText('backpack')).toBeVisible()
    await expect(page.getByText('20L capacity')).toBeVisible()
  })

  test('should delete luggage item', async ({ page }) => {
    // Assume luggage exists from previous test
    await page.getByRole('button', { name: 'Delete' }).first().click()
    
    // Confirm deletion
    page.on('dialog', dialog => dialog.accept())
    
    // Verify luggage was deleted
    await expect(page.getByText('No luggage yet')).toBeVisible()
  })
})

test.describe('Trip Luggage Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Create test luggage first
    await page.goto('/luggage')
    await page.getByRole('button', { name: '+ Add Luggage' }).click()
    await page.getByPlaceholder('e.g., 20L Aer Pro Pack').fill('Test Backpack')
    await page.getByRole('button', { name: 'Add' }).click()

    // Navigate to a trip
    await page.goto('/dashboard')
    await page.getByText('Test Trip').first().click()
  })

  test('should display luggage selector on trip page', async ({ page }) => {
    await expect(page.getByText('Luggage for this trip')).toBeVisible()
    await expect(page.getByText('Test Backpack')).toBeVisible()
  })

  test('should select luggage for trip', async ({ page }) => {
    // Click checkbox for luggage
    const checkbox = page.locator('button').filter({ hasText: 'Test Backpack' })
    await checkbox.click()

    // Verify checkbox is checked (blue background)
    await expect(checkbox).toHaveClass(/border-blue-500/)
  })

  test('should show "Add Luggage" prompt when no luggage exists', async ({ page }) => {
    // Delete all luggage first
    await page.goto('/luggage')
    // Delete logic...

    // Go back to trip
    await page.goto('/trip/test-trip-id')

    await expect(page.getByText('No luggage yet')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Add Luggage' })).toBeVisible()
  })
})

test.describe('Item Assignment to Luggage', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Create luggage and navigate to trip with items
    await page.goto('/luggage')
    await page.getByRole('button', { name: '+ Add Luggage' }).click()
    await page.getByPlaceholder('e.g., 20L Aer Pro Pack').fill('Aer Backpack')
    await page.getByRole('button', { name: 'Add' }).click()

    // Navigate to trip and select luggage
    await page.goto('/dashboard')
    await page.getByText('Test Trip').first().click()
    await page.locator('button').filter({ hasText: 'Aer Backpack' }).click()
  })

  test('should display luggage dropdown for packing items', async ({ page }) => {
    // Find first packing item
    const item = page.locator('.space-y-2').first()
    
    // Verify dropdown exists
    const dropdown = item.locator('select')
    await expect(dropdown).toBeVisible()
    
    // Verify options
    await expect(dropdown.locator('option', { hasText: 'No bag' })).toBeVisible()
    await expect(dropdown.locator('option', { hasText: 'Aer Backpack' })).toBeVisible()
  })

  test('should assign item to luggage', async ({ page }) => {
    // Find first packing item dropdown
    const dropdown = page.locator('select').first()
    
    // Select luggage
    await dropdown.selectOption({ label: /Aer Backpack/ })
    
    // Verify icon appears next to item
    await expect(page.locator('span[title*="Aer Backpack"]')).toBeVisible()
  })

  test('should unassign item from luggage', async ({ page }) => {
    // Assign first
    const dropdown = page.locator('select').first()
    await dropdown.selectOption({ label: /Aer Backpack/ })
    
    // Unassign
    await dropdown.selectOption({ label: 'No bag' })
    
    // Verify icon is removed
    await expect(page.locator('span[title*="Aer Backpack"]')).not.toBeVisible()
  })

  test('should only show selected luggage in dropdown', async ({ page }) => {
    // Create second luggage but don't select it
    await page.goto('/luggage')
    await page.getByRole('button', { name: '+ Add Luggage' }).click()
    await page.getByPlaceholder('e.g., 20L Aer Pro Pack').fill('Rimowa Trunk')
    await page.getByRole('button', { name: 'Add' }).click()

    // Go back to trip (only Aer Backpack is selected)
    await page.goto('/trip/test-trip-id')
    
    // Check dropdown
    const dropdown = page.locator('select').first()
    await expect(dropdown.locator('option', { hasText: 'Aer Backpack' })).toBeVisible()
    await expect(dropdown.locator('option', { hasText: 'Rimowa Trunk' })).not.toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('should navigate to luggage from inventory page', async ({ page }) => {
    await page.goto('/inventory')
    
    // Click luggage button
    await page.getByRole('link', { name: /Luggage/ }).click()
    
    // Verify navigation
    await expect(page).toHaveURL('/luggage')
  })

  test('should navigate to luggage management from trip page', async ({ page }) => {
    await page.goto('/trip/test-trip-id')
    
    // Click "Manage" link in luggage selector
    await page.getByRole('link', { name: 'Manage →' }).click()
    
    // Verify navigation
    await expect(page).toHaveURL('/luggage')
  })
})

test.describe('Luggage Icons', () => {
  const iconTests = [
    { type: 'backpack', icon: '🎒' },
    { type: 'carry-on', icon: '🧳' },
    { type: 'checked', icon: '💼' },
    { type: 'trunk', icon: '📦' },
    { type: 'other', icon: '👜' },
  ]

  iconTests.forEach(({ type, icon }) => {
    test(`should display correct icon for ${type}`, async ({ page }) => {
      await page.goto('/luggage')
      
      // Create luggage with specific type
      await page.getByRole('button', { name: '+ Add Luggage' }).click()
      await page.getByPlaceholder('e.g., 20L Aer Pro Pack').fill(`Test ${type}`)
      await page.getByRole('combobox').selectOption(type)
      await page.getByRole('button', { name: 'Add' }).click()
      
      // Verify icon
      await expect(page.getByText(icon)).toBeVisible()
    })
  })
})
