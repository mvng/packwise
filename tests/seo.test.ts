import { test, expect } from '@playwright/test';
import robots from '../app/robots';
import sitemap from '../app/sitemap';

test.describe('SEO Metadata', () => {
  test('robots.ts should disallow private routes and provide sitemap URL', () => {
    const robotsMetadata = robots();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';

    expect(robotsMetadata.sitemap).toBe(`${baseUrl}/sitemap.xml`);

    const rules = Array.isArray(robotsMetadata.rules) ? robotsMetadata.rules[0] : robotsMetadata.rules;
    expect(rules.userAgent).toBe('*');
    expect(rules.allow).toBe('/');
    expect(rules.disallow).toEqual(
      expect.arrayContaining([
        '/dashboard',
        '/settings',
        '/inventory',
        '/luggage',
        '/claim/',
      ])
    );
  });

  test('sitemap.ts should return static public routes without lastModified', () => {
    const sitemapMetadata = sitemap();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';

    expect(sitemapMetadata).toHaveLength(2);

    expect(sitemapMetadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: baseUrl }),
        expect.objectContaining({ url: `${baseUrl}/login` }),
      ])
    );

    // Verify none of the items have lastModified
    sitemapMetadata.forEach(item => {
      expect(item.lastModified).toBeUndefined();
    });
  });
});
