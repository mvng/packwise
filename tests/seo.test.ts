import { test, expect } from '@playwright/test'

test.describe('SEO - robots.txt', () => {
  test('robots.txt should render with correct rules and host', async ({ request }) => {
    // Determine the base URL dynamically just as the Next.js app will
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
    const expectedHost = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

    // Use request.get instead of page.goto to ensure we get raw text and not wrapped by browser's raw viewer
    const response = await request.get('/robots.txt')
    expect(response.ok()).toBeTruthy()

    // The content type should be plain text
    expect(response.headers()['content-type']).toContain('text/plain')

    const text = await response.text()

    // Check that user-agent is correctly targeted
    expect(text).toContain('User-Agent: *')

    // Check allow rules
    expect(text).toContain('Allow: /')
    expect(text).toContain('Allow: /login')

    // Check disallow rules (private and user-specific routes)
    expect(text).toContain('Disallow: /dashboard')
    expect(text).toContain('Disallow: /settings')
    expect(text).toContain('Disallow: /inventory')
    expect(text).toContain('Disallow: /luggage')
    expect(text).toContain('Disallow: /trip/')
    expect(text).toContain('Disallow: /api/')

    // Check that host is included correctly
    expect(text).toContain(`Host: ${expectedHost}`)
  })
})
