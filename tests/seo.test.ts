import { test, expect } from '@playwright/test';
import robots from '../app/robots';
import sitemap from '../app/sitemap';

test.describe('SEO Configuration Tests', () => {
  test('robots.ts should output valid structure', () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

    const output = robots();

    expect(output.sitemap).toBe(`${baseUrl}/sitemap.xml`);

    const rules = Array.isArray(output.rules) ? output.rules[0] : output.rules;
    expect(rules).toBeDefined();
    expect(rules?.userAgent).toBe('*');
    expect(rules?.allow).toBe('/');
    expect(rules?.disallow).toContain('/dashboard/');
    expect(rules?.disallow).toContain('/settings/');
    expect(rules?.disallow).toContain('/inventory/');
    expect(rules?.disallow).toContain('/luggage/');
  });

  test('sitemap.ts should output valid structure', () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

    const output = sitemap();

    expect(output.length).toBeGreaterThan(0);
    expect(output[0].url).toBe(`${baseUrl}`);
    expect(output[0].priority).toBe(1);

    const urls = output.map(item => item.url);
    expect(urls).toContain(`${baseUrl}/login`);
    expect(urls).not.toContain(`${baseUrl}/dashboard`);
    expect(urls).not.toContain(`${baseUrl}/settings`);
  });
});
