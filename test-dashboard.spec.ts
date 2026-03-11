import { test, expect } from '@playwright/test';

test('take dashboard screenshot', async ({ page }) => {
  // Mock out Next Router or anything else if needed, but we injected state directly.
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // wait for components to render
  await page.screenshot({ path: 'dashboard-screenshot.png', fullPage: true });
});
