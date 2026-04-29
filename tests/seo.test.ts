import { test, expect } from '@playwright/test'

test.describe('SEO Configuration', () => {
  test('robots.txt should have the correct configuration', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.status()).toBe(200)

    const text = await response.text()

    // Check for user-agent
    expect(text).toContain('User-Agent: *')

    // Check allows and disallows
    expect(text).toContain('Allow: /')
    expect(text).toContain('Allow: /login')
    expect(text).toContain('Disallow: /dashboard')
    expect(text).toContain('Disallow: /settings')
    expect(text).toContain('Disallow: /inventory')
    expect(text).toContain('Disallow: /luggage')
    expect(text).toContain('Disallow: /trip/')

    // Verify sitemap link dynamically
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl
    expect(text).toContain(`Sitemap: ${baseUrl}/sitemap.xml`)
  })

  test('sitemap.xml should include public routes', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.status()).toBe(200)

    const text = await response.text()

    // Verify it is XML
    expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

    // Check for homepage
    expect(text).toContain(`<loc>${baseUrl}/</loc>`)

    // Check for login page
    expect(text).toContain(`<loc>${baseUrl}/login</loc>`)
  })
})
