import { test, expect } from '@playwright/test'
import sitemap from '../app/sitemap'

test.describe('Sitemap Generation', () => {
  test('generates sitemap with correct public URLs', () => {
    const sitemapData = sitemap()

    expect(sitemapData).toBeDefined()
    expect(sitemapData.length).toBeGreaterThan(0)

    const urls = sitemapData.map(entry => entry.url)

    // Check for public routes
    expect(urls).toContain('https://packwise-indol.vercel.app')
    expect(urls).toContain('https://packwise-indol.vercel.app/login')

    // Ensure no private routes are included
    expect(urls).not.toContain('https://packwise-indol.vercel.app/dashboard')
    expect(urls).not.toContain('https://packwise-indol.vercel.app/settings')
    expect(urls).not.toContain('https://packwise-indol.vercel.app/inventory')
    expect(urls).not.toContain('https://packwise-indol.vercel.app/luggage')
  })

  test('uses NEXT_PUBLIC_APP_URL environment variable if provided', () => {
    const originalEnv = process.env.NEXT_PUBLIC_APP_URL
    process.env.NEXT_PUBLIC_APP_URL = 'https://custom-domain.com'

    const sitemapData = sitemap()
    const urls = sitemapData.map(entry => entry.url)

    expect(urls).toContain('https://custom-domain.com')
    expect(urls).toContain('https://custom-domain.com/login')

    // Restore environment variable
    process.env.NEXT_PUBLIC_APP_URL = originalEnv
  })
})
