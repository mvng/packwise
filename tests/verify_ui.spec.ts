import { test, expect } from '@playwright/test';

test('verify TripMembersSection', async ({ page }) => {
  // Use page.setContent to render the isolated component since DB is empty
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          /* Minimal styles to simulate the project's globals */
          body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; }
        </style>
      </head>
      <body class="p-8 bg-gray-50">
        <div class="max-w-md bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 class="text-sm font-semibold mb-4">Isolated Component Test</h2>

          <div class="flex flex-col gap-2">
            <div class="flex items-center flex-wrap gap-1.5">
              <span class="flex items-center gap-1 text-xs font-medium text-gray-400 shrink-0 mr-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Members
              </span>

              <!-- Avatar Pill -->
              <div class="group relative">
                <button
                  class="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold ring-2 ring-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 hover:bg-red-100 hover:text-red-600 cursor-pointer focus-visible:ring-red-500"
                  title="Alice"
                  aria-label="Remove Alice from trip"
                >
                  <span class="group-hover:hidden" aria-hidden="true">A</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 hidden group-hover:block" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <!-- Add Member Button -->
              <button
                class="w-7 h-7 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                title="Add member"
                aria-label="Add new member to trip"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>
          </div>

          <div class="mt-8 border-t pt-4">
             <p class="text-xs text-gray-500 mb-2">Simulating inline add form (isAdding = true)</p>
             <div class="flex items-center gap-2">
                <input
                  type="text"
                  value="Bob"
                  placeholder="Name (e.g. Peter, Grandma)"
                  class="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-48"
                />
                <button
                  class="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                  title="Confirm"
                  aria-label="Confirm adding member"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
                <button
                  class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-1"
                  title="Cancel"
                  aria-label="Cancel adding member"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
          </div>

        </div>
      </body>
    </html>
  `);

  // Wait for Tailwind to load and apply
  await page.waitForTimeout(1500);

  // Take a screenshot of the initial state
  await page.screenshot({ path: '/home/jules/verification/members-section.png' });

  // Focus the Avatar button and take a screenshot to show the focus ring
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500); // Wait for transition
  await page.screenshot({ path: '/home/jules/verification/members-section-focus-avatar.png' });

  // Focus the Add button
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/jules/verification/members-section-focus-add.png' });
});
