import { test, expect } from '@playwright/test'
import robots from '../app/robots'
import sitemap from '../app/sitemap'

test.describe('SEO Configuration', () => {
  test('robots() should return correct disallow rules and sitemap URL', () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

    const robotsData = robots()

    // Check rules structure based on Next.js 14 MetadataRoute.Robots structure
    const rules = Array.isArray(robotsData.rules) ? robotsData.rules[0] : robotsData.rules

    expect(rules).toBeDefined()
    expect(rules?.userAgent).toBe('*')
    expect(rules?.allow).toBe('/')
    expect(rules?.disallow).toEqual(['/dashboard', '/settings', '/inventory', '/luggage'])

    expect(robotsData.sitemap).toBe(`${baseUrl}/sitemap.xml`)
  })

  test('sitemap() should return correct static routes and priority', () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

    const sitemapData = sitemap()

    expect(sitemapData.length).toBe(2)

    expect(sitemapData[0].url).toBe(`${baseUrl}`)
    expect(sitemapData[0].priority).toBe(1)
    expect(sitemapData[0].changeFrequency).toBe('monthly')

    expect(sitemapData[1].url).toBe(`${baseUrl}/login`)
    expect(sitemapData[1].priority).toBe(0.8)
    expect(sitemapData[1].changeFrequency).toBe('yearly')
  })
})
