import { test, expect } from '@playwright/test'
import sitemap from '../app/sitemap'
import robots from '../app/robots'

test.describe('SEO Metadata Generators', () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  test('sitemap() returns correct structure', () => {
    const sitemapResult = sitemap()

    expect(Array.isArray(sitemapResult)).toBe(true)
    expect(sitemapResult).toHaveLength(2)

    // Homepage
    expect(sitemapResult[0]).toMatchObject({
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    })

    // Login page
    expect(sitemapResult[1]).toMatchObject({
      url: `${baseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  })

  test('robots() returns correct structure', () => {
    const robotsResult = robots()

    expect(robotsResult).toMatchObject({
      rules: {
        userAgent: '*',
        allow: ['/', '/login'],
        disallow: ['/dashboard/', '/claim/', '/api/'],
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    })
  })
})
