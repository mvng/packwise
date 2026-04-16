import { test, expect } from '@playwright/test'
import robots from '../app/robots'
import sitemap from '../app/sitemap'

test.describe('SEO Metadata Generators', () => {
  const getExpectedBaseUrl = () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
    return rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl
  }

  test('robots.ts generates correct rules and sitemap URL', () => {
    const expectedBaseUrl = getExpectedBaseUrl()
    const result = robots()

    expect(result.sitemap).toBe(`${expectedBaseUrl}/sitemap.xml`)

    // Extract the rule object. Note that MetadataRoute.Robots allows rules to be an array or an object
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules

    expect(rules).toBeDefined()
    expect(rules?.userAgent).toBe('*')
    expect(rules?.allow).toContain('/')
    expect(rules?.allow).toContain('/login')
    expect(rules?.disallow).toContain('/dashboard')
    expect(rules?.disallow).toContain('/settings')
    expect(rules?.disallow).toContain('/inventory')
    expect(rules?.disallow).toContain('/luggage')
  })

  test('sitemap.ts generates correct static routes', () => {
    const expectedBaseUrl = getExpectedBaseUrl()
    const result = sitemap()

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(2)

    // Check index route
    const indexRoute = result.find(route => route.url === `${expectedBaseUrl}/`)
    expect(indexRoute).toBeDefined()
    expect(indexRoute?.priority).toBe(1)
    expect(indexRoute?.changeFrequency).toBe('weekly')

    // Check login route
    const loginRoute = result.find(route => route.url === `${expectedBaseUrl}/login`)
    expect(loginRoute).toBeDefined()
    expect(loginRoute?.priority).toBe(0.8)
    expect(loginRoute?.changeFrequency).toBe('monthly')

    // Ensure lastModified is not set (anti-pattern for static pages)
    expect(indexRoute?.lastModified).toBeUndefined()
    expect(loginRoute?.lastModified).toBeUndefined()
  })
})
