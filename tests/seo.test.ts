import { test, expect } from '@playwright/test'
import sitemap from '../app/sitemap'
import robots from '../app/robots'

test.describe('SEO Configuration Files', () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  test('sitemap() generates valid Sitemap', () => {
    const sitemapData = sitemap()

    expect(Array.isArray(sitemapData)).toBe(true)
    expect(sitemapData.length).toBe(2)

    // Verify root URL
    expect(sitemapData[0]).toMatchObject({
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    })

    // Verify login URL
    expect(sitemapData[1]).toMatchObject({
      url: `${baseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  })

  test('robots() generates valid Robots', () => {
    const robotsData = robots()

    expect(robotsData.sitemap).toBe(`${baseUrl}/sitemap.xml`)

    // Ensure the rules are generated properly and handle Array or object
    const rules = Array.isArray(robotsData.rules) ? robotsData.rules[0] : robotsData.rules
    expect(rules).toBeDefined()
    expect(rules.userAgent).toBe('*')
    expect(rules.allow).toBe('/')
    expect(rules.disallow).toContain('/dashboard/')
    expect(rules.disallow).toContain('/settings/')
    expect(rules.disallow).toContain('/inventory/')
    expect(rules.disallow).toContain('/luggage/')
  })
})
