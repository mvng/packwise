import { test, expect } from '@playwright/test';
import sitemap from '../app/sitemap';

test.describe('SEO Tests', () => {
  test('sitemap should generate correctly and contain only public routes', () => {
    // Generate the sitemap
    const generatedSitemap = sitemap();

    // Check that we have exactly 3 entries
    expect(generatedSitemap.length).toBe(3);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';

    // Extract the URLs from the sitemap
    const urls = generatedSitemap.map(item => item.url);

    // Verify all expected URLs are present
    expect(urls).toContain(`${baseUrl}`);
    expect(urls).toContain(`${baseUrl}/login`);
    expect(urls).toContain(`${baseUrl}/ds`);

    // Verify properties of the home route
    const homeRoute = generatedSitemap.find(item => item.url === `${baseUrl}`);
    expect(homeRoute).toBeDefined();
    expect(homeRoute?.priority).toBe(1);
    expect(homeRoute?.changeFrequency).toBe('weekly');
    expect(homeRoute?.lastModified).toBeInstanceOf(Date);
  });
});
