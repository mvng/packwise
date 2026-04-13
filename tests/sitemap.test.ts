import { test, expect } from '@playwright/test';
import sitemap from '../app/sitemap';
import robots from '../app/robots';

test('sitemap generates correctly', async () => {
  const result = sitemap();
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  expect(result.length).toBe(2);
  expect(result[0].url).toBe(`${baseUrl}/`);
  expect(result[1].url).toBe(`${baseUrl}/login`);
});

test('robots generates correctly', async () => {
  const result = robots();
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;

  expect(rules?.allow).toContain('/');
  expect(rules?.disallow).toContain('/dashboard');
  expect(rules?.disallow).toContain('/settings');
  expect(rules?.disallow).toContain('/inventory');
  expect(rules?.disallow).toContain('/luggage');
  expect(rules?.disallow).toContain('/claim/');
  expect(result.sitemap).toBe(`${baseUrl}/sitemap.xml`);
});
