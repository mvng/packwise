import { test, expect } from '@playwright/test';

test('Verify "Paste a List" functionality', async ({ page }) => {
  // We will intercept the network request to /dashboard and mock a trip
  await page.route('/dashboard', async route => {
    // Actually we just need to go to a trip page. Let's mock the trip API if possible, or just visit a generic trip page with mocked data.
    // For now, let's just go to the home page and wait. If we can't create a trip, maybe we can mock the trip page entirely.
  });

  // Since we don't have auth, let's mock the session and the trip response on a trip page.
  await page.route('/api/auth/session', async route => {
    await route.fulfill({ json: { session: null } });
  });

  // Let's create a simpler test: we will mock the /trip/123 page directly.
  await page.route('/trip/123', async route => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Mock Trip</title></head>
        <body>
          <div id="__next"></div>
        </body>
      </html>
    `;
    await route.fulfill({ contentType: 'text/html', body: html });
  });
});