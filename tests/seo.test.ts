import { test, expect } from '@playwright/test'
import robots from '../app/robots'
import sitemap from '../app/sitemap'

test.describe('SEO Metadata Configuration', () => {
  const expectedBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const cleanBaseUrl = expectedBaseUrl.endsWith('/') ? expectedBaseUrl.slice(0, -1) : expectedBaseUrl

  test('robots() should return correct rules and sitemap URL', () => {
    const robotsConfig = robots()

    // Check sitemap URL
    expect(robotsConfig.sitemap).toBe(`${cleanBaseUrl}/sitemap.xml`)

    // Check rules
    const rules = robotsConfig.rules
    expect(rules).toBeDefined()

    // Depending on whether rules is returned as an array or object
    const rulesObj = Array.isArray(rules) ? rules[0] : rules

    expect(rulesObj.userAgent).toBe('*')
    expect(rulesObj.allow).toBe('/')
    expect(rulesObj.disallow).toContain('/dashboard/')
    expect(rulesObj.disallow).toContain('/settings/')
    expect(rulesObj.disallow).toContain('/inventory/')
    expect(rulesObj.disallow).toContain('/luggage/')
    expect(rulesObj.disallow).toContain('/api/')
  })

  test('sitemap() should return expected public routes', () => {
    const sitemapConfig = sitemap()

    expect(Array.isArray(sitemapConfig)).toBe(true)
    expect(sitemapConfig.length).toBe(2)

    // Check root route
    expect(sitemapConfig[0].url).toBe(`${cleanBaseUrl}/`)
    expect(sitemapConfig[0].changeFrequency).toBe('monthly')
    expect(sitemapConfig[0].priority).toBe(1)

    // Check login route
    expect(sitemapConfig[1].url).toBe(`${cleanBaseUrl}/login`)
    expect(sitemapConfig[1].changeFrequency).toBe('yearly')
    expect(sitemapConfig[1].priority).toBe(0.8)
  })
})
