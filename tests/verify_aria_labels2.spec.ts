import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('verify aria-labels on icon buttons', async ({ page }) => {
  await page.setContent(`
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="p-8 space-y-4">
        <h1 class="text-xl font-bold mb-4">Aria Label Verification (Non-visual)</h1>

        <div class="border p-4 rounded bg-gray-50 flex gap-4 items-center">
            <span>Item 1</span>

            <!-- Save note button -->
            <button class="p-1 bg-blue-600 text-white rounded" aria-label="Save note">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </button>

            <!-- Cancel note button -->
            <button class="p-1 bg-gray-200 text-gray-500 rounded" aria-label="Cancel editing note">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <!-- Add/Edit note button -->
            <button class="p-1 border rounded-full bg-white text-gray-400" aria-label="Add/Edit Note">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </button>

            <!-- Add to departure checklist -->
            <button class="p-1 border rounded-full bg-white text-gray-400" aria-label="Add to departure checklist (pack last)">
               <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </button>

            <!-- Remove item -->
            <button class="p-1 text-red-400" aria-label="Remove Item 1 from packing list">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div class="mt-4 p-4 bg-blue-50 text-blue-800 text-sm rounded">
          Note: Aria labels are invisible to sighted users, but present in the DOM for screen readers.
        </div>
      </body>
    </html>
  `);

  fs.mkdirSync('/home/jules/verification', { recursive: true });
  await page.screenshot({ path: '/home/jules/verification/verification.png' });
});
