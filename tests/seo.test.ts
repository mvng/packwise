import { test, expect } from '@playwright/test'
import sitemap from '../app/sitemap'
import robots from '../app/robots'

test.describe('SEO Configuration', () => {
  test('sitemap generates correctly', () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

    const result = sitemap()

    expect(result).toHaveLength(2)

    expect(result[0].url).toBe(`${baseUrl}/`)
    expect(result[0].priority).toBe(1)
    expect(result[0].changeFrequency).toBe('yearly')

    expect(result[1].url).toBe(`${baseUrl}/login`)
    expect(result[1].priority).toBe(0.8)
    expect(result[1].changeFrequency).toBe('yearly')
  })

  test('robots generates correctly', () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

    const result = robots()

    expect(result.rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage'],
    })

    expect(result.sitemap).toBe(`${baseUrl}/sitemap.xml`)
  })
})
