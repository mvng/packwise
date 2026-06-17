import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

test('Verify Save and Cancel Note Buttons', async ({ page }) => {
  // We use page.setContent to render a basic isolated component test
  // to avoid backend connection issues with complex flows locally.
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        /* Add focus visible styles to ensure we can see them in screenshots */
        *:focus-visible { outline: 2px solid blue !important; }
      </style>
    </head>
    <body class="p-8">
      <div class="mt-1 flex items-start gap-1">
        <textarea
          class="text-xs p-1.5 w-64 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          rows="2"
        >Buy toothpaste there...</textarea>
        <div class="flex flex-col gap-1">
          <!-- The Save button with our changes -->
          <button
            aria-label="Save note"
            class="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>

          <!-- The Cancel button with our changes -->
          <button
            aria-label="Cancel editing note"
            class="p-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(htmlContent);
  await page.waitForTimeout(1000);

  // Take baseline screenshot
  await page.screenshot({ path: '/home/jules/verification/screenshots/verification-baseline.png' });

  // Focus Save button and screenshot
  await page.keyboard.press('Tab'); // Should focus textarea
  await page.keyboard.press('Tab'); // Should focus Save button
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/jules/verification/screenshots/verification-save-focus.png' });

  // Focus Cancel button and screenshot
  await page.keyboard.press('Tab'); // Should focus Cancel button
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/jules/verification/screenshots/verification-cancel-focus.png' });
});
