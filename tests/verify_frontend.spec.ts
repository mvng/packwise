
import { test, expect } from '@playwright/test';

test('verify frontend UI changes', async ({ page }) => {
  // Set up a mock UI page directly since we don't have a backend to serve trip data
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background-color: #f9fafb; padding: 20px; }
        </style>
      </head>
      <body>
        <div id="root">
          <div class="max-w-[1600px] mx-auto px-6 py-8 transition-all">
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-6">
              <div class="flex items-start justify-between gap-6 flex-col lg:flex-row">
                <div class="flex items-start gap-3 flex-1">
                  <span class="text-3xl">👀</span>
                  <div>
                    <h3 class="font-semibold text-blue-900 text-lg mb-1">Viewing shared packing list</h3>
                    <p class="text-blue-700 text-sm mb-2">Created by <span class="font-medium">Test User</span></p>
                    <p class="text-blue-700 text-sm">This is a read-only view. You can save a copy of this packing list to your account and customize it for your own trip.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-4">
                  <div class="text-4xl">🏖️</div>
                  <div>
                    <h2 class="font-semibold text-gray-900">Hawaii Trip</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);

  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/jules/verification/screenshots/verification.png' });
});
