import { test, expect } from '@playwright/test'
import sitemap from '../app/sitemap'
import robots from '../app/robots'

test.describe('SEO Configuration', () => {
  const expectedBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  test('sitemap.ts returns the correct static routes', () => {
    const sitemapResult = sitemap()

    expect(sitemapResult).toBeDefined()
    expect(sitemapResult.length).toBe(2)

    expect(sitemapResult).toContainEqual({
      url: `${expectedBaseUrl}/`,
      changeFrequency: 'weekly',
      priority: 1,
    })

    expect(sitemapResult).toContainEqual({
      url: `${expectedBaseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  })

  test('robots.ts returns the correct rules and sitemap URL', () => {
    const robotsResult = robots()

    expect(robotsResult).toBeDefined()
    expect(robotsResult.sitemap).toBe(`${expectedBaseUrl}/sitemap.xml`)

    // In robots.ts rules can be a single object or an array. In our implementation it's a single object.
    const rules = Array.isArray(robotsResult.rules) ? robotsResult.rules[0] : robotsResult.rules

    expect(rules).toBeDefined()
    expect(rules?.userAgent).toBe('*')
    expect(rules?.allow).toEqual(['/', '/login', '/trip/'])
    expect(rules?.disallow).toEqual(['/dashboard/', '/settings/', '/inventory/', '/luggage/', '/claim/'])
  })
})
