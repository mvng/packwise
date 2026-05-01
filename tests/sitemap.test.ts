import { test, expect } from '@playwright/test'

test.describe('SEO: Robots and Sitemap Verification', () => {
  test('robots.txt returns correct crawl directives', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.ok()).toBeTruthy()
    const text = await response.text()

    expect(text).toContain('User-Agent: *')
    expect(text).toContain('Allow: /')
    expect(text).toContain('Allow: /login')
    expect(text).toContain('Disallow: /dashboard')
    expect(text).toContain('Disallow: /settings')
    expect(text).toContain('Disallow: /inventory')
    expect(text).toContain('Disallow: /luggage')
    expect(text).toContain('Disallow: /trip/')
    expect(text).toContain('Sitemap:')
    expect(text).toContain('sitemap.xml')
  })

  test('sitemap.xml returns correct static public routes', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.ok()).toBeTruthy()
    const text = await response.text()

    expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(text).toContain('<loc>')

    // Check for presence of key public routes
    expect(text).toContain('<loc>https://packwise-indol.vercel.app/</loc>')
    expect(text).toContain('<loc>https://packwise-indol.vercel.app/login</loc>')

    // Check that we're using static dates, not dynamic ones that change on every request
    expect(text).toContain('<lastmod>2024-05-01')

    // Ensure private routes are NOT in the sitemap
    expect(text).not.toContain('/dashboard</loc>')
    expect(text).not.toContain('/settings</loc>')
  })
})
