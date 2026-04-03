import { test, expect } from '@playwright/test';
import robots from '../app/robots';
import sitemap from '../app/sitemap';

test.describe('SEO Generation', () => {
  test('robots.txt should allow / and disallow private routes', () => {
    const robotsData = robots();
    expect(robotsData.rules).toBeDefined();
    if (Array.isArray(robotsData.rules)) {
      expect(robotsData.rules[0].allow).toBe('/');
      expect(robotsData.rules[0].disallow).toContain('/dashboard/');
    } else {
      expect(robotsData.rules.allow).toBe('/');
      expect(robotsData.rules.disallow).toContain('/dashboard/');
    }
  });

  test('sitemap.xml should contain static public routes', () => {
    const sitemapData = sitemap();
    expect(sitemapData.length).toBeGreaterThan(0);
    const urls = sitemapData.map(entry => entry.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
    expect(urls.some(url => url === baseUrl)).toBe(true);
    expect(urls.some(url => url.endsWith('/login'))).toBe(true);
  });
});
