import { test, expect } from '@playwright/test';

const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

test.describe('SEO Configuration', () => {
  test('robots.txt prevents indexing of private routes', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);

    const text = await response.text();
    expect(text).toContain('User-Agent: *');
    expect(text).toContain('Allow: /');
    expect(text).toContain('Allow: /login');
    expect(text).toContain('Disallow: /dashboard');
    expect(text).toContain('Disallow: /settings');
    expect(text).toContain('Disallow: /inventory');
    expect(text).toContain('Disallow: /luggage');
    expect(text).toContain('Disallow: /trip/');
    expect(text).toContain('Disallow: /api/');
    expect(text).toContain(`Sitemap: ${baseUrl}/sitemap.xml`);
  });

  test('sitemap.xml contains only public static routes', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const text = await response.text();
    expect(text).toContain('<loc>' + baseUrl + '/</loc>');
    expect(text).toContain('<loc>' + baseUrl + '/login</loc>');
    expect(text).not.toContain('<loc>' + baseUrl + '/dashboard</loc>');
  });
});
