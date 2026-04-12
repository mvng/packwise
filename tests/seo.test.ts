import { test, expect } from '@playwright/test';
import sitemap from '../app/sitemap';
import robots from '../app/robots';

test.describe('SEO Metadata Functions', () => {
  test('sitemap returns correct public routes without lastModified', () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

    const result = sitemap();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      url: `${baseUrl}`,
      changeFrequency: 'yearly',
      priority: 1,
    });
    expect(result[1]).toEqual({
      url: `${baseUrl}/login`,
      changeFrequency: 'yearly',
      priority: 0.8,
    });
    // Ensure no lastModified is present
    expect(result[0].lastModified).toBeUndefined();
  });

  test('robots returns correct crawler rules and sitemap URL', () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

    const result = robots();

    expect(result.sitemap).toBe(`${baseUrl}/sitemap.xml`);

    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules?.userAgent).toBe('*');
    expect(rules?.allow).toBe('/');
    expect(rules?.disallow).toContain('/dashboard');
    expect(rules?.disallow).toContain('/settings');
    expect(rules?.disallow).toContain('/inventory');
    expect(rules?.disallow).toContain('/luggage');
    expect(rules?.disallow).toContain('/claim/');
  });
});
