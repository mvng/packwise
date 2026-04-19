import { test, expect } from '@playwright/test'
import robots from '../app/robots'
import sitemap from '../app/sitemap'

test.describe('SEO Configuration Tests', () => {
  const getBaseUrl = () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
    return rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl
  }

  test('robots.ts should allow public and disallow private routes', () => {
    const robotsData = robots()
    const baseUrl = getBaseUrl()

    // Assert that rules object exists
    expect(robotsData.rules).toBeDefined()

    // Evaluate rules as array or single object
    const rules = Array.isArray(robotsData.rules) ? robotsData.rules[0] : robotsData.rules

    // Assert basic rules structure
    expect(rules).toBeDefined()
    expect(rules.userAgent).toBe('*')

    // Assert allowed paths
    expect(rules.allow).toContain('/')
    expect(rules.allow).toContain('/login')

    // Assert disallowed paths
    expect(rules.disallow).toContain('/dashboard/')
    expect(rules.disallow).toContain('/settings/')
    expect(rules.disallow).toContain('/inventory/')
    expect(rules.disallow).toContain('/luggage/')

    // Assert sitemap URL
    expect(robotsData.sitemap).toBe(`${baseUrl}/sitemap.xml`)
  })

  test('sitemap.ts should contain public routes with appropriate priority', () => {
    const sitemapData = sitemap()
    const baseUrl = getBaseUrl()

    expect(Array.isArray(sitemapData)).toBe(true)
    expect(sitemapData.length).toBe(2)

    // Find the homepage route
    const homeRoute = sitemapData.find(route => route.url === `${baseUrl}/`)
    expect(homeRoute).toBeDefined()
    expect(homeRoute?.changeFrequency).toBe('weekly')
    expect(homeRoute?.priority).toBe(1)

    // Find the login route
    const loginRoute = sitemapData.find(route => route.url === `${baseUrl}/login`)
    expect(loginRoute).toBeDefined()
    expect(loginRoute?.changeFrequency).toBe('monthly')
    expect(loginRoute?.priority).toBe(0.8)
  })
})
