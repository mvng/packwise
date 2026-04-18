import { test, expect } from '@playwright/test';
import robots from '../app/robots';
import sitemap from '../app/sitemap';

test.describe('SEO Configuration', () => {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  test('robots.ts should allow public routes and disallow private routes', () => {
    const robotsConfig = robots();

    // Evaluate rules depending on whether it's an array or object
    const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;

    expect(rules.userAgent).toBe('*');
    expect(rules.allow).toContain('/');
    expect(rules.disallow).toContain('/dashboard');
    expect(rules.disallow).toContain('/settings');
    expect(rules.disallow).toContain('/inventory');
    expect(rules.disallow).toContain('/luggage');

    expect(robotsConfig.sitemap).toBe(`${baseUrl}/sitemap.xml`);
  });

  test('sitemap.ts should contain correct public URLs', () => {
    const sitemapConfig = sitemap();

    expect(sitemapConfig).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: `${baseUrl}/`,
          priority: 1,
        }),
        expect.objectContaining({
          url: `${baseUrl}/login`,
          priority: 0.8,
        }),
      ])
    );
  });
});
