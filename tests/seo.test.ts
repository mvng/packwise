import { test, expect } from '@playwright/test'
import robots from '../app/robots'
import sitemap from '../app/sitemap'

test.describe('SEO Configuration Tests', () => {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const expectedBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  test('robots.ts should return correctly structured rules', () => {
    const robotsData = robots()

    // Convert rules to an array if it's not already one, to handle both configurations
    const rulesArray = Array.isArray(robotsData.rules) ? robotsData.rules : [robotsData.rules]

    // Find the catch-all user agent rule
    const generalRule = rulesArray.find(r => r.userAgent === '*')
    expect(generalRule).toBeDefined()

    // Verify allow/disallow lists
    expect(generalRule?.allow).toContain('/')
    expect(generalRule?.allow).toContain('/login')
    expect(generalRule?.allow).toContain('/trip/')

    expect(generalRule?.disallow).toContain('/dashboard')
    expect(generalRule?.disallow).toContain('/settings')
    expect(generalRule?.disallow).toContain('/inventory')
    expect(generalRule?.disallow).toContain('/luggage')

    // Verify sitemap URL
    expect(robotsData.sitemap).toBe(`${expectedBaseUrl}/sitemap.xml`)
  })

  test('sitemap.ts should return valid static routes without lastModified', () => {
    const sitemapData = sitemap()

    expect(Array.isArray(sitemapData)).toBe(true)
    expect(sitemapData.length).toBeGreaterThan(0)

    // Verify home page
    const homeRoute = sitemapData.find(route => route.url === `${expectedBaseUrl}/`)
    expect(homeRoute).toBeDefined()
    expect(homeRoute?.priority).toBe(1)
    expect(homeRoute?.lastModified).toBeUndefined()

    // Verify login page
    const loginRoute = sitemapData.find(route => route.url === `${expectedBaseUrl}/login`)
    expect(loginRoute).toBeDefined()
    expect(loginRoute?.priority).toBe(0.8)
    expect(loginRoute?.lastModified).toBeUndefined()
  })
})
